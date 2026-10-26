"use client";

import { useState } from "react";

function digitsOnly(value?: string | number | null) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");
}

function groupDigits(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function MoneyInput({
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  placeholder,
  className,
}: {
  name: string;
  value?: string;
  defaultValue?: string | number | null;
  onValueChange?: (raw: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [raw, setRaw] = useState(digitsOnly(defaultValue));
  const current = value !== undefined ? digitsOnly(value) : raw;

  return (
    <>
      <input type="hidden" name={name} value={current} />
      <input
        inputMode="numeric"
        autoComplete="off"
        required={required}
        placeholder={placeholder ?? "0"}
        className={className}
        value={current ? groupDigits(current) : ""}
        onChange={(event) => {
          const next = digitsOnly(event.target.value);
          if (value === undefined) setRaw(next);
          onValueChange?.(next);
        }}
      />
    </>
  );
}
