import { createSignal, createMemo, onCleanup, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import Button from '../common/Button'
import './KeyAssignDialog.css'

const RESERVED_KEYS = new Set([
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'PageUp', 'PageDown', 'F11', 'Escape',
])

interface KeyAssignDialogProps {
  open: boolean
  currentKey: string | undefined
  onConfirm: (key: string | undefined) => void
  onClose: () => void
}

export default function KeyAssignDialog(props: KeyAssignDialogProps) {
  const t = useI18n()
  const [capturedKey, setCapturedKey] = createSignal<string | undefined>(undefined)
  let listenerRef: ((e: KeyboardEvent) => void) | null = null

  function startCapture() {
    setCapturedKey(props.currentKey)
    stopCapture()

    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCapturedKey(e.key)
    }
    listenerRef = handler
    window.addEventListener('keydown', handler)
  }

  function stopCapture() {
    if (listenerRef) {
      window.removeEventListener('keydown', listenerRef)
      listenerRef = null
    }
  }

  onCleanup(stopCapture)

  function handleClose() {
    stopCapture()
    props.onClose()
  }

  const isReserved = createMemo(() => {
    const key = capturedKey()
    return key ? RESERVED_KEYS.has(key) : false
  })

  function handleConfirm() {
    if (isReserved()) return
    stopCapture()
    props.onConfirm(capturedKey())
  }

  function handleClear() {
    stopCapture()
    setCapturedKey(undefined)
    props.onConfirm(undefined)
  }

  return (
    <Show when={props.open}>
      <div class="confirm-backdrop" onClick={handleClose}>
        <div class="confirm-content key-assign-form" onClick={e => e.stopPropagation()} ref={(_el) => {
          // Start capturing when dialog mounts
          setTimeout(startCapture, 50)
        }}>
          <h3>{t('edit_key_dialog_title')}</h3>
          <p class="key-assign-prompt">{t('edit_key_dialog_prompt')}</p>
          <div class="key-assign-display">
            {capturedKey() ?? '—'}
          </div>
          {isReserved() && (
            <p class="key-assign-reserved">{t('edit_key_reserved')}</p>
          )}
          <div class="key-assign-actions">
            <Button variant="secondary" onClick={handleClear}>
              {t('edit_key_dialog_clear')}
            </Button>
            <Button variant="secondary" onClick={handleClose}>{t('cancel')}</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={isReserved()}>{t('ok')}</Button>
          </div>
        </div>
      </div>
    </Show>
  )
}
