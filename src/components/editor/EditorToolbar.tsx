import { useI18n } from '../../i18n'
import manuscriptStore from '../../stores/manuscriptStore'
import settingsStore from '../../stores/settingsStore'
import Button from '../common/Button'
import NumberInput from '../common/NumberInput'
import ColorPicker from '../common/ColorPicker'
import './EditorToolbar.css'

interface EditorToolbarProps {
  onAddRuby: () => void
  onRemoveRuby: () => void
  onAutoFurigana: () => void
  onAutoFuriganaAll: () => void
  onLoad: () => void
  onSave: () => void
  onImport: () => void
  onTogglePreview: () => void
  onKeyAssign: () => void
  onDisplay: () => void
  onSettings: () => void
  showPreview: boolean
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const t = useI18n()
  const idx = () => manuscriptStore.currentSlideIndex()
  const slide = () => manuscriptStore.manuscript.slides[idx()]

  return (
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <Button size="sm" variant="ghost" onClick={props.onLoad} title="Ctrl+O">
          {t('edit_load')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onSave} title="Ctrl+S">
          {t('edit_save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onImport}>
          {t('edit_import')}
        </Button>
      </div>

      <div class="toolbar-separator" />

      <div class="toolbar-group">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => manuscriptStore.undo()}
          disabled={!manuscriptStore.canUndo()}
          title="Ctrl+Z"
        >
          {t('edit_undo')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => manuscriptStore.redo()}
          disabled={!manuscriptStore.canRedo()}
          title="Ctrl+Y"
        >
          {t('edit_redo')}
        </Button>
      </div>

      <div class="toolbar-separator" />

      <div class="toolbar-group">
        <NumberInput
          label={t('edit_font_size')}
          value={slide()?.font_size ?? settingsStore.settings.font.default_size}
          onChange={v => manuscriptStore.setSlideFontSize(idx(), v)}
          min={12}
          max={200}
        />
        <ColorPicker
          label={t('edit_font_color')}
          value={slide()?.font_color ?? settingsStore.settings.font.default_color}
          onChange={v => manuscriptStore.setSlideFontColor(idx(), v)}
        />
      </div>

      <div class="toolbar-separator" />

      <div class="toolbar-group">
        <Button size="sm" variant="ghost" onClick={props.onAddRuby}>
          {t('edit_add_ruby')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onRemoveRuby}>
          {t('edit_remove_ruby')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onAutoFurigana}>
          {t('edit_auto_furigana')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onAutoFuriganaAll}>
          {t('edit_auto_furigana_all')}
        </Button>
      </div>

      <div class="toolbar-separator" />

      <div class="toolbar-group">
        <Button size="sm" variant="ghost" onClick={props.onKeyAssign}>
          {t('edit_key_assign')}
        </Button>
        <Button
          size="sm"
          variant={props.showPreview ? 'primary' : 'ghost'}
          onClick={props.onTogglePreview}
        >
          {t('edit_preview')}
        </Button>
      </div>

      <div class="toolbar-separator" />

      <div class="toolbar-group">
        <Button size="sm" variant="ghost" onClick={props.onDisplay}>
          {t('edit_display')}
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onSettings}>
          {t('edit_settings')}
        </Button>
      </div>
    </div>
  )
}
