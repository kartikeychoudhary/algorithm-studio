"use client";
import { useEffect, useState } from "react";

export default function NumberField({
  value,
  onChange,
  label,
  min = 1,
  max = 999,
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      value={draft}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        const number = Number(text);
        if (text && Number.isInteger(number) && number >= min && number <= max)
          onChange(number);
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}
