import { type JSX, createSignal, onMount, onCleanup } from 'solid-js'
import settingsStore from '../../stores/settingsStore'
import './DisplayContainer.css'

interface DisplayContainerProps {
  children: JSX.Element
  /** Override mirror setting. When omitted, uses store value. */
  mirror?: boolean
}

export default function DisplayContainer(props: DisplayContainerProps) {
  let outerRef!: HTMLDivElement

  const [scale, setScale] = createSignal(1)

  const mirror = () => props.mirror ?? settingsStore.settings.display.mirror
  const virtualW = () => settingsStore.settings.display.resolution_width
  const virtualH = () => settingsStore.settings.display.resolution_height

  function updateScale() {
    if (!outerRef) return
    const rect = outerRef.getBoundingClientRect()
    const s = Math.min(rect.width / virtualW(), rect.height / virtualH())
    setScale(s)
  }

  let ro: ResizeObserver | undefined

  onMount(() => {
    ro = new ResizeObserver(updateScale)
    ro.observe(outerRef)
    updateScale()
  })

  onCleanup(() => {
    ro?.disconnect()
  })

  return (
    <div
      ref={outerRef}
      class="display-container"
      style={{
        transform: mirror() ? 'scaleX(-1)' : 'none',
      }}
    >
      <div
        class="display-virtual-canvas"
        style={{
          width: `${virtualW()}px`,
          height: `${virtualH()}px`,
          transform: `scale(${scale()})`,
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
