import { recorder } from "./recorder.js";

export function mergeSort(values) {
  const a = values.slice(),
    r = recorder([
      "sort(left, right):",
      "  if right - left <= 1: return",
      "  mid = floor((left + right) / 2)",
      "  sort(left, mid); sort(mid, right)",
      "  merged = []; i = left; j = mid",
      "  append smaller front; advance its pointer",
      "  append remaining values",
      "  copy merged back to a[left:right]",
      "return a",
    ]);
  function sort(left, right, depth) {
    const emit = (line, message, extra = {}) =>
      r.emit(line, message, {
        values: a,
        range: [left, right - 1],
        active: [],
        vars: { left, right, depth },
        ...extra,
      });
    emit(0, `Sort the half-open interval [${left}, ${right}).`);
    if (right - left <= 1) {
      emit(1, "A single value is already sorted.");
      return;
    }
    const mid = Math.floor((left + right) / 2);
    emit(2, `Split at index ${mid}.`);
    emit(3, "Recursively sort both halves.");
    sort(left, mid, depth + 1);
    sort(mid, right, depth + 1);
    let i = left,
      j = mid;
    const buffer = [];
    emit(4, "Merge the two sorted halves.", { buffer });
    while (i < mid && j < right) {
      const picked = a[i] <= a[j] ? i++ : j++;
      buffer.push(a[picked]);
      emit(5, `Append ${a[picked]} from index ${picked}.`, {
        buffer,
        active: [picked],
        pointers: { i, j },
      });
    }
    while (i < mid) buffer.push(a[i++]);
    while (j < right) buffer.push(a[j++]);
    emit(6, "Append the remaining values.", { buffer });
    a.splice(left, buffer.length, ...buffer);
    emit(7, "Copy the merged sequence into its original range.", { buffer });
  }
  sort(0, a.length, 0);
  r.emit(8, "Every range is merged. The array is sorted.", {
    values: a,
    selected: a.map((_, i) => i),
    vars: { length: a.length },
    done: true,
    result: a,
  });
  return r.finish(a);
}

export function topK(values, k) {
  if (!Number.isInteger(k) || k < 1 || k > values.length)
    throw new Error("k must be between 1 and array length.");
  const r = recorder([
    "heap = empty min-heap",
    "for value in a:",
    "  if size < k: push value; sift up",
    "  else if value > heap[0]:",
    "    heap[0] = value; sift down",
    "  else: discard value",
    "return heap  // largest k values, heap order",
  ]);
  const heap = [];
  let index = -1;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values,
      active: index < 0 ? [] : [index],
      heap,
      vars: { k, size: heap.length, minimum: heap[0] ?? null },
      ...extra,
    });
  emit(
    0,
    "Keep at most k values. The root is the smallest value we are keeping.",
  );
  for (index = 0; index < values.length; index++) {
    const value = values[index];
    emit(1, `Consider ${value}.`);
    if (heap.length < k) {
      heap.push(value);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p] <= heap[i]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
      emit(2, "Insert and restore the min-heap property.");
    } else if (value > heap[0]) {
      emit(3, `${value} is larger than the smallest retained value.`);
      heap[0] = value;
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1] < heap[c]) c++;
        if (heap[i] <= heap[c]) break;
        [heap[i], heap[c]] = [heap[c], heap[i]];
        i = c;
      }
      emit(4, "Replace the root and sift it down.");
    } else emit(5, "This value cannot improve the largest k values.");
  }
  emit(6, `The heap contains the largest ${k} values, including duplicates.`, {
    done: true,
    result: heap,
    active: [],
  });
  return r.finish(heap.slice());
}
