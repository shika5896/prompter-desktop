import { Show, type JSX } from 'solid-js'
import './Modal.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: JSX.Element
}

export default function Modal(props: ModalProps) {
  let contentRef!: HTMLDivElement

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) props.onClose()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      props.onClose()
      return
    }
    if (e.key === 'Tab' && contentRef) {
      const focusable = contentRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  function focusFirst() {
    if (!contentRef) return
    const focusable = contentRef.querySelector<HTMLElement>(
      'input, select, textarea, button:not(.modal-close)'
    )
    focusable?.focus()
  }

  return (
    <Show when={props.open}>
      <div class="modal-backdrop" onClick={handleBackdrop} onKeyDown={handleKeyDown}>
        <div class="modal-content" ref={contentRef} role="dialog" aria-modal="true" aria-label={props.title}>
          <div class="modal-header">
            <h3 class="modal-title">{props.title}</h3>
            <button class="modal-close" onClick={props.onClose} aria-label="Close">×</button>
          </div>
          <div class="modal-body" ref={() => setTimeout(focusFirst, 50)}>
            {props.children}
          </div>
        </div>
      </div>
    </Show>
  )
}
