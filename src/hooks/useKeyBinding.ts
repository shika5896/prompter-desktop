import { onMount, onCleanup } from 'solid-js'
import type { Slide } from '../types/manuscript'

interface UseKeyBindingOptions {
  slides: () => Slide[]
  onNext: () => void
  onPrev: () => void
  onJump: (index: number) => void
  onFullscreenToggle: () => void
  onEscape: () => void
}

export function useKeyBinding(opts: UseKeyBindingOptions) {
  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault()
        opts.onNext()
        return
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault()
        opts.onPrev()
        return
      case 'F11':
        e.preventDefault()
        opts.onFullscreenToggle()
        return
      case 'Escape':
        e.preventDefault()
        opts.onEscape()
        return
    }

    // Check slide key bindings
    const slides = opts.slides()
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].key_binding && slides[i].key_binding === e.key) {
        e.preventDefault()
        opts.onJump(i)
        return
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
