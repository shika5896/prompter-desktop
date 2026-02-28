use crate::models::manuscript::Segment;
use lindera::dictionary::load_dictionary;
use lindera::mode::Mode;
use lindera::segmenter::Segmenter;
use lindera::tokenizer::Tokenizer;
use std::cell::RefCell;

thread_local! {
    static TOKENIZER: RefCell<Option<Tokenizer>> = RefCell::new(None);
}

fn get_or_init_tokenizer<F, R>(f: F) -> Result<R, String>
where
    F: FnOnce(&Tokenizer) -> Result<R, String>,
{
    TOKENIZER.with(|cell| {
        let mut opt = cell.borrow_mut();
        if opt.is_none() {
            let dictionary = load_dictionary("embedded://ipadic")
                .map_err(|e| format!("Failed to load dictionary: {}", e))?;
            let segmenter = Segmenter::new(Mode::Normal, dictionary, None);
            *opt = Some(Tokenizer::new(segmenter));
        }
        f(opt.as_ref().unwrap())
    })
}

fn katakana_to_hiragana(input: &str) -> String {
    input
        .chars()
        .map(|c| {
            let code = c as u32;
            if (0x30A1..=0x30F6).contains(&code) {
                char::from_u32(code - 0x60).unwrap_or(c)
            } else {
                c
            }
        })
        .collect()
}

fn is_kanji_char(c: char) -> bool {
    matches!(c as u32, 0x4E00..=0x9FFF | 0x3400..=0x4DBF)
}

fn contains_kanji(s: &str) -> bool {
    s.chars().any(is_kanji_char)
}

/// Group characters into alternating runs of kanji / non-kanji
fn group_by_char_type(s: &str) -> Vec<(bool, String)> {
    let mut groups: Vec<(bool, String)> = Vec::new();
    for c in s.chars() {
        let is_k = is_kanji_char(c);
        if let Some(last) = groups.last_mut() {
            if last.0 == is_k {
                last.1.push(c);
                continue;
            }
        }
        groups.push((is_k, c.to_string()));
    }
    groups
}

/// Split a token with mixed kanji/kana into segments where only kanji parts get ruby.
/// e.g. surface="お忙しい" reading="おいそがしい"
///   → [Text("お"), Ruby("忙","いそが"), Text("しい")]
fn split_ruby(surface: &str, reading: &str) -> Vec<Segment> {
    let groups = group_by_char_type(surface);

    // Single group (all kanji) → one Ruby segment
    if groups.len() == 1 {
        return vec![Segment::Ruby {
            base: surface.to_string(),
            reading: reading.to_string(),
        }];
    }

    let reading_chars: Vec<char> = reading.chars().collect();
    let mut segments: Vec<Segment> = Vec::new();
    let mut r_pos: usize = 0;

    for (i, (is_kanji, text)) in groups.iter().enumerate() {
        if !*is_kanji {
            // Non-kanji group should appear literally in reading (as hiragana)
            let hiragana = katakana_to_hiragana(text);
            let h_len = hiragana.chars().count();

            if r_pos + h_len <= reading_chars.len() {
                let slice: String = reading_chars[r_pos..r_pos + h_len].iter().collect();
                if slice == hiragana {
                    segments.push(Segment::Text { content: text.clone() });
                    r_pos += h_len;
                    continue;
                }
            }
            // Mismatch — fallback: whole token as single Ruby
            return vec![Segment::Ruby {
                base: surface.to_string(),
                reading: reading.to_string(),
            }];
        } else {
            // Kanji group — find the next kana anchor to determine reading boundary
            let next_kana = if i + 1 < groups.len() && !groups[i + 1].0 {
                Some(katakana_to_hiragana(&groups[i + 1].1))
            } else {
                None
            };

            if let Some(anchor) = next_kana {
                let anchor_chars: Vec<char> = anchor.chars().collect();
                let anchor_len = anchor_chars.len();
                let mut found = false;

                for j in r_pos..=reading_chars.len().saturating_sub(anchor_len) {
                    let slice: String = reading_chars[j..j + anchor_len].iter().collect();
                    if slice == anchor {
                        let kanji_reading: String =
                            reading_chars[r_pos..j].iter().collect();
                        if !kanji_reading.is_empty() {
                            segments.push(Segment::Ruby {
                                base: text.clone(),
                                reading: kanji_reading,
                            });
                        }
                        r_pos = j; // next iteration will consume the anchor
                        found = true;
                        break;
                    }
                }

                if !found {
                    return vec![Segment::Ruby {
                        base: surface.to_string(),
                        reading: reading.to_string(),
                    }];
                }
            } else {
                // Last group or no kana anchor — consume remaining reading
                let kanji_reading: String = reading_chars[r_pos..].iter().collect();
                if !kanji_reading.is_empty() {
                    segments.push(Segment::Ruby {
                        base: text.clone(),
                        reading: kanji_reading,
                    });
                }
                r_pos = reading_chars.len();
            }
        }
    }

    segments
}

/// Merge adjacent Text segments
fn merge_text_segments(segments: Vec<Segment>) -> Vec<Segment> {
    let mut merged: Vec<Segment> = Vec::new();
    for seg in segments {
        if let Segment::Text { ref content } = seg {
            if let Some(Segment::Text {
                content: ref mut prev,
            }) = merged.last_mut()
            {
                prev.push_str(content);
                continue;
            }
        }
        merged.push(seg);
    }
    if merged.is_empty() {
        merged.push(Segment::Text {
            content: String::new(),
        });
    }
    merged
}

#[tauri::command]
pub fn auto_furigana(text: String) -> Result<Vec<Segment>, String> {
    if text.trim().is_empty() {
        return Ok(vec![Segment::Text { content: text }]);
    }

    get_or_init_tokenizer(|tokenizer| {
        let mut tokens = tokenizer
            .tokenize(&text)
            .map_err(|e| format!("Tokenization failed: {}", e))?;

        let mut segments: Vec<Segment> = Vec::new();

        for token in tokens.iter_mut() {
            let surface = token.surface.as_ref().to_string();

            if contains_kanji(&surface) {
                // Get reading from IPADIC details (index 7)
                let reading = token.get_detail(7);
                match reading {
                    Some(r) if r != "*" => {
                        let hiragana = katakana_to_hiragana(r);
                        let sub = split_ruby(&surface, &hiragana);
                        segments.extend(sub);
                    }
                    _ => {
                        // No reading available, keep as text
                        segments.push(Segment::Text { content: surface });
                    }
                }
            } else {
                segments.push(Segment::Text { content: surface });
            }
        }

        Ok(merge_text_segments(segments))
    })
}
