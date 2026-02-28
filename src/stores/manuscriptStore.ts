import { createRoot, createSignal } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import type { Manuscript, Slide, Segment } from '../types/manuscript'
import { loadManuscript as loadCmd, saveManuscript as saveCmd } from '../commands/tauri'
import settingsStore from './settingsStore'

const UNDO_LIMIT = 50

function createEmptyManuscript(): Manuscript {
  return {
    title: '',
    created: new Date().toISOString(),
    slides: [{ segments: [{ type: 'text', content: '' }] }],
  }
}

function cloneSlides(slides: Slide[]): Slide[] {
  return JSON.parse(JSON.stringify(slides))
}

function createManuscriptStore() {
  const [manuscript, setManuscript] = createStore<Manuscript>(createEmptyManuscript())
  const [currentSlideIndex, setCurrentSlideIndex] = createSignal(0)
  const [filePath, setFilePath] = createSignal<string | null>(null)
  const [isDirty, setIsDirty] = createSignal(false)

  // Undo/Redo stacks
  let undoStack: Slide[][] = []
  let redoStack: Slide[][] = []
  // Reactive signals to track stack lengths (plain arrays aren't reactive)
  const [undoCount, setUndoCount] = createSignal(0)
  const [redoCount, setRedoCount] = createSignal(0)

  function pushUndo() {
    undoStack.push(cloneSlides(manuscript.slides))
    if (undoStack.length > UNDO_LIMIT) {
      undoStack.shift()
    }
    redoStack = []
    setUndoCount(undoStack.length)
    setRedoCount(0)
  }

  function undo() {
    if (undoStack.length === 0) return
    redoStack.push(cloneSlides(manuscript.slides))
    const prev = undoStack.pop()!
    setManuscript('slides', prev)
    setIsDirty(true)
    setUndoCount(undoStack.length)
    setRedoCount(redoStack.length)
  }

  function redo() {
    if (redoStack.length === 0) return
    undoStack.push(cloneSlides(manuscript.slides))
    const next = redoStack.pop()!
    setManuscript('slides', next)
    setIsDirty(true)
    setUndoCount(undoStack.length)
    setRedoCount(redoStack.length)
  }

  function canUndo() {
    return undoCount() > 0
  }

  function canRedo() {
    return redoCount() > 0
  }

  async function load(path: string) {
    const data = await loadCmd(path)
    setManuscript(data)
    setFilePath(path)
    setCurrentSlideIndex(0)
    setIsDirty(false)
    undoStack = []
    redoStack = []
    setUndoCount(0)
    setRedoCount(0)
  }

  async function save(path: string) {
    const data: Manuscript = JSON.parse(JSON.stringify(manuscript))
    await saveCmd(path, data)
    setFilePath(path)
    setIsDirty(false)
    // Remember last file path for auto-open
    settingsStore.setLastFilePath(path)
    settingsStore.save().catch(() => {})
  }

  function newManuscript() {
    setManuscript(createEmptyManuscript())
    setFilePath(null)
    setCurrentSlideIndex(0)
    setIsDirty(false)
    undoStack = []
    redoStack = []
    setUndoCount(0)
    setRedoCount(0)
  }

  function importManuscript(data: Manuscript) {
    setManuscript(data)
    setFilePath(null)
    setCurrentSlideIndex(0)
    setIsDirty(true)
    undoStack = []
    redoStack = []
    setUndoCount(0)
    setRedoCount(0)
  }

  function setTitle(title: string) {
    setManuscript('title', title)
    setIsDirty(true)
  }

  function addSlide(index?: number) {
    pushUndo()
    const newSlide: Slide = { segments: [{ type: 'text', content: '' }] }
    const idx = index ?? manuscript.slides.length
    setManuscript(produce(m => {
      m.slides.splice(idx, 0, newSlide)
    }))
    setCurrentSlideIndex(idx)
    setIsDirty(true)
  }

  function duplicateSlide(index: number) {
    const source = manuscript.slides[index]
    if (!source) return
    pushUndo()
    const clone: Slide = JSON.parse(JSON.stringify(source))
    const insertAt = index + 1
    setManuscript(produce(m => {
      m.slides.splice(insertAt, 0, clone)
    }))
    setCurrentSlideIndex(insertAt)
    setIsDirty(true)
  }

  function removeSlide(index: number) {
    if (manuscript.slides.length <= 1) return
    pushUndo()
    setManuscript(produce(m => {
      m.slides.splice(index, 1)
    }))
    if (currentSlideIndex() >= manuscript.slides.length) {
      setCurrentSlideIndex(manuscript.slides.length - 1)
    }
    setIsDirty(true)
  }

  function moveSlide(from: number, to: number) {
    if (from === to) return
    pushUndo()
    setManuscript(produce(m => {
      const [slide] = m.slides.splice(from, 1)
      m.slides.splice(to, 0, slide)
    }))
    setCurrentSlideIndex(to)
    setIsDirty(true)
  }

  /** Update segments WITH undo recording - use for explicit user actions (ruby add/remove, etc.) */
  function updateSegments(slideIndex: number, segments: Segment[]) {
    pushUndo()
    setManuscript('slides', slideIndex, 'segments', segments)
    setIsDirty(true)
  }

  /** Update segments WITHOUT undo recording - use for continuous typing in contenteditable */
  function updateSegmentsSilent(slideIndex: number, segments: Segment[]) {
    setManuscript('slides', slideIndex, 'segments', segments)
    setIsDirty(true)
  }

  /** Snapshot current state for undo before a batch of silent updates */
  function snapshotForUndo() {
    pushUndo()
  }

  function setSlideKeyBinding(slideIndex: number, key: string | undefined) {
    pushUndo()
    setManuscript('slides', slideIndex, 'key_binding', key)
    setIsDirty(true)
  }

  function setSlideFontSize(slideIndex: number, size: number | undefined) {
    pushUndo()
    setManuscript('slides', slideIndex, 'font_size', size)
    setIsDirty(true)
  }

  function setSlideFontColor(slideIndex: number, color: string | undefined) {
    pushUndo()
    setManuscript('slides', slideIndex, 'font_color', color)
    setIsDirty(true)
  }

  return {
    manuscript,
    currentSlideIndex,
    setCurrentSlideIndex,
    filePath,
    isDirty,
    load,
    save,
    newManuscript,
    importManuscript,
    setTitle,
    addSlide,
    duplicateSlide,
    removeSlide,
    moveSlide,
    updateSegments,
    updateSegmentsSilent,
    snapshotForUndo,
    setSlideKeyBinding,
    setSlideFontSize,
    setSlideFontColor,
    undo,
    redo,
    canUndo,
    canRedo,
    pushUndo,
  }
}

export default createRoot(createManuscriptStore)
