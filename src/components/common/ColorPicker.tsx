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
      <input
        type="color"
        value={props.value}
        onInput={e => props.onChange(e.currentTarget.value)}
      />
    </div>
  )
}
