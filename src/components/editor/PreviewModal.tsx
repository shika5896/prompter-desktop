import { Show, onMount, onCleanup } from 'solid-js'
import { useI18n } from '../../i18n'
import manuscriptStore from '../../stores/manuscriptStore'
import SlideRenderer from '../display/SlideRenderer'
import DisplayContainer from '../display/DisplayContainer'
import './PreviewModal.css'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
}

export default function PreviewModal(props: PreviewModalProps) {
  const t = useI18n()

  function handleKeyDown(e: KeyboardEvent) {
    if (props.open && e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      props.onClose()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown, true)
  })

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown, true)
  })

  const idx = () => manuscriptStore.currentSlideIndex()
  const slide = () => manuscriptStore.manuscript.slides[idx()]
  const total = () => manuscriptStore.manuscript.slides.length

  return (
    <Show when={props.open}>
      <div class="preview-modal-overlay" onClick={() => props.onClose()}>
        <div class="preview-modal-body" onClick={(e) => e.stopPropagation()}>
          <DisplayContainer mirror={false}>
            <Show when={slide()}>
              <SlideRenderer slide={slide()!} />
            </Show>
          </DisplayContainer>

          <button class="preview-modal-close" onClick={() => props.onClose()}>
            × {t('edit_preview_close')}
          </button>

          <div class="preview-modal-indicator">
            {t('display_slide')} {idx() + 1} / {total()}
          </div>
        </div>
      </div>
    </Show>
  )
}
