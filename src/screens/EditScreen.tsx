import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { open, save } from '@tauri-apps/plugin-dialog'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useI18n } from '../i18n'
import manuscriptStore from '../stores/manuscriptStore'
import settingsStore from '../stores/settingsStore'
import { readTextFile, autoFurigana } from '../commands/tauri'
import type { Segment, Manuscript } from '../types/manuscript'
import { mergeAdjacentText } from '../utils/segments'
import type { SegmentSelection } from '../components/editor/SlideEditor'
import SlideList from '../components/editor/SlideList'
import EditorToolbar from '../components/editor/EditorToolbar'
import SlideEditor from '../components/editor/SlideEditor'
import RubyDialog from '../components/editor/RubyDialog'
import KeyAssignDialog from '../components/editor/KeyAssignDialog'
import ImportDialog from '../components/editor/ImportDialog'
import FindReplaceBar from '../components/editor/FindReplaceBar'
import PreviewModal from '../components/editor/PreviewModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import './EditScreen.css'

export default function EditScreen() {
  const t = useI18n()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = createSignal(false)
  const [showRubyDialog, setShowRubyDialog] = createSignal(false)
  const [showKeyDialog, setShowKeyDialog] = createSignal(false)
  const [showConfirmLeave, setShowConfirmLeave] = createSignal(false)
  const [showImportDialog, setShowImportDialog] = createSignal(false)
  const [showFind, setShowFind] = createSignal(false)
  const [showReplace, setShowReplace] = createSignal(false)
  const [importText, setImportText] = createSignal('')
  const [importFileName, setImportFileName] = createSignal('')
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null)

  // Ruby dialog state
  const [rubyBase, setRubyBase] = createSignal('')
  const [rubyReading, setRubyReading] = createSignal('')
  const [editingRubyIndex, setEditingRubyIndex] = createSignal<number | null>(null)

  // Selection state for adding ruby
  const [selection, setSelection] = createSignal<SegmentSelection | null>(null)
  // Saved selection for ruby dialog (persists after editor loses focus)
  const [savedSelection, setSavedSelection] = createSignal<SegmentSelection | null>(null)

  // Keyboard shortcuts
  function handleKeyDown(e: KeyboardEvent) {
    // Let input/textarea handle their own undo/redo
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault()
          handleSave()
          break
        case 'o':
          e.preventDefault()
          handleLoad()
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            manuscriptStore.redo()
          } else {
            manuscriptStore.undo()
          }
          break
        case 'y':
          e.preventDefault()
          manuscriptStore.redo()
          break
        case 'n':
          e.preventDefault()
          handleNew()
          break
        case 'f':
          e.preventDefault()
          setShowFind(true)
          setShowReplace(false)
          break
        case 'h':
          e.preventDefault()
          setShowFind(true)
          setShowReplace(true)
          break
      }
    }
  }

  let unlistenClose: (() => void) | null = null
  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown)

    // Guard window close (Alt+F4, title bar ×) when unsaved
    getCurrentWindow().onCloseRequested(async (event) => {
      if (manuscriptStore.isDirty()) {
        event.preventDefault()
        setShowConfirmLeave(true)
        pendingCloseWindow = true
      }
    }).then(fn => { unlistenClose = fn })

    // Auto-open last file
    const lastPath = settingsStore.settings.general.last_file_path
    if (settingsStore.settings.general.auto_open_last_file && lastPath && !manuscriptStore.filePath()) {
      manuscriptStore.load(lastPath).catch(() => {
        // File not found or unreadable — clear stale path
        settingsStore.setLastFilePath(null)
        settingsStore.save().catch(() => {})
      })
    }

    // Auto-save interval (30 seconds)
    autoSaveTimer = setInterval(() => {
      const path = manuscriptStore.filePath()
      if (settingsStore.settings.general.auto_save && path && manuscriptStore.isDirty()) {
        manuscriptStore.save(path).catch(() => {})
      }
    }, 30_000)
  })

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown)
    unlistenClose?.()
    if (autoSaveTimer) clearInterval(autoSaveTimer)
  })

  function showError(msg: string) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 4000)
  }

  function handleNew() {
    if (manuscriptStore.isDirty()) {
      pendingCloseWindow = false
      setShowConfirmLeave(true)
      // After confirm, create new manuscript
      pendingNewManuscript = true
    } else {
      manuscriptStore.newManuscript()
    }
  }

  async function handleLoad() {
    const path = await open({
      multiple: false,
      filters: [{ name: 'TOML', extensions: ['toml'] }],
    })
    if (path) {
      try {
        await manuscriptStore.load(path as string)
      } catch (e) {
        showError(String(e))
      }
    }
  }

  async function handleSave() {
    let path = manuscriptStore.filePath()
    if (!path) {
      const result = await save({
        filters: [{ name: 'TOML', extensions: ['toml'] }],
        defaultPath: `${manuscriptStore.manuscript.title || 'manuscript'}.toml`,
      })
      if (!result) return
      path = result
    }
    try {
      await manuscriptStore.save(path)
    } catch (e) {
      showError(String(e))
    }
  }

  // ── Import ──

  let pendingImportPath: string | null = null

  async function handleImportText() {
    const path = await open({
      multiple: false,
      filters: [{ name: 'Text', extensions: ['txt'] }],
    })
    if (path) {
      if (manuscriptStore.isDirty()) {
        pendingImportPath = path as string
        pendingCloseWindow = false
        pendingNewManuscript = false
        setShowConfirmLeave(true)
      } else {
        await openImportDialog(path as string)
      }
    }
  }

  async function openImportDialog(path: string) {
    try {
      const text = await readTextFile(path)
      // Extract filename without extension
      const name = path.replace(/\\/g, '/').split('/').pop()?.replace(/\.txt$/i, '') || ''
      setImportText(text)
      setImportFileName(name)
      setShowImportDialog(true)
    } catch (e) {
      showError(String(e))
    }
  }

  function handleImportConfirm(slides: string[]) {
    const manuscript: Manuscript = {
      title: importFileName(),
      created: new Date().toISOString(),
      slides: slides.map(text => ({
        segments: [{ type: 'text' as const, content: text }],
      })),
    }
    manuscriptStore.importManuscript(manuscript)
    setShowImportDialog(false)
  }

  // ── Auto furigana ──

  async function handleAutoFurigana() {
    const slideIdx = manuscriptStore.currentSlideIndex()
    const slide = manuscriptStore.manuscript.slides[slideIdx]
    if (!slide) return
    const text = slide.segments
      .map(seg => seg.type === 'text' ? seg.content : seg.base)
      .join('')
    if (!text.trim()) return
    try {
      const segments = await autoFurigana(text)
      manuscriptStore.updateSegments(slideIdx, segments)
    } catch (e) {
      showError(String(e))
    }
  }

  async function handleAutoFuriganaAll() {
    const slides = manuscriptStore.manuscript.slides
    if (slides.length === 0) return
    try {
      manuscriptStore.snapshotForUndo()
      for (let i = 0; i < slides.length; i++) {
        const text = slides[i].segments
          .map(seg => seg.type === 'text' ? seg.content : seg.base)
          .join('')
        if (!text.trim()) continue
        const segments = await autoFurigana(text)
        manuscriptStore.updateSegmentsSilent(i, segments)
      }
    } catch (e) {
      showError(String(e))
    }
  }

  // ── Ruby operations ──

  function handleAddRuby() {
    const sel = selection()
    if (!sel || !sel.text) return

    setSavedSelection(sel)
    setRubyBase(sel.text)
    setRubyReading('')
    setEditingRubyIndex(null)
    setShowRubyDialog(true)
  }

  /** Remove ALL ruby segments, converting to text */
  function handleRemoveAllRuby() {
    const slideIdx = manuscriptStore.currentSlideIndex()
    const slide = manuscriptStore.manuscript.slides[slideIdx]
    if (!slide) return

    const newSegments: Segment[] = slide.segments.map(seg =>
      seg.type === 'ruby' ? { type: 'text' as const, content: seg.base } : { ...seg }
    )

    const merged = mergeAdjacentText(newSegments)
    manuscriptStore.updateSegments(slideIdx, merged)
  }

  function handleRubyConfirm(base: string, reading: string) {
    const slideIdx = manuscriptStore.currentSlideIndex()
    const slide = manuscriptStore.manuscript.slides[slideIdx]
    if (!slide) return

    const editIdx = editingRubyIndex()
    if (editIdx !== null) {
      // Editing existing ruby
      const newSegments = slide.segments.map((seg, i) =>
        i === editIdx ? { type: 'ruby' as const, base, reading } : { ...seg }
      )
      manuscriptStore.updateSegments(slideIdx, newSegments)
    } else {
      // Adding new ruby from saved selection
      const sel = savedSelection()
      if (!sel) return

      // Find and split the text segment containing the selection using model offsets
      let modelPos = 0
      const newSegments: Segment[] = []
      let handled = false

      for (const seg of slide.segments) {
        if (handled) {
          newSegments.push({ ...seg })
          continue
        }

        if (seg.type === 'text') {
          const segStart = modelPos
          const segEnd = modelPos + seg.content.length

          if (sel.start >= segStart && sel.end <= segEnd) {
            // Selection is within this text segment
            const localStart = sel.start - segStart
            const localEnd = sel.end - segStart
            const before = seg.content.slice(0, localStart)
            const after = seg.content.slice(localEnd)

            if (before) newSegments.push({ type: 'text', content: before })
            newSegments.push({ type: 'ruby', base, reading })
            if (after) newSegments.push({ type: 'text', content: after })
            handled = true
          } else {
            newSegments.push({ ...seg })
          }
          modelPos = segEnd
        } else {
          newSegments.push({ ...seg })
          modelPos += seg.base.length
        }
      }

      manuscriptStore.updateSegments(slideIdx, newSegments)
    }

    setShowRubyDialog(false)
    setSelection(null)
    setSavedSelection(null)
  }

  function handleRubyClick(segIndex: number) {
    const slide = manuscriptStore.manuscript.slides[manuscriptStore.currentSlideIndex()]
    const seg = slide?.segments[segIndex]
    if (seg?.type === 'ruby') {
      setRubyBase(seg.base)
      setRubyReading(seg.reading)
      setEditingRubyIndex(segIndex)
      setShowRubyDialog(true)
    }
  }

  function handleKeyAssign() {
    setShowKeyDialog(true)
  }

  function handleKeyConfirm(key: string | undefined) {
    manuscriptStore.setSlideKeyBinding(manuscriptStore.currentSlideIndex(), key)
    setShowKeyDialog(false)
  }

  // ── Navigation guard (window close only) ──

  let pendingCloseWindow = false
  let pendingNewManuscript = false

  function confirmLeave() {
    setShowConfirmLeave(false)
    if (pendingCloseWindow) {
      pendingCloseWindow = false
      getCurrentWindow().destroy()
    } else if (pendingNewManuscript) {
      pendingNewManuscript = false
      manuscriptStore.newManuscript()
    } else if (pendingImportPath) {
      const path = pendingImportPath
      pendingImportPath = null
      openImportDialog(path)
    }
  }

  return (
    <div class="edit-screen">
      <EditorToolbar
        title={manuscriptStore.manuscript.title}
        onTitleChange={v => manuscriptStore.setTitle(v)}
        isDirty={manuscriptStore.isDirty()}
        errorMsg={errorMsg()}
        onAddRuby={handleAddRuby}
        onRemoveRuby={handleRemoveAllRuby}
        onAutoFurigana={handleAutoFurigana}
        onAutoFuriganaAll={handleAutoFuriganaAll}
        onLoad={handleLoad}
        onSave={handleSave}
        onImport={handleImportText}
        onTogglePreview={() => setShowPreview(!showPreview())}
        onKeyAssign={handleKeyAssign}
        onDisplay={() => navigate('/display')}
        onSettings={() => navigate('/settings')}
        showPreview={showPreview()}
      />

      <Show when={showFind()}>
        <FindReplaceBar
          showReplace={showReplace()}
          onClose={() => setShowFind(false)}
        />
      </Show>

      <div class="edit-body">
        <SlideList />
        <div class="edit-main">
          <SlideEditor
            onSelectionChange={setSelection}
            onRubyClick={handleRubyClick}
          />
        </div>
      </div>

      <PreviewModal open={showPreview()} onClose={() => setShowPreview(false)} />

      <RubyDialog
        open={showRubyDialog()}
        base={rubyBase()}
        reading={rubyReading()}
        onConfirm={handleRubyConfirm}
        onClose={() => setShowRubyDialog(false)}
      />

      <KeyAssignDialog
        open={showKeyDialog()}
        currentKey={manuscriptStore.manuscript.slides[manuscriptStore.currentSlideIndex()]?.key_binding}
        onConfirm={handleKeyConfirm}
        onClose={() => setShowKeyDialog(false)}
      />

      <ImportDialog
        open={showImportDialog()}
        text={importText()}
        onConfirm={handleImportConfirm}
        onClose={() => setShowImportDialog(false)}
      />

      <ConfirmDialog
        open={showConfirmLeave()}
        title={t('edit_unsaved_title')}
        message={t('edit_unsaved_message')}
        confirmLabel={t('edit_discard')}
        cancelLabel={t('edit_cancel')}
        onConfirm={confirmLeave}
        onCancel={() => setShowConfirmLeave(false)}
        danger
      />
    </div>
  )
}
