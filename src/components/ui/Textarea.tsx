import type { TextareaHTMLAttributes } from "react";

import styles from "./Textarea.module.css";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  const cls = [styles.textarea, className].filter(Boolean).join(" ");
  return <textarea className={cls} {...props} />;
}
