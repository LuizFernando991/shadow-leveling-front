import type { ReactNode } from 'react'

import styles from './FormField.module.css'

interface FormFieldProps {
  label: string
  htmlFor?: string
  icon?: ReactNode
  error?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, icon, error, children }: FormFieldProps) {
  return (
    <div className={styles.group}>
      <label htmlFor={htmlFor}>{label}</label>
      <div className={styles.inputWrap}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </div>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  )
}
