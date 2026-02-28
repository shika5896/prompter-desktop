interface NumberInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export default function NumberInput(props: NumberInputProps) {
  return (
    <div class="number-input">
      {props.label && <label>{props.label}</label>}
      <input
        type="number"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        onInput={e => {
          const v = parseInt(e.currentTarget.value)
          if (!isNaN(v)) props.onChange(v)
        }}
      />
    </div>
  )
}
