export const formatValue = (value) =>
  value === Infinity
    ? "∞"
    : value === -Infinity
      ? "−∞"
      : value == null
        ? "—"
        : typeof value === "number" && !Number.isInteger(value)
          ? value.toFixed(1)
          : String(value);
export const signed = (value) => (value > 0 ? `+${value}` : String(value));
