import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'text'
type State = 'idle' | 'loading' | 'success'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  state?: State
  children: ReactNode
}

export function Button({ variant = 'primary', state = 'idle', className, children, ...props }: ButtonProps) {
  const cls = [styles[variant], className].filter(Boolean).join(' ')
  return (
    <button className={cls} data-state={state} {...props}>
      {variant === 'primary' ? <span>{children}</span> : children}
    </button>
  )
}
