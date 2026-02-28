import { useI18n } from '../../i18n'
import SlideRenderer from '../display/SlideRenderer'
import manuscriptStore from '../../stores/manuscriptStore'
import './PreviewPanel.css'

export default function PreviewPanel() {
  const t = useI18n()
  const idx = () => manuscriptStore.currentSlideIndex()
  const slide = () => manuscriptStore.manuscript.slides[idx()]

  return (
    <div class="preview-panel">
      <div class="preview-panel-header">{t('edit_preview')}</div>
      <div class="preview-panel-content">
        {slide() && <SlideRenderer slide={slide()} />}
      </div>
    </div>
  )
}
