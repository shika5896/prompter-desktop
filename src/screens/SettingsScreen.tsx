import { createSignal, Show, createMemo } from 'solid-js'
import { A } from '@solidjs/router'
import { useI18n } from '../i18n'
import settingsStore from '../stores/settingsStore'
import Button from '../components/common/Button'
import NumberInput from '../components/common/NumberInput'
import ColorPicker from '../components/common/ColorPicker'
import ToggleSwitch from '../components/common/ToggleSwitch'
import FontSelect from '../components/common/FontSelect'
import './SettingsScreen.css'

export default function SettingsScreen() {
  const t = useI18n()
  const [saved, setSaved] = createSignal(false)
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null)

  const RESOLUTION_PRESETS = [
    { label: '1920×1080', w: 1920, h: 1080 },
    { label: '1280×720', w: 1280, h: 720 },
    { label: '2560×1440', w: 2560, h: 1440 },
  ] as const

  const resolutionPreset = createMemo(() => {
    const w = settingsStore.settings.display.resolution_width
    const h = settingsStore.settings.display.resolution_height
    const found = RESOLUTION_PRESETS.find(p => p.w === w && p.h === h)
    return found ? found.label : 'custom'
  })

  function handleResolutionPreset(value: string) {
    if (value === 'custom') return
    const preset = RESOLUTION_PRESETS.find(p => p.label === value)
    if (preset) {
      settingsStore.setResolution(preset.w, preset.h)
    }
  }

  async function handleSave() {
    try {
      await settingsStore.save()
      setErrorMsg(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setErrorMsg(String(e))
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  return (
    <div class="settings-screen">
      <div class="settings-header">
        <A href="/" class="settings-back-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {t('settings_back')}
        </A>
        <h1>{t('settings_title')}</h1>
      </div>

      <div class="settings-body">
        {/* Font settings */}
        <section class="settings-card">
          <h2>{t('settings_font_section')}</h2>
          <div class="settings-field">
            <FontSelect
              label={t('settings_font_family')}
              value={settingsStore.settings.font.family}
              onChange={settingsStore.setFontFamily}
              fonts={settingsStore.systemFonts()}
            />
          </div>
          <div class="settings-field">
            <NumberInput
              label={t('settings_font_size')}
              value={settingsStore.settings.font.default_size}
              onChange={settingsStore.setFontSize}
              min={12}
              max={200}
            />
          </div>
          <div class="settings-field">
            <ColorPicker
              label={t('settings_font_color')}
              value={settingsStore.settings.font.default_color}
              onChange={settingsStore.setFontColor}
            />
          </div>
        </section>

        {/* Ruby settings */}
        <section class="settings-card">
          <h2>{t('settings_ruby_section')}</h2>
          <div class="settings-field">
            <FontSelect
              label={t('settings_font_family')}
              value={settingsStore.settings.ruby.family}
              onChange={settingsStore.setRubyFamily}
              fonts={settingsStore.systemFonts()}
            />
          </div>
          <div class="settings-field">
            <NumberInput
              label={t('settings_font_size')}
              value={settingsStore.settings.ruby.default_size}
              onChange={settingsStore.setRubySize}
              min={8}
              max={100}
            />
          </div>
          <div class="settings-field">
            <ColorPicker
              label={t('settings_font_color')}
              value={settingsStore.settings.ruby.default_color}
              onChange={settingsStore.setRubyColor}
            />
          </div>
        </section>

        {/* General settings */}
        <section class="settings-card">
          <h2>{t('settings_general_section')}</h2>
          <div class="settings-field">
            <label>{t('settings_language')}</label>
            <select
              value={settingsStore.settings.general.language}
              onChange={e => settingsStore.setLanguage(e.currentTarget.value as 'ja' | 'en')}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="settings-field">
            <label>{t('settings_theme')}</label>
            <select
              value={settingsStore.settings.general.theme}
              onChange={e => settingsStore.setTheme(e.currentTarget.value as 'dark' | 'light')}
            >
              <option value="dark">{t('settings_theme_dark')}</option>
              <option value="light">{t('settings_theme_light')}</option>
            </select>
          </div>
          <div class="settings-divider" />
          <ToggleSwitch
            label={t('settings_auto_open_last_file')}
            checked={settingsStore.settings.general.auto_open_last_file}
            onChange={settingsStore.setAutoOpenLastFile}
          />
          <ToggleSwitch
            label={t('settings_auto_save')}
            checked={settingsStore.settings.general.auto_save}
            onChange={settingsStore.setAutoSave}
          />
        </section>

        {/* Display settings */}
        <section class="settings-card">
          <h2>{t('settings_display_section')}</h2>
          <ToggleSwitch
            label={t('settings_mirror')}
            checked={settingsStore.settings.display.mirror}
            onChange={settingsStore.setMirror}
          />
          <div class="settings-divider" />
          <div class="settings-field">
            <label>{t('settings_resolution')}</label>
            <select
              value={resolutionPreset()}
              onChange={e => handleResolutionPreset(e.currentTarget.value)}
            >
              {RESOLUTION_PRESETS.map(p => (
                <option value={p.label}>{p.label}</option>
              ))}
              <option value="custom">{t('settings_resolution_custom')}</option>
            </select>
          </div>
          <Show when={resolutionPreset() === 'custom'}>
            <div class="settings-field settings-field-row">
              <NumberInput
                label={`${t('settings_resolution')} W`}
                value={settingsStore.settings.display.resolution_width}
                onChange={w => settingsStore.setResolution(w, settingsStore.settings.display.resolution_height)}
                min={640}
                max={7680}
              />
              <span class="settings-resolution-separator">×</span>
              <NumberInput
                label="H"
                value={settingsStore.settings.display.resolution_height}
                onChange={h => settingsStore.setResolution(settingsStore.settings.display.resolution_width, h)}
                min={360}
                max={4320}
              />
            </div>
          </Show>
        </section>
      </div>

      <div class="settings-footer">
        <Button variant="primary" size="lg" onClick={handleSave}>
          {t('settings_save')}
        </Button>
        <div class="settings-toast" classList={{ visible: saved() }}>
          {t('settings_saved')}
        </div>
        <div class="settings-toast settings-toast-error" classList={{ visible: !!errorMsg() }}>
          {errorMsg()}
        </div>
      </div>
    </div>
  )
}
