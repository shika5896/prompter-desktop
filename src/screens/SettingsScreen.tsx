import { createSignal } from 'solid-js'
import { A } from '@solidjs/router'
import { useI18n } from '../i18n'
import settingsStore from '../stores/settingsStore'
import Button from '../components/common/Button'
import NumberInput from '../components/common/NumberInput'
import ColorPicker from '../components/common/ColorPicker'
import './SettingsScreen.css'

export default function SettingsScreen() {
  const t = useI18n()
  const [saved, setSaved] = createSignal(false)
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null)

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
        <A href="/" class="settings-back-link">{t('settings_back')}</A>
        <h1>{t('settings_title')}</h1>
      </div>

      <div class="settings-body">
        {/* Font settings */}
        <section class="settings-section">
          <h2>{t('settings_font_section')}</h2>
          <div class="settings-field">
            <label>{t('settings_font_family')}</label>
            <input
              type="text"
              value={settingsStore.settings.font.family}
              onInput={e => settingsStore.setFontFamily(e.currentTarget.value)}
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
        <section class="settings-section">
          <h2>{t('settings_ruby_section')}</h2>
          <div class="settings-field">
            <label>{t('settings_font_family')}</label>
            <input
              type="text"
              value={settingsStore.settings.ruby.family}
              onInput={e => settingsStore.setRubyFamily(e.currentTarget.value)}
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
        <section class="settings-section">
          <h2>{t('settings_general_section')}</h2>
          <div class="settings-field">
            <label>{t('settings_encoding')}</label>
            <select
              value={settingsStore.settings.general.encoding}
              onChange={e => settingsStore.setEncoding(e.currentTarget.value)}
            >
              <option value="UTF-8">UTF-8</option>
              <option value="Shift_JIS">Shift_JIS</option>
              <option value="EUC-JP">EUC-JP</option>
            </select>
          </div>
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
        </section>

        {/* General toggles */}
        <section class="settings-section">
          <div class="settings-field settings-field-row">
            <label>
              <input
                type="checkbox"
                checked={settingsStore.settings.general.auto_open_last_file}
                onChange={e => settingsStore.setAutoOpenLastFile(e.currentTarget.checked)}
              />
              {t('settings_auto_open_last_file')}
            </label>
          </div>
          <div class="settings-field settings-field-row">
            <label>
              <input
                type="checkbox"
                checked={settingsStore.settings.general.auto_save}
                onChange={e => settingsStore.setAutoSave(e.currentTarget.checked)}
              />
              {t('settings_auto_save')}
            </label>
          </div>
        </section>

        {/* Display settings */}
        <section class="settings-section">
          <h2>{t('settings_display_section')}</h2>
          <div class="settings-field settings-field-row">
            <label>
              <input
                type="checkbox"
                checked={settingsStore.settings.display.mirror}
                onChange={e => settingsStore.setMirror(e.currentTarget.checked)}
              />
              {t('settings_mirror')}
            </label>
          </div>
        </section>
      </div>

      <div class="settings-footer">
        <Button variant="primary" size="lg" onClick={handleSave}>
          {t('settings_save')}
        </Button>
        {saved() && <span class="settings-saved-msg">{t('settings_saved')}</span>}
        {errorMsg() && <span class="settings-error-msg">{errorMsg()}</span>}
      </div>
    </div>
  )
}
