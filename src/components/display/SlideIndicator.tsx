import './SlideIndicator.css'

interface SlideIndicatorProps {
  current: number
  total: number
}

export default function SlideIndicator(props: SlideIndicatorProps) {
  return (
    <div class="slide-indicator">
      {props.current + 1} / {props.total}
    </div>
  )
}
