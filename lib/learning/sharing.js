export function encodeTrace(id, input, index) {
  return JSON.stringify({ v: 1, id, input, index });
}
export function decodeTrace(text, id) {
  if (!text || text.length > 12000)
    throw new Error("Shared trace is missing or too large.");
  const data = JSON.parse(text);
  if (
    data.v !== 1 ||
    data.id !== id ||
    !Number.isInteger(data.index) ||
    data.index < 0 ||
    data.index > 50000
  )
    throw new Error("Invalid shared trace.");
  return data;
}
