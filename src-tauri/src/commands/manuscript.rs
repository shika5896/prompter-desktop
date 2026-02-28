use crate::models::manuscript::*;
use std::fs;

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn load_manuscript(path: String) -> Result<Manuscript, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
    let file: ManuscriptFile =
        toml::from_str(&content).map_err(|e| format!("Failed to parse TOML: {}", e))?;

    let slides = file
        .slides
        .into_iter()
        .map(|s| FrontendSlide {
            segments: s.segments,
            key_binding: s.key_binding,
            font_size: s.font_size,
            font_color: s.font_color,
        })
        .collect();

    Ok(Manuscript {
        title: file.manuscript.title,
        created: file.manuscript.created,
        slides,
    })
}

#[tauri::command]
pub fn save_manuscript(path: String, manuscript: Manuscript) -> Result<(), String> {
    let file = ManuscriptFile {
        manuscript: ManuscriptMeta {
            title: manuscript.title,
            created: manuscript.created,
        },
        slides: manuscript
            .slides
            .into_iter()
            .map(|s| SlideEntry {
                key_binding: s.key_binding,
                segments: s.segments,
                font_size: s.font_size,
                font_color: s.font_color,
            })
            .collect(),
    };

    let content =
        toml::to_string_pretty(&file).map_err(|e| format!("Failed to serialize TOML: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}
