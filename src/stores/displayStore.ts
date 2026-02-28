import { createRoot, createSignal } from 'solid-js'

function createDisplayStore() {
  const [slideIndex, setSlideIndex] = createSignal(0)
  const [totalSlides, setTotalSlides] = createSignal(0)
  const [isFullscreen, setIsFullscreen] = createSignal(false)

  function next() {
    setSlideIndex(i => Math.min(i + 1, totalSlides() - 1))
  }

  function prev() {
    setSlideIndex(i => Math.max(i - 1, 0))
  }

  function jumpTo(index: number) {
    if (index >= 0 && index < totalSlides()) {
      setSlideIndex(index)
    }
  }

  function reset(total: number) {
    setTotalSlides(total)
    setSlideIndex(0)
  }

  return {
    slideIndex,
    setSlideIndex,
    totalSlides,
    setTotalSlides,
    isFullscreen,
    setIsFullscreen,
    next,
    prev,
    jumpTo,
    reset,
  }
}

export default createRoot(createDisplayStore)
