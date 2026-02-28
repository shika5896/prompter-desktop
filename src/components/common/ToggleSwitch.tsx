import './ToggleSwitch.css'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export default function ToggleSwitch(props: ToggleSwitchProps) {
  return (
    <label class="toggle-switch">
      <div class="toggle-switch-text">
        <span class="toggle-switch-label">{props.label}</span>
        {props.description && (
          <span class="toggle-switch-desc">{props.description}</span>
        )}
      </div>
      <div class="toggle-switch-track" classList={{ active: props.checked }}>
        <input
          type="checkbox"
          checked={props.checked}
          onChange={e => props.onChange(e.currentTarget.checked)}
          class="sr-only"
        />
        <div class="toggle-switch-thumb" />
      </div>
    </label>
  )
}
