import { createSignal, createEffect, createMemo } from 'solid-js'
import { useI18n } from '../../i18n'
import Modal from '../common/Modal'
import Button from '../common/Button'
import './ImportDialog.css'

interface ImportDialogProps {
  open: boolean
  text: string
  onConfirm: (slides: string[]) => void
  onClose: () => void
}

export default function ImportDialog(props: ImportDialogProps) {
  const t = useI18n()
  const [delimiter, setDelimiter] = createSignal('---')

  createEffect(() => {
    if (props.open) {
      setDelimiter('---')
    }
  })

  const slides = createMemo(() => {
    const d = delimiter().trim()
    if (!props.text) return []
    if (!d) return [props.text.trim()].filter(s => s.length > 0)
    return props.text
      .split(d)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  })

  function handleConfirm() {
    const result = slides()
    if (result.length > 0) {
      props.onConfirm(result)
    }
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title={t('edit_import_title')}>
      <div class="import-dialog-form">
        <div class="import-dialog-field">
          <label>{t('edit_import_delimiter')}</label>
          <input
            type="text"
            value={delimiter()}
            onInput={e => setDelimiter(e.currentTarget.value)}
          />
        </div>
        <div class="import-dialog-preview">
          {slides().length}{t('edit_import_preview')}
        </div>
        <div class="import-dialog-actions">
          <Button variant="secondary" onClick={props.onClose}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={slides().length === 0}>{t('ok')}</Button>
        </div>
      </div>
    </Modal>
  )
}
