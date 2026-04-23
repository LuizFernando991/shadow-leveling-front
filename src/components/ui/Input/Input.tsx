import type { InputHTMLAttributes } from "react";

import styles from "./Input.module.css";

import { preventNegativeNumberInput } from "@/lib/number-input";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({
  className,
  type,
  min,
  onKeyDown,
  ...props
}: InputProps) {
  const cls = [styles.input, className].filter(Boolean).join(" ");
  return (
    <input
      className={cls}
      type={type}
      min={type === "number" ? (min ?? 0) : min}
      onKeyDown={(event) => {
        if (type === "number") preventNegativeNumberInput(event);
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}
