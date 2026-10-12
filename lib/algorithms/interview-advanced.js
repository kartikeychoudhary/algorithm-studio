import { recorder } from "./recorder.js";

export function quickSort(values) {
  const a = values.slice(),
    fixed = [];
  const r = recorder([
    "sort(lo, hi): if lo >= hi: return",
    "pivot = a[hi]; boundary = lo",
    "for j = lo to hi - 1:",
    "  if a[j] <= pivot: swap(a[j], a[boundary]); boundary++",
    "swap(a[boundary], a[hi])",
    "sort(lo, boundary - 1); sort(boundary + 1, hi)",
    "return a",
  ]);
  function sort(lo, hi) {
    if (lo >= hi) {
      if (lo === hi) fixed.push(lo);
      return;
    }
    let boundary = lo;
    const pivot = a[hi];
    const emit = (line, message, active = []) =>
      r.emit(line, message, {
        values: a,
        active,
        selected: fixed,
        range: [lo, hi],
        pointers: { pivot: hi, boundary },
        vars: { lo, hi, pivot, boundary },
      });
    emit(1, `Choose ${pivot} as the pivot. Values at or below it move left.`, [
      hi,
    ]);
    for (let j = lo; j < hi; j++) {
      emit(2, `Compare ${a[j]} with pivot ${pivot}.`, [j, hi]);
      if (a[j] <= pivot) {
        [a[j], a[boundary]] = [a[boundary], a[j]];
        boundary++;
        emit(3, "Grow the partition containing values at or below the pivot.", [
          j,
          boundary - 1,
        ]);
      }
    }
    [a[boundary], a[hi]] = [a[hi], a[boundary]];
    fixed.push(boundary);
    emit(4, `The pivot belongs at index ${boundary}.`, [boundary]);
    emit(5, "Sort each side independently.");
    sort(lo, boundary - 1);
    sort(boundary + 1, hi);
  }
  r.emit(0, "Start with the whole array.", {
    values: a,
    vars: { length: a.length },
  });
  sort(0, a.length - 1);
  r.emit(6, "Every partition is in order.", {
    values: a,
    selected: a.map((_, i) => i),
    vars: { length: a.length },
    done: true,
    result: a,
  });
  return r.finish(a);
}
export function kadane(values) {
  const r = recorder([
    "current = best = a[0]; start = bestStart = bestEnd = 0",
    "for i = 1 to n - 1:",
    "  if a[i] > current + a[i]: current = a[i]; start = i",
    "  else: current += a[i]",
    "  if current > best: best = current; save [start, i]",
    "return best",
  ]);
  let current = values[0],
    best = current,
    start = 0,
    bestStart = 0,
    bestEnd = 0;
  const emit = (line, message, i = 0, done = false) =>
    r.emit(line, message, {
      values,
      active: done ? [] : [i],
      range: [start, i],
      selected: Array.from(
        { length: bestEnd - bestStart + 1 },
        (_, j) => j + bestStart,
      ),
      vars: { current, best, start, bestStart, bestEnd },
      done,
      result: done ? best : undefined,
    });
  emit(0, "A nonempty answer starts with the first value.");
  for (let i = 1; i < values.length; i++) {
    emit(1, `Consider index ${i}.`, i);
    if (values[i] > current + values[i]) {
      current = values[i];
      start = i;
      emit(2, "A negative previous sum would hurt. Start fresh.", i);
    } else {
      current += values[i];
      emit(3, "Extend the current subarray.", i);
    }
    if (current > best) {
      best = current;
      bestStart = start;
      bestEnd = i;
      emit(4, "Record a better contiguous range.", i);
    }
  }
  emit(5, `Maximum subarray sum is ${best}.`, values.length - 1, true);
  return r.finish(best);
}
export function prefixSum(values, k) {
  const r = recorder([
    "frequency = {0: 1}; prefix = count = 0",
    "for value in a:",
    "  prefix += value",
    "  count += frequency.get(prefix - k, 0)",
    "  frequency[prefix] = frequency.get(prefix, 0) + 1",
    "return count",
  ]);
  let prefix = 0,
    count = 0;
  const frequency = new Map([[0, 1]]);
  const emit = (line, message, i = -1, done = false) =>
    r.emit(line, message, {
      values,
      active: i < 0 ? [] : [i],
      entries: [...frequency],
      entriesTitle: "PREFIX SUM → FREQUENCY",
      vars: { prefix, k, needed: prefix - k, count },
      done,
      result: done ? count : undefined,
    });
  emit(0, "The empty prefix has sum 0 and occurs once.");
  values.forEach((value, i) => {
    emit(1, `Read ${value}.`, i);
    prefix += value;
    emit(2, `Prefix sum is now ${prefix}.`, i);
    const matches = frequency.get(prefix - k) || 0;
    count += matches;
    emit(
      3,
      `${matches} earlier prefix(es) create a subarray summing to ${k}.`,
      i,
    );
    frequency.set(prefix, (frequency.get(prefix) || 0) + 1);
    emit(4, "Record this prefix only after counting matches.", i);
  });
  emit(5, `${count} nonempty subarrays match.`, -1, true);
  return r.finish(count);
}
export function increasingSubsequence(values) {
  const r = recorder([
    "dp = [1] * n",
    "for i = 0 to n - 1:",
    "  for j = 0 to i - 1:",
    "    if a[j] < a[i]: dp[i] = max(dp[i], dp[j] + 1)",
    "return max(dp)",
  ]);
  const dp = values.map(() => 1);
  const emit = (line, message, i = 0, j = null, done = false) =>
    r.emit(line, message, {
      values,
      active: done ? [] : [i, ...(j === null ? [] : [j])],
      dp,
      dpTitle: "LIS LENGTH ENDING AT INDEX",
      dpCurrent: i,
      dependency: j,
      vars: { i, j, best: Math.max(...dp) },
      done,
      result: done ? Math.max(...dp) : undefined,
    });
  emit(0, "Every value alone forms a subsequence of length 1.");
  for (let i = 0; i < values.length; i++) {
    emit(1, `Find the best increasing subsequence ending at ${i}.`, i);
    for (let j = 0; j < i; j++) {
      emit(2, `Compare earlier value ${values[j]} with ${values[i]}.`, i, j);
      if (values[j] < values[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
        emit(3, `Extend an earlier subsequence: dp[${i}] = ${dp[i]}.`, i, j);
      }
    }
  }
  emit(
    4,
    `The longest length is ${Math.max(...dp)}. Entries need not be adjacent.`,
    values.length - 1,
    null,
    true,
  );
  return r.finish(Math.max(...dp));
}
export function houseRobber(values) {
  const r = recorder([
    "dp[0] = 0; dp[1] = a[0]",
    "for i = 2 to n:",
    "  take = dp[i - 2] + a[i - 1]",
    "  skip = dp[i - 1]",
    "  dp[i] = max(take, skip)",
    "return dp[n]",
  ]);
  const dp = Array(values.length + 1).fill(0);
  dp[1] = values[0];
  let take = values[0],
    skip = 0;
  const emit = (line, message, i, done = false) =>
    r.emit(line, message, {
      values,
      active: done ? [] : [Math.max(0, i - 1)],
      dp,
      dpTitle: "BEST TOTAL FOR FIRST i HOUSES",
      dpCurrent: i,
      vars: { houses: i, take, skip, best: dp[i] },
      done,
      result: done ? dp.at(-1) : undefined,
    });
  emit(0, "No houses gives 0; one house gives its own value.", 1);
  for (let i = 2; i <= values.length; i++) {
    emit(1, `Consider the first ${i} houses.`, i);
    take = dp[i - 2] + values[i - 1];
    emit(2, "Taking this house requires skipping its neighbor.", i);
    skip = dp[i - 1];
    emit(3, "Skipping this house keeps the previous best.", i);
    dp[i] = Math.max(take, skip);
    emit(4, "Keep the better choice.", i);
  }
  emit(5, `Maximum non-adjacent total is ${dp.at(-1)}.`, values.length, true);
  return r.finish(dp.at(-1));
}
export function jumpGame(values) {
  const r = recorder([
    "farthest = 0",
    "for i = 0 to n - 1:",
    "  if i > farthest: return false",
    "  farthest = max(farthest, i + a[i])",
    "  if farthest >= n - 1: return true",
  ]);
  let farthest = 0;
  const emit = (line, message, i = 0, done = false, result) =>
    r.emit(line, message, {
      values,
      active: [i],
      range: [0, Math.min(values.length - 1, farthest)],
      selected: Array.from(
        { length: Math.min(values.length, farthest + 1) },
        (_, j) => j,
      ),
      vars: { i, farthest, last: values.length - 1 },
      done,
      result,
    });
  emit(0, "Index 0 is reachable without jumping.");
  for (let i = 0; i < values.length; i++) {
    emit(1, `Inspect jump capacity at index ${i}.`, i);
    if (i > farthest) {
      emit(
        2,
        "A gap separates this index from every reachable position.",
        i,
        true,
        false,
      );
      return r.finish(false);
    }
    farthest = Math.max(farthest, i + values[i]);
    emit(3, `The reachable frontier extends to ${farthest}.`, i);
    if (farthest >= values.length - 1) {
      emit(4, "The last index is reachable.", i, true, true);
      return r.finish(true);
    }
  }
}
