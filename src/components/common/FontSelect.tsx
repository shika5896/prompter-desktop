import { createSignal, createMemo, For, Show, onCleanup } from 'solid-js'
import { useI18n } from '../../i18n'
import './FontSelect.css'

interface FontSelectProps {
  value: string
  onChange: (family: string) => void
  fonts: string[]
  label?: string
}

export default function FontSelect(props: FontSelectProps) {
  const t = useI18n()
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')
  let ref!: HTMLDivElement
  let searchRef!: HTMLInputElement

  const filtered = createMemo(() => {
    const q = query().toLowerCase()
    if (!q) return props.fonts
    return props.fonts.filter(f => f.toLowerCase().includes(q))
  })

  function handleSelect(family: string) {
    props.onChange(family)
    setQuery('')
    setOpen(false)
  }

  function toggleOpen() {
    const next = !open()
    setOpen(next)
    if (next) {
      setQuery('')
      requestAnimationFrame(() => searchRef?.focus())
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (ref && !ref.contains(e.target as Node)) {
      setOpen(false)
      setQuery('')
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (open() && e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div class="font-select" ref={ref}>
      {props.label && <label class="font-select-label">{props.label}</label>}
      <button class="font-select-trigger" onClick={toggleOpen}>
        <span class="font-select-trigger-name">{props.value}</span>
        <span
          class="font-select-trigger-preview"
          style={{ 'font-family': `"${props.value}", sans-serif` }}
        >
          Aa
        </span>
        <span class="font-select-arrow">▾</span>
      </button>
      <Show when={open()}>
        <div class="font-select-dropdown">
          <div class="font-select-search-wrap">
            <input
              ref={searchRef}
              type="text"
              class="font-select-search"
              placeholder={t('font_search')}
              value={query()}
              onInput={e => setQuery(e.currentTarget.value)}
            />
          </div>
          <div class="font-select-list">
            <For each={filtered().slice(0, 100)}>
              {(family) => (
                <button
                  class="font-select-option"
                  classList={{ selected: family === props.value }}
                  onClick={() => handleSelect(family)}
                >
                  <span class="font-select-option-name">{family}</span>
                  <span
                    class="font-select-option-preview"
                    style={{ 'font-family': `"${family}", sans-serif` }}
                  >
                    Aa あ
                  </span>
                </button>
              )}
            </For>
            <Show when={filtered().length > 100}>
              <div class="font-select-more">+{filtered().length - 100} ...</div>
            </Show>
            <Show when={filtered().length === 0}>
              <div class="font-select-more">{t('font_no_results')}</div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  )
}
