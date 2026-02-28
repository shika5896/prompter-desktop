import { onMount, onCleanup } from 'solid-js'

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

/**
 * Listens for the Konami Code and calls the callback when completed.
 * The sequence resets after 2 seconds of inactivity.
 */
export function useKonami(onActivate: () => void) {
  let pos = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === KONAMI[pos].toLowerCase()) {
      pos++
      clearTimeout(timer)
      timer = setTimeout(() => { pos = 0 }, 2000)
      if (pos === KONAMI.length) {
        pos = 0
        clearTimeout(timer)
        onActivate()
      }
    } else {
      pos = 0
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown)
    clearTimeout(timer)
  })
}
