import { createSignal, For, onCleanup, Show } from 'solid-js'
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

  function toggle() {
    setOpen(!open())
  }

  function handleItemClick(item: MenuItem) {
    item.onClick()
    setOpen(false)
  }

  function handleClickOutside(e: MouseEvent) {
    if (ref && !ref.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Listen globally when open
  const startListening = () => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
  }
  const stopListening = () => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleKeyDown)
  }

  // Watch open state reactively
  const originalToggle = toggle
  function toggleAndListen() {
    const wasOpen = open()
    originalToggle()
    if (!wasOpen) {
      startListening()
    } else {
      stopListening()
    }
  }

  onCleanup(stopListening)

  return (
    <div class="dropdown" ref={ref}>
      <button class="dropdown-trigger" onClick={toggleAndListen}>
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
