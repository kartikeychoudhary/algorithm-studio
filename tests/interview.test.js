import test from "node:test";
import assert from "node:assert/strict";
import {
  binarySearch,
  twoPointers,
  slidingWindow,
  hashTwoSum,
  monotonicStack,
} from "../lib/algorithms/array-patterns.js";
import { mergeSort, topK } from "../lib/algorithms/sorting.js";
import {
  reverseList,
  inorderTree,
  topologicalSort,
} from "../lib/algorithms/structures.js";
import { coinChange, subsets } from "../lib/algorithms/dynamic-patterns.js";
import { parseProblem, runInterview } from "../lib/algorithms/interview.js";
import { interviewLessons } from "../lib/data/interview-lessons.js";

let seed = 731;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const arrays = Array.from({ length: 60 }, () =>
  Array.from(
    { length: 1 + Math.floor(random() * 10) },
    () => Math.floor(random() * 21) - 10,
  ),
);
test("binary search agrees with membership, including duplicates and absent targets", () => {
  for (const values of [[], ...arrays])
    for (const target of [-11, 0, 4, 11]) {
      const run = binarySearch(values, target),
        sorted = values.slice().sort((a, b) => a - b);
      assert.equal(run.result >= 0, values.includes(target));
      if (run.result >= 0) assert.equal(sorted[run.result], target);
    }
});
test("two pointers and hash lookup agree with exhaustive pair search without reusing indices", () => {
  for (const values of arrays)
    for (const target of [-6, 0, 7]) {
      const exists = values.some((x, i) =>
        values.some((y, j) => i < j && x + y === target),
      );
      for (const solve of [twoPointers, hashTwoSum]) {
        const result = solve(values, target).result,
          a =
            solve === twoPointers
              ? values.slice().sort((a, b) => a - b)
              : values;
        assert.equal(result.length === 2, exists);
        if (exists) {
          assert.notEqual(result[0], result[1]);
          assert.equal(a[result[0]] + a[result[1]], target);
        }
      }
    }
  assert.deepEqual(hashTwoSum([3], 6).result, []);
  assert.deepEqual(hashTwoSum([3, 3], 6).result, [0, 1]);
});
test("sliding windows match exhaustive sums for every valid k including all-negative arrays", () => {
  for (const a of arrays)
    for (let k = 1; k <= a.length; k++) {
      const sums = Array.from({ length: a.length - k + 1 }, (_, i) =>
          a.slice(i, i + k).reduce((s, n) => s + n, 0),
        ),
        result = slidingWindow(a, k).result;
      assert.equal(result.sum, Math.max(...sums));
      assert.equal(sums[result.start], result.sum);
    }
});
test("merge sort and bounded heaps match a reference sort and leave inputs unchanged", () => {
  for (const a of arrays) {
    const before = a.slice(),
      sorted = a.slice().sort((x, y) => x - y);
    assert.deepEqual(mergeSort(a).result, sorted);
    for (let k = 1; k <= a.length; k++) {
      const run = topK(a, k);
      assert.deepEqual(
        run.result.slice().sort((x, y) => x - y),
        sorted.slice(-k),
      );
      for (const e of run.events)
        for (let i = 1; i < e.heap.length; i++)
          assert.ok(e.heap[(i - 1) >> 1] <= e.heap[i]);
    }
    assert.deepEqual(a, before);
  }
});
test("monotonic stack returns the first strictly greater value to the right", () => {
  for (const a of arrays)
    assert.deepEqual(
      monotonicStack(a).result,
      a.map((value, i) => a.slice(i + 1).find((n) => n > value) ?? -1),
    );
});
test("linked list reversal preserves nodes and reverses every next pointer", () => {
  for (const a of [[], ...arrays]) {
    const run = reverseList(a),
      last = run.events.at(-1);
    assert.deepEqual(run.result, a.slice().reverse());
    assert.deepEqual(
      last.next,
      a.map((_, i) => (i ? i - 1 : null)),
    );
    assert.deepEqual(
      run.events[0].next,
      a.map((_, i) => (i + 1 < a.length ? i + 1 : null)),
    );
  }
});
test("iterative inorder agrees with an independent recursive traversal", () => {
  for (const a of [[], ...arrays]) {
    const expected = [];
    function visit(i) {
      if (i >= a.length) return;
      visit(2 * i + 1);
      expected.push(a[i]);
      visit(2 * i + 2);
    }
    visit(0);
    assert.deepEqual(inorderTree(a).result, expected);
  }
});
test("coin change agrees with breadth-first reachability, including greedy counterexample and impossible amounts", () => {
  for (const coins of [[1, 3, 4], [2, 4], [3, 7], [1], [5, 2, 5]])
    for (let amount = 0; amount <= 20; amount++) {
      const queue = [[0, 0]],
        seen = new Set([0]);
      let expected = -1;
      for (let i = 0; i < queue.length; i++) {
        const [value, count] = queue[i];
        if (value === amount) {
          expected = count;
          break;
        }
        for (const coin of coins) {
          const next = value + coin;
          if (next <= amount && !seen.has(next)) {
            seen.add(next);
            queue.push([next, count + 1]);
          }
        }
      }
      const result = coinChange(coins, amount).result;
      assert.equal(result.count, expected);
      if (expected >= 0) {
        assert.equal(
          result.coins.reduce((a, b) => a + b, 0),
          amount,
        );
        assert.equal(result.coins.length, expected);
        assert.ok(result.coins.every((c) => coins.includes(c)));
      }
    }
});
test("backtracking yields exactly the power set and copied outputs survive undo", () => {
  for (let n = 0; n <= 6; n++) {
    const a = Array.from({ length: n }, (_, i) => i + 1),
      result = subsets(a).result,
      expected = Array.from({ length: 2 ** n }, (_, mask) =>
        a.filter((_, i) => mask & (1 << i)).join(","),
      );
    assert.deepEqual(result.map((s) => s.join(",")).sort(), expected.sort());
  }
});
test("topological sort respects every prerequisite and detects cycles including self-loops", () => {
  const edges = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
      [2, 5],
    ],
    run = topologicalSort(6, edges);
  assert.equal(new Set(run.result).size, 6);
  for (const [a, b] of edges)
    assert.ok(run.result.indexOf(a) < run.result.indexOf(b));
  assert.equal(
    topologicalSort(4, [
      [0, 1],
      [1, 2],
      [2, 0],
    ]).result,
    null,
  );
  assert.equal(topologicalSort(2, [[0, 0]]).result, null);
  assert.deepEqual(topologicalSort(3, []).result, [0, 1, 2]);
});
test("all default traces end on a valid code line and snapshots are independent", () => {
  for (const [id, lesson] of Object.entries(interviewLessons)) {
    const problem = parseProblem(
        id,
        lesson.values.join(","),
        lesson.parameter?.value,
        lesson.edges,
      ),
      run = runInterview(id, problem);
    assert.ok(run.events.length > 1);
    assert.equal(run.events.at(-1).done, true);
    for (const e of run.events)
      assert.ok(e.line >= 0 && e.line < run.code.length);
    const first = structuredClone(run.events[0]);
    run.events.at(-1).values[0] = 999;
    assert.deepEqual(run.events[0], first);
  }
});
test("input validation rejects ambiguous or unsafe teaching examples", () => {
  for (const args of [
    ["binary", "", 3],
    ["window", "1,2", 3],
    ["heap", "1,2", 0],
    ["subsets", "1,1"],
    ["coins", "0,2", 5],
    ["coins", "1,2", -1],
    ["topo", "", 3, "0>3"],
    ["topo", "", 3, "0>1,0>1"],
    ["topo", "", 3, "oops"],
  ])
    assert.throws(() => parseProblem(...args));
  assert.deepEqual(parseProblem("topo", "", 3, "").edges, []);
});
