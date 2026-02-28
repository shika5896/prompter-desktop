import { useI18n } from '../../i18n'
import './SlideIndicator.css'

interface SlideIndicatorProps {
  current: number
  total: number
}

export default function SlideIndicator(props: SlideIndicatorProps) {
  const t = useI18n()
  return (
    <div class="slide-indicator">
      {t('display_slide')} {props.current + 1} / {props.total}
    </div>
  )
}
