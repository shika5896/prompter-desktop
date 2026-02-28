import { createSignal, createEffect, For, onCleanup, Show } from 'solid-js'
import './DropdownMenu.css'

export interface MenuItem {
  label: string
  shortcut?: string
  onClick: () => void
}

interface DropdownMenuProps {
  label: string
  items: MenuItem[]
}

export default function DropdownMenu(props: DropdownMenuProps) {
  const [open, setOpen] = createSignal(false)
  let ref!: HTMLDivElement
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  function show() {
    clearTimeout(closeTimer)
    setOpen(true)
  }

  function scheduleClose() {
    clearTimeout(closeTimer)
    closeTimer = setTimeout(() => setOpen(false), 150)
  }

  function toggle() {
    if (open()) {
      clearTimeout(closeTimer)
      setOpen(false)
    } else {
      show()
    }
  }

  function handleItemClick(item: MenuItem) {
    item.onClick()
    clearTimeout(closeTimer)
    setOpen(false)
  }

  function handleClickOutside(e: MouseEvent) {
    if (ref && !ref.contains(e.target as Node)) {
      clearTimeout(closeTimer)
      setOpen(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      clearTimeout(closeTimer)
      setOpen(false)
    }
  }

  const startListening = () => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
  }
  const stopListening = () => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
  }

  createEffect(() => {
    if (open()) {
      startListening()
    } else {
      stopListening()
    }
  })

  onCleanup(() => {
    clearTimeout(closeTimer)
    stopListening()
  })

  return (
    <div
      class="dropdown"
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={scheduleClose}
    >
      <button class="dropdown-trigger" classList={{ active: open() }} onClick={toggle}>
        {props.label}
        <span class="dropdown-arrow">▾</span>
      </button>
      <Show when={open()}>
        <div class="dropdown-panel">
          <For each={props.items}>
            {(item) => (
              <button class="dropdown-item" onClick={() => handleItemClick(item)}>
                <span>{item.label}</span>
                <Show when={item.shortcut}>
                  <span class="dropdown-item-shortcut">{item.shortcut}</span>
                </Show>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
