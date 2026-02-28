import { Show } from 'solid-js'
import { useI18n } from '../../i18n'
import manuscriptStore from '../../stores/manuscriptStore'
import settingsStore from '../../stores/settingsStore'
import Button from '../common/Button'
import DropdownMenu from '../common/DropdownMenu'
import NumberInput from '../common/NumberInput'
import ColorPicker from '../common/ColorPicker'
import './EditorToolbar.css'

interface EditorToolbarProps {
  title: string
  onTitleChange: (v: string) => void
  isDirty: boolean
  errorMsg: string | null
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
    <div class="editor-toolbar-wrap">
      <div class="editor-toolbar-title-row">
        <input
          class="toolbar-title-input"
          type="text"
          placeholder={t('edit_manuscript_title')}
          value={props.title}
          onInput={e => props.onTitleChange(e.currentTarget.value)}
        />
        {props.isDirty && <span class="toolbar-dirty-indicator">●</span>}
        <Show when={props.errorMsg}>
          <span class="toolbar-error-msg">{props.errorMsg}</span>
        </Show>
      </div>

      <div class="editor-toolbar">
        <div class="toolbar-group">
          <DropdownMenu
            label={t('edit_file_menu')}
            items={[
              { label: t('edit_load'), shortcut: 'Ctrl+O', onClick: props.onLoad },
              { label: t('edit_save'), shortcut: 'Ctrl+S', onClick: props.onSave },
              { label: t('edit_import'), onClick: props.onImport },
            ]}
          />
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
          <DropdownMenu
            label={t('edit_ruby_menu')}
            items={[
              { label: t('edit_add_ruby'), onClick: props.onAddRuby },
              { label: t('edit_remove_ruby'), onClick: props.onRemoveRuby },
              { label: t('edit_auto_furigana'), onClick: props.onAutoFurigana },
              { label: t('edit_auto_furigana_all'), onClick: props.onAutoFuriganaAll },
            ]}
          />
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
    </div>
  )
}
