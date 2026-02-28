import type { JSX } from 'solid-js'
import './Button.css'

interface ButtonProps {
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  class?: string
  title?: string
  children: JSX.Element
}

export default function Button(props: ButtonProps) {
  return (
    <button
      class={`btn btn-${props.variant ?? 'secondary'} btn-${props.size ?? 'md'} ${props.class ?? ''}`}
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
    >
      {props.children}
    </button>
  )
}
