mod commands;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::manuscript::read_text_file,
            commands::manuscript::load_manuscript,
            commands::manuscript::save_manuscript,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::furigana::auto_furigana,
            commands::fonts::list_system_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
