import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { AppSettings } from '../types/settings'
import { defaultSettings } from '../types/settings'
import { loadSettings as loadSettingsCmd, saveSettings as saveSettingsCmd } from '../commands/tauri'

function createSettingsStore() {
  const [settings, setSettings] = createStore<AppSettings>(structuredClone(defaultSettings))

  function applyTheme(theme: 'dark' | 'light') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  async function load() {
    try {
      const loaded = await loadSettingsCmd()
      setSettings(loaded)
      applyTheme(loaded.general.theme)
    } catch (e) {
      console.warn('Failed to load settings, using defaults:', e)
      applyTheme(settings.general.theme)
    }
  }

  async function save() {
    try {
      await saveSettingsCmd(JSON.parse(JSON.stringify(settings)))
    } catch (e) {
      console.error('Failed to save settings:', e)
      throw e
    }
  }

  function update(updater: (s: AppSettings) => Partial<AppSettings>) {
    const changes = updater(settings)
    setSettings(prev => ({ ...prev, ...changes }))
  }

  function setFontFamily(family: string) {
    setSettings('font', 'family', family)
  }
  function setFontSize(size: number) {
    setSettings('font', 'default_size', size)
  }
  function setFontColor(color: string) {
    setSettings('font', 'default_color', color)
  }
  function setRubyFamily(family: string) {
    setSettings('ruby', 'family', family)
  }
  function setRubySize(size: number) {
    setSettings('ruby', 'default_size', size)
  }
  function setRubyColor(color: string) {
    setSettings('ruby', 'default_color', color)
  }
  function setEncoding(encoding: string) {
    setSettings('general', 'encoding', encoding)
  }
  function setLanguage(lang: 'ja' | 'en') {
    setSettings('general', 'language', lang)
  }
  function setTheme(theme: 'dark' | 'light') {
    setSettings('general', 'theme', theme)
    applyTheme(theme)
    // Auto-persist theme change so it survives restart
    save().catch(() => {})
  }
  function setAutoOpenLastFile(enabled: boolean) {
    setSettings('general', 'auto_open_last_file', enabled)
  }
  function setAutoSave(enabled: boolean) {
    setSettings('general', 'auto_save', enabled)
  }
  function setLastFilePath(path: string | null) {
    setSettings('general', 'last_file_path', path)
  }
  function setMirror(mirror: boolean) {
    setSettings('display', 'mirror', mirror)
  }

  return {
    settings,
    load,
    save,
    update,
    setFontFamily,
    setFontSize,
    setFontColor,
    setRubyFamily,
    setRubySize,
    setRubyColor,
    setEncoding,
    setLanguage,
    setTheme,
    setAutoOpenLastFile,
    setAutoSave,
    setLastFilePath,
    setMirror,
  }
}

export default createRoot(createSettingsStore)
