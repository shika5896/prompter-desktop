import { For, Index } from 'solid-js'
import type { Slide, Segment } from '../../types/manuscript'
import settingsStore from '../../stores/settingsStore'
import './SlideRenderer.css'

interface SlideRendererProps {
  slide: Slide
}

export default function SlideRenderer(props: SlideRendererProps) {
  const fontSize = () => props.slide.font_size ?? settingsStore.settings.font.default_size
  const fontColor = () => props.slide.font_color ?? settingsStore.settings.font.default_color
  const fontFamily = () => settingsStore.settings.font.family
  const rubySize = () => settingsStore.settings.ruby.default_size
  const rubyColor = () => settingsStore.settings.ruby.default_color
  const rubyFamily = () => settingsStore.settings.ruby.family

  /** Render text content with \n as <br> */
  function renderTextContent(content: string) {
    const parts = content.split('\n')
    return (
      <Index each={parts}>
        {(part, i) => (
          <>
            {i > 0 && <br />}
            {part()}
          </>
        )}
      </Index>
    )
  }

  return (
    <div
      class="slide-renderer"
      style={{
        'font-size': `${fontSize()}px`,
        'color': fontColor(),
        'font-family': fontFamily(),
      }}
    >
      <For each={props.slide.segments}>
        {(seg: Segment) => {
          if (seg.type === 'text') {
            return <span>{renderTextContent(seg.content)}</span>
          }
          return (
            <ruby style={{ 'font-family': rubyFamily() }}>
              {seg.base}
              <rp>(</rp>
              <rt style={{
                'font-size': `${rubySize()}px`,
                'color': rubyColor(),
                'font-family': rubyFamily(),
              }}>{seg.reading}</rt>
              <rp>)</rp>
            </ruby>
          )
        }}
      </For>
    </div>
  )
}
