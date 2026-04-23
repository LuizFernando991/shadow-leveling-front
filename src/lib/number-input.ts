import type { KeyboardEvent } from "react";

export function preventNegativeNumberInput(
  event: KeyboardEvent<HTMLInputElement>,
): void {
  if (event.key === "-" || event.key === "Subtract") {
    event.preventDefault();
  }
}

export function sanitizeNonNegativeNumber(value: string): string {
  if (value === "") return "";
  if (!value.trim().startsWith("-")) return value;

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && numericValue < 0) return "0";

  return value.replace(/^-+/, "");
}
