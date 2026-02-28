import { createSignal, createEffect } from 'solid-js'
import { useI18n } from '../../i18n'
import Modal from '../common/Modal'
import Button from '../common/Button'
import './RubyDialog.css'

interface RubyDialogProps {
  open: boolean
  base: string
  reading: string
  onConfirm: (base: string, reading: string) => void
  onClose: () => void
}

export default function RubyDialog(props: RubyDialogProps) {
  const t = useI18n()
  const [base, setBase] = createSignal('')
  const [reading, setReading] = createSignal('')
  let readingRef!: HTMLInputElement

  createEffect(() => {
    if (props.open) {
      setBase(props.base)
      setReading(props.reading)
      // Focus reading input after dialog renders
      setTimeout(() => readingRef?.focus(), 50)
    }
  })

  function handleConfirm() {
    if (base() && reading()) {
      props.onConfirm(base(), reading())
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm()
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title={t('edit_ruby_dialog_title')}>
      <div class="ruby-dialog-form">
        <div class="ruby-dialog-field">
          <label>{t('edit_ruby_base')}</label>
          <input
            type="text"
            value={base()}
            onInput={e => setBase(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div class="ruby-dialog-field">
          <label>{t('edit_ruby_reading')}</label>
          <input
            ref={readingRef}
            type="text"
            value={reading()}
            onInput={e => setReading(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div class="ruby-dialog-preview">
          <ruby>{base()}<rp>(</rp><rt>{reading()}</rt><rp>)</rp></ruby>
        </div>
        <div class="ruby-dialog-actions">
          <Button variant="secondary" onClick={props.onClose}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!base() || !reading()}>{t('ok')}</Button>
        </div>
      </div>
    </Modal>
  )
}
