import { invoke } from '@tauri-apps/api/core'
import type { Manuscript, Segment } from '../types/manuscript'
import type { AppSettings } from '../types/settings'

export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path })
}

export async function loadManuscript(path: string): Promise<Manuscript> {
  return invoke<Manuscript>('load_manuscript', { path })
}

export async function saveManuscript(path: string, manuscript: Manuscript): Promise<void> {
  return invoke('save_manuscript', { path, manuscript })
}

export async function loadSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('load_settings')
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke('save_settings', { settings })
}

export async function autoFurigana(text: string): Promise<Segment[]> {
  return invoke<Segment[]>('auto_furigana', { text })
}
