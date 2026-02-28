import { For, createSignal } from 'solid-js'
import { useI18n } from '../../i18n'
import manuscriptStore from '../../stores/manuscriptStore'
import Button from '../common/Button'
import './SlideList.css'

export default function SlideList() {
  const t = useI18n()
  const [dragIndex, setDragIndex] = createSignal<number | null>(null)
  const [dropTarget, setDropTarget] = createSignal<number | null>(null)

  function handleDragStart(index: number, e: DragEvent) {
    setDragIndex(index)
    e.dataTransfer!.effectAllowed = 'move'
  }

  function handleDragOver(index: number, e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    setDropTarget(index)
  }

  function handleDrop(index: number) {
    const from = dragIndex()
    if (from !== null && from !== index) {
      manuscriptStore.moveSlide(from, index)
    }
    setDragIndex(null)
    setDropTarget(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDropTarget(null)
  }

  return (
    <div class="slide-list">
      <div class="slide-list-header">
        <span>{t('edit_slide')}</span>
        <Button size="sm" variant="primary" onClick={() => manuscriptStore.addSlide()}>
          +
        </Button>
      </div>
      <div class="slide-list-items">
        <For each={manuscriptStore.manuscript.slides}>
          {(slide, i) => (
            <div
              class={`slide-item ${i() === manuscriptStore.currentSlideIndex() ? 'active' : ''} ${dropTarget() === i() ? 'drop-target' : ''}`}
              tabIndex={0}
              role="button"
              draggable={true}
              onDragStart={e => handleDragStart(i(), e)}
              onDragOver={e => handleDragOver(i(), e)}
              onDrop={() => handleDrop(i())}
              onDragEnd={handleDragEnd}
              onClick={() => manuscriptStore.setCurrentSlideIndex(i())}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  manuscriptStore.setCurrentSlideIndex(i())
                } else if (e.key === 'ArrowDown' && i() < manuscriptStore.manuscript.slides.length - 1) {
                  e.preventDefault()
                  const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement
                  next?.focus()
                } else if (e.key === 'ArrowUp' && i() > 0) {
                  e.preventDefault()
                  const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement
                  prev?.focus()
                }
              }}
            >
              <span class="slide-item-number">{i() + 1}</span>
              <span class="slide-item-preview">
                {slide.segments.map(s => s.type === 'text' ? s.content : s.base).join('').slice(0, 20) || t('edit_slide_empty')}
              </span>
              {slide.key_binding && (
                <span class="slide-item-key">{slide.key_binding}</span>
              )}
              <button
                class="slide-item-action slide-item-duplicate"
                onClick={e => { e.stopPropagation(); manuscriptStore.duplicateSlide(i()) }}
                title={t('edit_duplicate_slide')}
              >
                ⧉
              </button>
              {manuscriptStore.manuscript.slides.length > 1 && (
                <button
                  class="slide-item-action slide-item-delete"
                  onClick={e => { e.stopPropagation(); manuscriptStore.removeSlide(i()) }}
                  title={t('edit_remove_slide')}
                >
                  ×
                </button>
              )}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
