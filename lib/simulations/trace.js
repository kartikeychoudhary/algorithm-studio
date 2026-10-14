export function trace() {
  const events = [],
    code = [];
  return {
    step(instruction, message, visual = {}) {
      let line = code.indexOf(instruction);
      if (line < 0) {
        line = code.length;
        code.push(instruction);
      }
      events.push(
        structuredClone({
          line,
          message,
          nodes: [],
          links: [],
          columns: [],
          rows: [],
          bars: [],
          timeline: [],
          metrics: {},
          ...visual,
        }),
      );
    },
    finish(result) {
      if (!events.length) throw new Error("A trace must contain an event.");
      return { code, events, result };
    },
  };
}
export const node = (label, value, status = "") => ({
  label,
  value: String(value),
  status,
});
export const bars = (values, labels) =>
  values.map((value, i) => ({ label: labels?.[i] ?? String(i), value }));
export function bounded(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  return value;
}
export function numbers(
  value,
  { min = 0, max = 99, count = 16, name = "values" } = {},
) {
  if (!Array.isArray(value) || !value.length || value.length > count)
    throw new Error(`${name} needs 1–${count} values.`);
  return value.map((v) => bounded(v, min, max, name));
}
export function choice(value, values, name) {
  if (!values.includes(value))
    throw new Error(`${name}: choose ${values.join(", ")}.`);
  return value;
}
export function text(value, max = 160, name = "text") {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`${name} must contain 1–${max} characters.`);
  return value;
}
export function flow(actors, steps, result) {
  const r = trace(),
    values = actors.map(() => "Ready");
  for (const [from, to, instruction, message, value, updates = {}] of steps) {
    values[to] = value;
    Object.entries(updates).forEach(([i, v]) => (values[i] = v));
    r.step(instruction, message, {
      nodes: actors.map((a, i) => node(a, values[i], i === to ? "active" : "")),
      links: [[from, to]],
      metrics: { From: actors[from], To: actors[to] },
    });
  }
  return r.finish(result ?? values);
}
