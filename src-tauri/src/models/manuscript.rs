use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Segment {
    #[serde(rename = "text")]
    Text { content: String },
    #[serde(rename = "ruby")]
    Ruby { base: String, reading: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManuscriptFile {
    pub manuscript: ManuscriptMeta,
    pub slides: Vec<SlideEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManuscriptMeta {
    pub title: String,
    pub created: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlideEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_binding: Option<String>,
    pub segments: Vec<Segment>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_color: Option<String>,
}

/// Frontend-facing manuscript structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manuscript {
    pub title: String,
    pub created: String,
    pub slides: Vec<FrontendSlide>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendSlide {
    pub segments: Vec<Segment>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key_binding: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_color: Option<String>,
}
