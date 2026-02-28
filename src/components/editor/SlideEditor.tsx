import { createEffect, createSignal, on, onMount, onCleanup } from 'solid-js'
import type { Segment } from '../../types/manuscript'
import { mergeAdjacentText } from '../../utils/segments'
import manuscriptStore from '../../stores/manuscriptStore'
import settingsStore from '../../stores/settingsStore'
import './SlideEditor.css'

/** Selection info using segment-model based offsets */
export interface SegmentSelection {
  text: string
  /** Character offset in the "model text" (text contents + ruby bases concatenated) */
  start: number
  end: number
}

interface SlideEditorProps {
  onSelectionChange: (selection: SegmentSelection | null) => void
  onRubyClick: (segmentIndex: number) => void
}

export default function SlideEditor(props: SlideEditorProps) {
  let editorRef!: HTMLDivElement
  const idx = () => manuscriptStore.currentSlideIndex()
  const slide = () => manuscriptStore.manuscript.slides[idx()]
  const [isFocused, setIsFocused] = createSignal(false)

  // Track whether we're updating DOM from model to avoid feedback loop
  let suppressSync = false
  // Skip next model→DOM render (when change originated from DOM editing)
  let skipNextRender = false
  // Track IME composition state
  let isComposing = false
  // Debounce timer for undo snapshots
  let undoTimer: ReturnType<typeof setTimeout> | null = null

  // ── HTML generation from segments ──

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function segmentsToHtml(segments: Segment[]): string {
    return segments.map((seg, i) => {
      if (seg.type === 'text') {
        // Convert \n to <br> for display in contenteditable
        const html = escapeHtml(seg.content).replace(/\n/g, '<br>')
        return `<span data-seg="${i}" data-type="text">${html || '<br>'}</span>`
      } else {
        return `<ruby data-seg="${i}" data-type="ruby" contenteditable="false">${escapeHtml(seg.base)}<rp>(</rp><rt>${escapeHtml(seg.reading)}</rt><rp>)</rp></ruby>`
      }
    }).join('')
  }

  // ── DOM → Segment model sync ──

  /** Extract text from a DOM node, converting <br> and block elements to \n */
  function extractText(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // Strip zero-width spaces used for cursor placement after <br>
      return (node.textContent ?? '').replace(/\u200B/g, '')
    }
    if (node instanceof HTMLBRElement) {
      return '\n'
    }
    if (node instanceof HTMLElement) {
      // Block-level elements (div, p) that contenteditable may insert
      const tag = node.tagName.toLowerCase()
      let text = ''
      for (const child of Array.from(node.childNodes)) {
        text += extractText(child)
      }
      // div/p inserted by Enter in contenteditable should be treated as newline
      if ((tag === 'div' || tag === 'p') && !node.hasAttribute('data-type')) {
        return '\n' + text
      }
      return text
    }
    return ''
  }

  function syncFromDom() {
    if (suppressSync || isComposing) return

    const segments: Segment[] = []
    const nodes = editorRef.childNodes

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (node instanceof HTMLElement) {
        const type = node.getAttribute('data-type')

        if (type === 'ruby') {
          // Preserve original ruby segment from model
          const origIndex = parseInt(node.getAttribute('data-seg') ?? '-1')
          const origSeg = slide()?.segments[origIndex]
          if (origSeg && origSeg.type === 'ruby') {
            segments.push({ ...origSeg })
          }
        } else if (type === 'text') {
          // Our span wrapper for text
          const content = extractText(node)
          if (content) {
            segments.push({ type: 'text', content })
          }
        } else {
          // Unknown element (div, p, etc.) - probably inserted by browser on Enter
          const content = extractText(node)
          if (content) {
            segments.push({ type: 'text', content })
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent ?? ''
        if (content) {
          segments.push({ type: 'text', content })
        }
      } else if (node instanceof HTMLBRElement || (node as any).nodeName === 'BR') {
        segments.push({ type: 'text', content: '\n' })
      }
    }

    const merged = mergeAdjacentText(segments)

    // Check if segment structure changed (count or types differ)
    const oldSegments = slide()?.segments ?? []
    const structureUnchanged = merged.length === oldSegments.length &&
      merged.every((seg, i) => seg.type === oldSegments[i]?.type)

    // Only skip render if segment structure didn't change
    // (normal typing, Enter within text). If structure changed
    // (e.g., deleting across segments), allow render to update data-seg attrs.
    if (structureUnchanged) {
      skipNextRender = true
    }

    // Use silent update (no undo push per keystroke)
    manuscriptStore.updateSegmentsSilent(idx(), merged)
  }

  // ── Event handlers ──

  function handleInput(e: Event) {
    // Skip sync during IME composition
    if ((e as InputEvent).isComposing || isComposing) return

    syncFromDom()

    // Debounced undo snapshot: save state after 500ms of no typing
    if (undoTimer) clearTimeout(undoTimer)
    undoTimer = setTimeout(() => {
      manuscriptStore.snapshotForUndo()
    }, 500)
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Don't intercept keys during IME composition (Enter confirms IME)
    if (e.isComposing) return

    if (e.key === 'Enter') {
      e.preventDefault()
      // Insert a newline character at cursor position
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        range.deleteContents()

        // Insert <br> and a zero-width text node after it for cursor placement
        const br = document.createElement('br')
        range.insertNode(br)

        // Create a text node after br for reliable cursor placement
        const textNode = document.createTextNode('\u200B')
        if (br.nextSibling) {
          br.parentNode!.insertBefore(textNode, br.nextSibling)
        } else {
          br.parentNode!.appendChild(textNode)
        }

        // Move cursor to the text node
        const newRange = document.createRange()
        newRange.setStart(textNode, 0)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)

        // Sync to model
        syncFromDom()
      }
    }
  }

  function handleCompositionStart() {
    isComposing = true
  }

  function handleCompositionEnd() {
    isComposing = false
    // Sync the final composed text to model
    syncFromDom()

    // Debounced undo snapshot
    if (undoTimer) clearTimeout(undoTimer)
    undoTimer = setTimeout(() => {
      manuscriptStore.snapshotForUndo()
    }, 500)
  }

  function handleSelectionChange() {
    if (isComposing) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !isFocused()) {
      props.onSelectionChange(null)
      return
    }

    const text = sel.toString()
    if (!text) {
      props.onSelectionChange(null)
      return
    }

    // Use a simpler approach: compute model offset by counting
    // text content + ruby base lengths up to the selection
    const segments = slide()?.segments
    if (!segments) return

    const start = computeModelOffset(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset)
    const end = start + computeSelectedModelLength(sel)

    props.onSelectionChange({ text, start, end })
  }

  /** Compute model offset for a DOM position by walking editor's direct children */
  function computeModelOffset(targetNode: Node, targetOffset: number): number {
    const segments = slide()?.segments ?? []
    let modelPos = 0
    const children = editorRef.childNodes

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (child.contains(targetNode) || child === targetNode) {
        // Target is within this child
        const type = (child as HTMLElement).getAttribute?.('data-type')
        if (type === 'ruby') {
          // Selection lands on ruby element - offset is 0 or base.length
          const segIdx = parseInt((child as HTMLElement).getAttribute('data-seg') ?? '-1')
          const seg = segments[segIdx]
          if (seg && seg.type === 'ruby') {
            return modelPos // Selection start at ruby = position of ruby
          }
        } else {
          // Text span or text node - count characters up to targetOffset
          return modelPos + countTextUpTo(child, targetNode, targetOffset)
        }
      }

      // Count this entire child's model contribution
      const type = (child as HTMLElement).getAttribute?.('data-type')
      if (type === 'ruby') {
        const segIdx = parseInt((child as HTMLElement).getAttribute('data-seg') ?? '-1')
        const seg = segments[segIdx]
        if (seg && seg.type === 'ruby') {
          modelPos += seg.base.length
        }
      } else {
        modelPos += getNodeTextLength(child)
      }
    }

    return modelPos
  }

  /** Count text characters within a node up to a target DOM position */
  function countTextUpTo(root: Node, targetNode: Node, targetOffset: number): number {
    if (root === targetNode) {
      if (root.nodeType === Node.TEXT_NODE) {
        return targetOffset
      }
      // Element node: count text of first targetOffset children
      let count = 0
      for (let i = 0; i < targetOffset && i < root.childNodes.length; i++) {
        count += getNodeTextLength(root.childNodes[i])
      }
      return count
    }

    if (root.nodeType === Node.TEXT_NODE) {
      return root.textContent?.length ?? 0
    }

    let count = 0
    for (const child of Array.from(root.childNodes)) {
      if (child.contains(targetNode) || child === targetNode) {
        count += countTextUpTo(child, targetNode, targetOffset)
        return count
      }
      count += getNodeTextLength(child)
    }
    return count
  }

  /** Get "model text length" of a node (treating <br> as 1 char, ignoring zero-width spaces) */
  function getNodeTextLength(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      // Exclude zero-width spaces used for cursor placement
      const text = node.textContent ?? ''
      return text.replace(/\u200B/g, '').length
    }
    if ((node as Element).tagName === 'BR') {
      return 1
    }
    let len = 0
    for (const child of Array.from(node.childNodes)) {
      len += getNodeTextLength(child)
    }
    return len
  }

  /** Compute the model-based length of the current selection text */
  function computeSelectedModelLength(sel: Selection): number {
    // For text-only selections within text segments, string length is accurate
    return sel.toString().length
  }

  function handleRubyClick(e: MouseEvent) {
    const target = e.target as HTMLElement
    const ruby = target.closest('[data-type="ruby"]')
    if (ruby) {
      const segIndex = parseInt(ruby.getAttribute('data-seg') ?? '-1')
      if (segIndex >= 0) {
        props.onRubyClick(segIndex)
      }
    }
  }

  // ── Model → DOM sync (reactive) ──

  createEffect(on(
    () => [idx(), slide()?.segments],
    () => {
      // Skip render when change originated from DOM editing (typing, Enter, IME)
      if (skipNextRender) {
        skipNextRender = false
        return
      }

      const s = slide()
      if (s && editorRef) {
        // Save cursor position
        const sel = window.getSelection()
        let savedOffset = -1
        if (sel && sel.rangeCount > 0 && isFocused()) {
          try {
            savedOffset = computeModelOffset(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset)
          } catch {
            savedOffset = -1
          }
        }

        suppressSync = true
        editorRef.innerHTML = segmentsToHtml(s.segments)
        suppressSync = false

        // Restore cursor position
        if (savedOffset >= 0 && isFocused()) {
          restoreCursor(savedOffset)
        }
      }
    }
  ))

  /** Restore cursor to a model offset position */
  function restoreCursor(modelOffset: number) {
    const segments = slide()?.segments ?? []
    let remaining = modelOffset
    const children = editorRef.childNodes

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const type = (child as HTMLElement).getAttribute?.('data-type')

      if (type === 'ruby') {
        const segIdx = parseInt((child as HTMLElement).getAttribute('data-seg') ?? '-1')
        const seg = segments[segIdx]
        if (seg && seg.type === 'ruby') {
          if (remaining <= seg.base.length) {
            placeCursorAfter(child)
            return
          }
          remaining -= seg.base.length
        }
      } else {
        // Text span - walk through child nodes (text nodes + <br>)
        const nodeLen = getNodeTextLength(child)
        if (remaining <= nodeLen) {
          placeCursorInNode(child, remaining)
          return
        }
        remaining -= nodeLen
      }
    }

    // Fallback: place cursor at end of editor
    const range = document.createRange()
    range.selectNodeContents(editorRef)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  function placeCursorAfter(node: Node) {
    const range = document.createRange()
    range.setStartAfter(node)
    range.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  function placeCursorInNode(node: Node, offset: number) {
    if (node.nodeType === Node.TEXT_NODE) {
      const range = document.createRange()
      const maxOffset = node.textContent?.length ?? 0
      range.setStart(node, Math.min(offset, maxOffset))
      range.collapse(true)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      return
    }

    if ((node as Element).tagName === 'BR') {
      placeCursorAfter(node)
      return
    }

    // Walk children to find correct position
    let remaining = offset
    for (const child of Array.from(node.childNodes)) {
      const len = getNodeTextLength(child)
      if (remaining <= len) {
        placeCursorInNode(child, remaining)
        return
      }
      remaining -= len
    }

    // Fallback: end of this node
    placeCursorAfter(node)
  }

  // ── Lifecycle ──

  onMount(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
  })

  onCleanup(() => {
    document.removeEventListener('selectionchange', handleSelectionChange)
    if (undoTimer) clearTimeout(undoTimer)
  })

  const fontSize = () => slide()?.font_size ?? settingsStore.settings.font.default_size
  const fontColor = () => slide()?.font_color ?? settingsStore.settings.font.default_color

  return (
    <div
      ref={editorRef}
      class="slide-editor"
      contentEditable={true}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onClick={handleRubyClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      style={{
        'font-size': `${fontSize()}px`,
        'color': fontColor(),
        'font-family': settingsStore.settings.font.family,
      }}
      spellcheck={false}
    />
  )
}
