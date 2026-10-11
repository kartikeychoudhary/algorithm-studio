import { recorder } from "./recorder.js";

export function binarySearch(values, target) {
  const a = values.slice().sort((x, y) => x - y),
    r = recorder([
      "sort input; left = 0; right = n - 1",
      "while left <= right:",
      "  mid = floor((left + right) / 2)",
      "  if a[mid] == target: return mid",
      "  if a[mid] < target: left = mid + 1",
      "  else: right = mid - 1",
      "return NOT_FOUND",
    ]);
  let left = 0,
    right = a.length - 1,
    mid = null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: a,
      active: mid === null ? [] : [mid],
      range: [left, right],
      pointers: { L: left, R: right, ...(mid === null ? {} : { M: mid }) },
      vars: { left, right, mid, target },
      ...extra,
    });
  emit(0, "Binary search requires sorted input. The editor sorts your values.");
  while (left <= right) {
    emit(1, "The candidate range is nonempty.");
    mid = Math.floor((left + right) / 2);
    emit(2, `Inspect a[${mid}] = ${a[mid]}.`);
    if (a[mid] === target) {
      emit(3, `Found ${target} at sorted index ${mid}.`, {
        done: true,
        result: mid,
        selected: [mid],
      });
      return r.finish(mid);
    }
    if (a[mid] < target) {
      left = mid + 1;
      emit(4, "Discard the middle and everything to its left.");
    } else {
      right = mid - 1;
      emit(5, "Discard the middle and everything to its right.");
    }
  }
  emit(6, "The candidate range is empty. The target is absent.", {
    done: true,
    result: -1,
  });
  return r.finish(-1);
}

export function twoPointers(values, target) {
  const a = values.slice().sort((x, y) => x - y),
    r = recorder([
      "sort input; left = 0; right = n - 1",
      "while left < right:",
      "  sum = a[left] + a[right]",
      "  if sum == target: return [left, right]",
      "  if sum < target: left += 1",
      "  else: right -= 1",
      "return NO_PAIR",
    ]);
  let left = 0,
    right = a.length - 1,
    sum = null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: a,
      active: [left, right],
      range: [left, right],
      pointers: { L: left, R: right },
      vars: { left, right, sum, target },
      ...extra,
    });
  emit(
    0,
    "Sorted values make pointer movement predictable. Indices refer to the sorted array.",
  );
  while (left < right) {
    emit(1, "Use two distinct indices.");
    sum = a[left] + a[right];
    emit(2, `${a[left]} + ${a[right]} = ${sum}.`);
    if (sum === target) {
      const result = [left, right];
      emit(3, "This pair reaches the target.", {
        done: true,
        result,
        selected: result,
      });
      return r.finish(result);
    }
    if (sum < target) {
      left++;
      emit(4, "The sum is too small; move left toward larger values.");
    } else {
      right--;
      emit(5, "The sum is too large; move right toward smaller values.");
    }
  }
  emit(6, "The pointers met. No pair reaches the target.", {
    done: true,
    result: [],
  });
  return r.finish([]);
}

export function slidingWindow(a, k) {
  if (!Number.isInteger(k) || k < 1 || k > a.length)
    throw new Error("Window size must be between 1 and array length.");
  const r = recorder([
    "sum = 0; best = -infinity; best_start = 0",
    "for right = 0 to n - 1:",
    "  sum += a[right]",
    "  if right >= k: sum -= a[right - k]",
    "  if right >= k - 1 and sum > best:",
    "    best = sum; best_start = right - k + 1",
    "return best, best_start",
  ]);
  let sum = 0,
    best = -Infinity,
    bestStart = 0,
    right = -1;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: a,
      active: right < 0 ? [] : [right],
      range: [Math.max(0, right - k + 1), right],
      pointers: { R: right },
      vars: { k, sum, best, bestStart },
      ...extra,
    });
  emit(
    0,
    "Start with no window. Negative infinity handles all-negative inputs.",
  );
  for (right = 0; right < a.length; right++) {
    emit(1, "Advance the right edge.");
    sum += a[right];
    emit(2, `Add ${a[right]} to the running sum.`, {
      range: [Math.max(0, right - k), right],
    });
    if (right >= k) {
      sum -= a[right - k];
      emit(3, `Remove ${a[right - k]} as it leaves the window.`);
    }
    if (right >= k - 1) {
      emit(4, "Compare this complete window with the best seen.");
      if (sum > best) {
        best = sum;
        bestStart = right - k + 1;
        emit(5, `New best sum: ${best}.`);
      }
    }
  }
  const result = { sum: best, start: bestStart };
  emit(6, `Best length-${k} window starts at ${bestStart}, with sum ${best}.`, {
    done: true,
    result,
    active: [],
    range: [bestStart, bestStart + k - 1],
    selected: Array.from({ length: k }, (_, i) => bestStart + i),
    pointers: {},
  });
  return r.finish(result);
}

export function hashTwoSum(a, target) {
  const r = recorder([
    "seen = empty map",
    "for i, value in a:",
    "  need = target - value",
    "  if need in seen: return [seen[need], i]",
    "  seen[value] = i",
    "return NO_PAIR",
  ]);
  const seen = new Map();
  let i = -1,
    need = null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: a,
      active: i < 0 ? [] : [i],
      pointers: { i },
      entries: [...seen].map(([key, value]) => [key, value]),
      vars: { i, target, need },
      ...extra,
    });
  emit(
    0,
    "The map stores previously visited values and their original indices.",
  );
  for (i = 0; i < a.length; i++) {
    emit(1, `Visit original index ${i}.`);
    need = target - a[i];
    emit(2, `Need ${need} to complement ${a[i]}.`);
    if (seen.has(need)) {
      const result = [seen.get(need), i];
      emit(3, "A previously visited index completes the pair.", {
        done: true,
        result,
        selected: result,
      });
      return r.finish(result);
    }
    emit(3, "The complement is not in the map yet.");
    seen.set(a[i], i);
    emit(4, `Remember value ${a[i]} at index ${i}.`);
  }
  emit(5, "All values were checked. No pair exists.", {
    done: true,
    result: [],
    active: [],
    pointers: {},
  });
  return r.finish([]);
}

export function monotonicStack(a) {
  const r = recorder([
    "stack = []; answer = [-1] * n",
    "for i = 0 to n - 1:",
    "  while stack and a[i] > a[stack.top]:",
    "    j = stack.pop(); answer[j] = a[i]",
    "  stack.push(i)",
    "return answer",
  ]);
  const stack = [],
    answer = a.map(() => -1);
  let i = -1;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: a,
      active: i < 0 ? [] : [i],
      stack: stack.map((j) => `${j}: ${a[j]}`),
      output: answer,
      pointers: { i },
      vars: { i, stackSize: stack.length },
      ...extra,
    });
  emit(
    0,
    "Unresolved indices wait on a stack. −1 means no greater value found.",
  );
  for (i = 0; i < a.length; i++) {
    emit(1, `Inspect ${a[i]}.`);
    while (stack.length && a[i] > a[stack.at(-1)]) {
      emit(2, "This value is strictly greater than the stack top.");
      const j = stack.pop();
      answer[j] = a[i];
      emit(
        3,
        `${a[i]} is the first greater value to the right of index ${j}.`,
        { selected: [j] },
      );
    }
    stack.push(i);
    emit(4, "Push this index. Values on the stack are non-increasing.");
  }
  emit(5, "Remaining indices have no greater value to their right.", {
    done: true,
    result: answer,
    active: [],
    pointers: {},
  });
  return r.finish(answer);
}
