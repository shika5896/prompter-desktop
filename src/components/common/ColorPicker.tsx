import './ColorPicker.css'

interface ColorPickerProps {
  value: string
  onChange: (v: string) => void
  label?: string
}

export default function ColorPicker(props: ColorPickerProps) {
  return (
    <div class="color-picker">
      {props.label && <label>{props.label}</label>}
      <div class="color-picker-row">
        <input
          type="color"
          value={props.value}
          onInput={e => props.onChange(e.currentTarget.value)}
        />
        <input
          type="text"
          value={props.value}
          maxLength={7}
          onInput={e => {
            const v = e.currentTarget.value
            // Allow partial input while typing, but only propagate complete hex
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              props.onChange(v)
            }
          }}
          onBlur={e => {
            // Revert to current value if input is incomplete
            e.currentTarget.value = props.value
          }}
          class="color-text-input"
        />
      </div>
    </div>
  )
}
