import { onMount, onCleanup } from 'solid-js'

interface UseWheelNavigationOptions {
  onNext: () => void
  onPrev: () => void
  debounceMs?: number
}

export function useWheelNavigation(opts: UseWheelNavigationOptions) {
  const debounce = opts.debounceMs ?? 200
  let lastTime = 0

  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    const now = Date.now()
    if (now - lastTime < debounce) return
    lastTime = now

    if (e.deltaY > 0) {
      opts.onNext()
    } else if (e.deltaY < 0) {
      opts.onPrev()
    }
  }

  onMount(() => {
    window.addEventListener('wheel', handleWheel, { passive: false })
  })

  onCleanup(() => {
    window.removeEventListener('wheel', handleWheel)
  })
}
