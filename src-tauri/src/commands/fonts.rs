use font_kit::source::SystemSource;

#[tauri::command]
pub fn list_system_fonts() -> Result<Vec<String>, String> {
    let source = SystemSource::new();
    let mut families = source
        .all_families()
        .map_err(|e| format!("Failed to enumerate fonts: {}", e))?;
    families.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
    families.dedup();
    Ok(families)
}
