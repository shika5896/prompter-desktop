import type { JSX } from 'solid-js'
import settingsStore from '../../stores/settingsStore'
import './DisplayContainer.css'

interface DisplayContainerProps {
  children: JSX.Element
}

export default function DisplayContainer(props: DisplayContainerProps) {
  return (
    <div
      class="display-container"
      style={{
        transform: settingsStore.settings.display.mirror ? 'scaleX(-1)' : 'none',
      }}
    >
      {props.children}
    </div>
  )
}
