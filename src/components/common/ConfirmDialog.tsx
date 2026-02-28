import { Show } from 'solid-js'
import Button from './Button'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Show when={props.open}>
      <div class="confirm-backdrop" onClick={props.onCancel}>
        <div class="confirm-content" onClick={e => e.stopPropagation()}>
          <h3 class="confirm-title">{props.title}</h3>
          <p class="confirm-message">{props.message}</p>
          <div class="confirm-actions">
            <Button variant="secondary" onClick={props.onCancel}>
              {props.cancelLabel}
            </Button>
            <Button variant={props.danger ? 'danger' : 'primary'} onClick={props.onConfirm}>
              {props.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  )
}
