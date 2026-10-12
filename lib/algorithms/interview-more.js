import { recorder } from "./recorder.js";

export function productExceptSelf(values) {
  const r = recorder([
    "answer = [1] * n; prefix = 1",
    "for i from left to right: answer[i] = prefix; prefix *= nums[i]",
    "suffix = 1",
    "for i from right to left: answer[i] *= suffix; suffix *= nums[i]",
    "return answer",
  ]);
  const answer = values.map(() => 1);
  let prefix = 1,
    suffix = 1;
  const emit = (line, message, i, done = false) =>
    r.emit(line, message, {
      values,
      active: i == null ? [] : [i],
      output: answer,
      vars: { prefix, suffix },
      done,
      result: done ? answer : undefined,
    });
  emit(0, "Each output starts at the multiplicative identity.");
  for (let i = 0; i < values.length; i++) {
    answer[i] = prefix;
    prefix *= values[i];
    emit(1, `Store the product strictly left of index ${i}.`, i);
  }
  emit(2, "Now carry the product strictly to the right.");
  for (let i = values.length - 1; i >= 0; i--) {
    answer[i] *= suffix;
    suffix *= values[i];
    emit(3, `Combine the two sides without division at index ${i}.`, i);
  }
  emit(4, "The current element was excluded from each product.", null, true);
  return r.finish(answer);
}
export function rotatedSearch(values, target) {
  const r = recorder([
    "left = 0; right = n - 1",
    "while left <= right: mid = floor((left + right) / 2)",
    "  if nums[mid] == target: return mid",
    "  if nums[left] <= nums[mid]: // left half sorted",
    "    if nums[left] <= target < nums[mid]: right = mid - 1; else: left = mid + 1",
    "  else: // right half sorted",
    "    if nums[mid] < target <= nums[right]: left = mid + 1; else: right = mid - 1",
    "return -1",
  ]);
  let left = 0,
    right = values.length - 1,
    mid = 0;
  const emit = (line, message, done = false, result) =>
    r.emit(line, message, {
      values,
      range: [left, right],
      active: done ? [] : [mid],
      pointers: { left, mid, right },
      vars: { left, mid, right, target },
      done,
      result,
    });
  emit(0, "Distinct values let us identify an ordered half.");
  while (left <= right) {
    mid = Math.floor((left + right) / 2);
    emit(1, `Inspect index ${mid}.`);
    if (values[mid] === target) {
      emit(2, "Found the target at its original index.", true, mid);
      return r.finish(mid);
    }
    if (values[left] <= values[mid]) {
      emit(3, "The left half is sorted.");
      if (values[left] <= target && target < values[mid]) right = mid - 1;
      else left = mid + 1;
      emit(4, "Retain only the half that could contain the target.");
    } else {
      emit(5, "The right half is sorted.");
      if (values[mid] < target && target <= values[right]) left = mid + 1;
      else right = mid - 1;
      emit(6, "Retain only the half that could contain the target.");
    }
  }
  emit(7, "No candidate interval remains.", true, -1);
  return r.finish(-1);
}
export function rainWater(values) {
  const r = recorder([
    "left = 0; right = n - 1; leftMax = rightMax = total = 0",
    "while left <= right:",
    "  if leftMax <= rightMax: leftMax = max(leftMax, height[left])",
    "    water[left] = leftMax - height[left]; total += water[left]; left++",
    "  else: rightMax = max(rightMax, height[right])",
    "    water[right] = rightMax - height[right]; total += water[right]; right--",
    "return total",
  ]);
  let left = 0,
    right = values.length - 1,
    leftMax = 0,
    rightMax = 0,
    total = 0;
  const water = values.map(() => 0);
  const emit = (line, message, active = [], done = false) =>
    r.emit(line, message, {
      values,
      water,
      active,
      pointers: { left, right },
      vars: { left, right, leftMax, rightMax, total },
      done,
      result: done ? total : undefined,
    });
  emit(0, "Resolve the side with the smaller known boundary.");
  while (left <= right) {
    emit(1, "The smaller boundary determines this side's water level.");
    if (leftMax <= rightMax) {
      leftMax = Math.max(leftMax, values[left]);
      emit(2, "Update the left boundary.", [left]);
      water[left] = leftMax - values[left];
      total += water[left];
      emit(3, `Add ${water[left]} units above index ${left}.`, [left]);
      left++;
    } else {
      rightMax = Math.max(rightMax, values[right]);
      emit(4, "Update the right boundary.", [right]);
      water[right] = rightMax - values[right];
      total += water[right];
      emit(5, `Add ${water[right]} units above index ${right}.`, [right]);
      right--;
    }
  }
  emit(6, `${total} units are trapped.`, [], true);
  return r.finish(total);
}
export function minimumWindow(values, target) {
  const r = recorder([
    "left = sum = 0; best = infinity",
    "for right in 0..n-1: sum += nums[right]",
    "  while sum >= target:",
    "    best = min(best, right - left + 1)",
    "    sum -= nums[left]; left++",
    "return 0 if best is infinity else best",
  ]);
  let left = 0,
    sum = 0,
    best = Infinity;
  const emit = (line, message, right = -1, done = false) =>
    r.emit(line, message, {
      values,
      range: [left, right],
      active: right < 0 ? [] : [right],
      pointers: { left, right },
      vars: { left, right, sum, target, best },
      done,
      result: done ? (best === Infinity ? 0 : best) : undefined,
    });
  emit(0, "Positive values make window growth and shrinking predictable.");
  for (let right = 0; right < values.length; right++) {
    sum += values[right];
    emit(1, "Expand the right edge.", right);
    while (sum >= target) {
      emit(2, "This window qualifies; try to shorten it.", right);
      best = Math.min(best, right - left + 1);
      emit(3, "Record the shortest qualifying length so far.", right);
      sum -= values[left++];
      emit(4, "Remove the left value.", right);
    }
  }
  emit(
    5,
    best === Infinity
      ? "No qualifying subarray exists."
      : `Shortest length is ${best}.`,
    values.length - 1,
    true,
  );
  return r.finish(best === Infinity ? 0 : best);
}
export function majorityVote(values) {
  const r = recorder([
    "candidate = none; balance = 0",
    "for value in nums:",
    "  if balance == 0: candidate = value",
    "  balance += 1 if value == candidate else -1",
    "return candidate // input guarantees a strict majority",
  ]);
  let candidate = null,
    balance = 0;
  const emit = (line, message, i = -1, done = false) =>
    r.emit(line, message, {
      values,
      active: i < 0 ? [] : [i],
      selected: values.flatMap((v, j) => (v === candidate ? [j] : [])),
      vars: { candidate, balance },
      done,
      result: done ? candidate : undefined,
    });
  emit(0, "Different votes cancel in pairs.");
  values.forEach((value, i) => {
    emit(1, `Read vote ${value}.`, i);
    if (balance === 0) {
      candidate = value;
      emit(2, "Start a new candidate when the balance is zero.", i);
    }
    balance += value === candidate ? 1 : -1;
    emit(3, "Update the cancellation balance, not the total frequency.", i);
  });
  emit(4, "A guaranteed strict majority survives pair cancellation.", -1, true);
  return r.finish(candidate);
}
export function unionFind(n, edges) {
  const r = recorder([
    "parent[i] = i; size[i] = 1; components = n",
    "if number of cables < n - 1: return -1",
    "find(x): while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]; return x",
    "for (a,b) in connections: ra = find(a); rb = find(b)",
    "  if ra == rb: continue // spare cable",
    "  attach smaller root under larger root; update size; components--",
    "return components - 1",
  ]);
  const parent = Array.from({ length: n }, (_, i) => i),
    size = Array(n).fill(1),
    values = [...parent];
  let components = n;
  const emit = (line, message, active = [], done = false, result) =>
    r.emit(line, message, {
      values,
      active,
      edges: parent.flatMap((p, i) => (p === i ? [] : [[i, p]])),
      dp: parent,
      dpTitle: "PARENT BY COMPUTER · ARROWS POINT TO PARENT",
      vars: { components, cables: edges.length },
      done,
      result,
    });
  emit(
    0,
    "Every computer starts as its own component. This diagram shows the parent forest, not physical cables.",
  );
  if (edges.length < n - 1) {
    emit(
      1,
      "Too few cables: a connected network needs at least n−1.",
      [],
      true,
      -1,
    );
    return r.finish(-1);
  }
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      emit(2, `Shorten the parent path for ${x}.`, [x, parent[x]]);
      x = parent[x];
    }
    return x;
  }
  for (const [a, b] of edges) {
    let ra = find(a),
      rb = find(b);
    emit(3, `Cable ${a}–${b}: roots are ${ra} and ${rb}.`, [a, b]);
    if (ra === rb) {
      emit(4, "This cable is redundant inside an existing component.", [a, b]);
      continue;
    }
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
    components--;
    emit(5, `Merge components under root ${ra}.`, [ra, rb]);
  }
  emit(
    6,
    `Move ${components - 1} spare cable(s) to connect the components.`,
    [],
    true,
    components - 1,
  );
  return r.finish(components - 1);
}
