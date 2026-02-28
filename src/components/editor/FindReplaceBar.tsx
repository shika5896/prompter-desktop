import { createSignal, Show } from 'solid-js'
import { useI18n } from '../../i18n'
import manuscriptStore from '../../stores/manuscriptStore'
import type { Segment } from '../../types/manuscript'
import Button from '../common/Button'
import './FindReplaceBar.css'

interface FindReplaceBarProps {
  showReplace: boolean
  onClose: () => void
}

export default function FindReplaceBar(props: FindReplaceBarProps) {
  const t = useI18n()
  const [query, setQuery] = createSignal('')
  const [replacement, setReplacement] = createSignal('')
  const [resultCount, setResultCount] = createSignal<number | null>(null)
  let searchRef!: HTMLInputElement

  function countMatches(): number {
    const q = query()
    if (!q) return 0
    let count = 0
    for (const slide of manuscriptStore.manuscript.slides) {
      for (const seg of slide.segments) {
        const text = seg.type === 'text' ? seg.content : seg.base
        let idx = 0
        while ((idx = text.indexOf(q, idx)) !== -1) {
          count++
          idx += q.length
        }
      }
    }
    return count
  }

  function handleFind() {
    setResultCount(countMatches())
  }

  function replaceInSegments(segments: Segment[], q: string, r: string, once: boolean): { segments: Segment[], replaced: boolean } {
    let replaced = false
    const newSegs: Segment[] = segments.map(seg => {
      if (replaced && once) return { ...seg }
      if (seg.type === 'text' && seg.content.includes(q)) {
        replaced = true
        return {
          type: 'text' as const,
          content: once ? seg.content.replace(q, r) : seg.content.split(q).join(r),
        }
      }
      if (seg.type === 'ruby' && seg.base.includes(q)) {
        replaced = true
        return {
          type: 'ruby' as const,
          base: once ? seg.base.replace(q, r) : seg.base.split(q).join(r),
          reading: seg.reading,
        }
      }
      return { ...seg }
    })
    return { segments: newSegs, replaced }
  }

  function handleReplaceOne() {
    const q = query()
    const r = replacement()
    if (!q) return
    manuscriptStore.pushUndo()
    for (let i = 0; i < manuscriptStore.manuscript.slides.length; i++) {
      const slide = manuscriptStore.manuscript.slides[i]
      const { segments, replaced } = replaceInSegments(slide.segments, q, r, true)
      if (replaced) {
        manuscriptStore.updateSegmentsSilent(i, segments)
        setResultCount(countMatches())
        return
      }
    }
  }

  function handleReplaceAll() {
    const q = query()
    const r = replacement()
    if (!q) return
    manuscriptStore.pushUndo()
    for (let i = 0; i < manuscriptStore.manuscript.slides.length; i++) {
      const slide = manuscriptStore.manuscript.slides[i]
      const { segments, replaced } = replaceInSegments(slide.segments, q, r, false)
      if (replaced) {
        manuscriptStore.updateSegmentsSilent(i, segments)
      }
    }
    setResultCount(countMatches())
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      props.onClose()
    } else if (e.key === 'Enter') {
      handleFind()
    }
  }

  // Auto-focus search input
  setTimeout(() => searchRef?.focus(), 50)

  return (
    <div class="find-replace-bar" onKeyDown={handleKeyDown}>
      <div class="find-replace-row">
        <input
          ref={searchRef}
          type="text"
          class="find-input"
          placeholder={t('edit_find_placeholder')}
          value={query()}
          onInput={e => { setQuery(e.currentTarget.value); setResultCount(null) }}
        />
        <Button size="sm" variant="ghost" onClick={handleFind}>{t('edit_find')}</Button>
        {resultCount() !== null && (
          <span class="find-result-count">
            {resultCount() === 0 ? t('edit_find_no_results') : resultCount()}
          </span>
        )}
        <button class="find-close" onClick={props.onClose} aria-label="Close">×</button>
      </div>
      <Show when={props.showReplace}>
        <div class="find-replace-row">
          <input
            type="text"
            class="find-input"
            placeholder={t('edit_replace_placeholder')}
            value={replacement()}
            onInput={e => setReplacement(e.currentTarget.value)}
          />
          <Button size="sm" variant="ghost" onClick={handleReplaceOne}>{t('edit_replace_one')}</Button>
          <Button size="sm" variant="ghost" onClick={handleReplaceAll}>{t('edit_replace_all')}</Button>
        </div>
      </Show>
    </div>
  )
}
