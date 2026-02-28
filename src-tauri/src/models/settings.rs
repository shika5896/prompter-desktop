use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontSettings {
    pub family: String,
    pub default_size: u32,
    pub default_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RubySettings {
    pub family: String,
    pub default_size: u32,
    pub default_color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralSettings {
    pub encoding: String,
    pub language: String,
    pub theme: String,
    #[serde(default)]
    pub auto_open_last_file: bool,
    #[serde(default)]
    pub auto_save: bool,
    #[serde(default)]
    pub last_file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplaySettings {
    pub mirror: bool,
    #[serde(default = "default_resolution_width")]
    pub resolution_width: u32,
    #[serde(default = "default_resolution_height")]
    pub resolution_height: u32,
}

fn default_resolution_width() -> u32 {
    1920
}

fn default_resolution_height() -> u32 {
    1080
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub font: FontSettings,
    pub ruby: RubySettings,
    pub general: GeneralSettings,
    pub display: DisplaySettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            font: FontSettings {
                family: "Noto Sans JP".to_string(),
                default_size: 48,
                default_color: "#FFFFFF".to_string(),
            },
            ruby: RubySettings {
                family: "Noto Sans JP".to_string(),
                default_size: 24,
                default_color: "#FFFFFF".to_string(),
            },
            general: GeneralSettings {
                encoding: "UTF-8".to_string(),
                language: "ja".to_string(),
                theme: "dark".to_string(),
                auto_open_last_file: false,
                auto_save: false,
                last_file_path: None,
            },
            display: DisplaySettings {
                mirror: true,
                resolution_width: 1920,
                resolution_height: 1080,
            },
        }
    }
}
