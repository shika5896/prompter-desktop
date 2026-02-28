import { onMount, Show, createMemo } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useI18n } from '../i18n'
import manuscriptStore from '../stores/manuscriptStore'
import displayStore from '../stores/displayStore'
import { useKeyBinding } from '../hooks/useKeyBinding'
import { useWheelNavigation } from '../hooks/useWheelNavigation'
import SlideRenderer from '../components/display/SlideRenderer'
import SlideIndicator from '../components/display/SlideIndicator'
import DisplayContainer from '../components/display/DisplayContainer'
import './DisplayScreen.css'

export default function DisplayScreen() {
  const t = useI18n()
  const navigate = useNavigate()

  onMount(() => {
    displayStore.reset(manuscriptStore.manuscript.slides.length)
  })

  const currentSlide = createMemo(() => {
    const idx = displayStore.slideIndex()
    return manuscriptStore.manuscript.slides[idx]
  })

  async function toggleFullscreen() {
    const win = getCurrentWindow()
    const isFull = await win.isFullscreen()
    await win.setFullscreen(!isFull)
    displayStore.setIsFullscreen(!isFull)
  }

  async function handleEscape() {
    // Exit fullscreen first, then navigate to menu
    if (displayStore.isFullscreen()) {
      const win = getCurrentWindow()
      await win.setFullscreen(false)
      displayStore.setIsFullscreen(false)
    }
    navigate('/')
  }

  useKeyBinding({
    slides: () => manuscriptStore.manuscript.slides,
    onNext: () => displayStore.next(),
    onPrev: () => displayStore.prev(),
    onJump: (i) => displayStore.jumpTo(i),
    onFullscreenToggle: toggleFullscreen,
    onEscape: handleEscape,
  })

  useWheelNavigation({
    onNext: () => displayStore.next(),
    onPrev: () => displayStore.prev(),
  })

  return (
    <div class="display-screen">
      <Show when={!displayStore.isFullscreen()}>
        <div class="display-topbar">
          <button class="display-back" onClick={() => navigate('/')}>
            ← {t('display_exit')}
          </button>
          <button class="display-fullscreen-btn" onClick={toggleFullscreen}>
            {t('display_fullscreen')} (F11)
          </button>
        </div>
      </Show>

      <DisplayContainer>
        <Show when={currentSlide()}>
          <SlideRenderer slide={currentSlide()!} />
        </Show>
      </DisplayContainer>

      <SlideIndicator
        current={displayStore.slideIndex()}
        total={displayStore.totalSlides()}
      />
    </div>
  )
}
