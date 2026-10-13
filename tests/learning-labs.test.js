import test from "node:test";
import assert from "node:assert/strict";
import { runLab, validateLab } from "../lib/algorithms/lab-algorithms.js";
import { labLessons } from "../lib/data/lab-lessons.js";
import {
  springLessons,
  springAnnotations,
  annotationScenario,
} from "../lib/data/spring-lessons.js";
import { foundationLessons } from "../lib/data/foundation-lessons.js";
import { walkthrough } from "../lib/learning/models.js";
import {
  trafficTick,
  initialTraffic,
  raceStep,
  initialRace,
  compareSearch,
  debugSearch,
} from "../lib/learning/experiments.js";
import { encodeTrace, decodeTrace } from "../lib/learning/sharing.js";
test("new algorithm examples produce immutable bounded traces with valid code pointers", () => {
  for (const [id, l] of Object.entries(labLessons)) {
    const input = validateLab(id, l.input),
      before = structuredClone(input),
      run = runLab(id, input);
    assert.deepEqual(input, before);
    assert.ok(run.events.length > 0);
    assert.ok(run.events.at(-1).done);
    for (const e of run.events)
      assert.ok(e.line >= 0 && e.line < run.code.length);
    assert.deepEqual(run.events.at(-1).result, run.result);
  }
});
test("lower bound and capacity search match exhaustive answers", () => {
  for (let n = 1; n <= 9; n++) {
    const nums = Array.from({ length: n }, (_, i) => Math.floor(i / 2));
    for (let target = -1; target <= n; target++) {
      const index = nums.findIndex((x) => x >= target);
      assert.equal(
        runLab("lowerbound", { nums, target }).result,
        index < 0 ? n : index,
      );
    }
    const weights = Array.from({ length: n }, (_, i) => (i % 4) + 1);
    for (let days = 1; days <= n; days++) {
      const feasible = (cap) => {
        let bins = 1,
          total = 0;
        for (const w of weights) {
          if (total + w > cap) {
            bins++;
            total = 0;
          }
          total += w;
        }
        return bins <= days;
      };
      let cap = Math.max(...weights);
      while (!feasible(cap)) cap++;
      assert.equal(runLab("capacity", { weights, days }).result, cap);
    }
  }
});
test("LCS matches brute-force subsequence intersections", () => {
  const all = (s) => {
    let set = new Set();
    for (let mask = 0; mask < 2 ** s.length; mask++)
      set.add([...s].filter((_, i) => mask & (1 << i)).join(""));
    return set;
  };
  for (const a of ["", "a", "ab", "aba", "abbc"])
    for (const b of ["", "b", "ba", "abc", "aacb"]) {
      const bs = all(b),
        expected = Math.max(
          ...[...all(a)].filter((s) => bs.has(s)).map((s) => s.length),
        );
      assert.equal(runLab("lcs", { text1: a, text2: b }).result, expected);
    }
});
test("trie prefix semantics and top-k frequencies match reference operations", () => {
  const words = ["apple", "app", "ape", "bat"];
  for (const prefix of ["a", "app", "apple", "appled", "ba", "cat"])
    assert.equal(
      runLab("trie", { words, prefix }).result,
      words.some((w) => w.startsWith(prefix)),
    );
  for (const nums of [[1], [3, 3, 2, 1, 2, 3], [-1, 0, -1, 2, 2, 2]])
    for (let k = 1; k <= new Set(nums).size; k++) {
      const result = runLab("topk", { nums, k }).result,
        counts = (v) => nums.filter((x) => x === v).length;
      const threshold = [...new Set(nums)].map(counts).sort((a, b) => b - a)[
        k - 1
      ];
      assert.equal(new Set(result).size, k);
      assert.ok(result.every((v) => counts(v) >= threshold));
    }
});
test("interval merging preserves coverage and removes all overlaps", () => {
  for (const intervals of [
    [
      [1, 4],
      [4, 5],
    ],
    [
      [3, 3],
      [0, 2],
      [1, 5],
    ],
    [
      [8, 10],
      [1, 3],
      [2, 6],
    ],
  ]) {
    const merged = runLab("intervals", { intervals }).result;
    assert.ok(merged.every((x, i) => !i || merged[i - 1][1] < x[0]));
    for (let x = 0; x <= 10; x += 0.5)
      assert.equal(
        merged.some(([a, b]) => a <= x && x <= b),
        intervals.some(([a, b]) => a <= x && x <= b),
      );
  }
});
test("constraint search has known queen counts and preserves Sudoku clues", () => {
  [1, 0, 0, 2, 10, 4].forEach((count, i) => {
    const run = runLab("queens", { n: i + 1 });
    assert.equal(run.result.length, count);
    for (const q of run.result)
      for (let a = 0; a < q.length; a++)
        for (let b = a + 1; b < q.length; b++) {
          assert.notEqual(q[a], q[b]);
          assert.notEqual(Math.abs(q[a] - q[b]), b - a);
        }
  });
  const board = labLessons.sudoku.input.board,
    result = runLab("sudoku", { board }).result;
  for (let i = 0; i < 9; i++) {
    assert.equal(new Set(result[i]).size, 9);
    assert.equal(new Set(result.map((r) => r[i])).size, 9);
  }
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c]) assert.equal(result[r][c], board[r][c]);
});
test("unsafe and misleading lab inputs are rejected", () => {
  for (const [id, input] of [
    ["trie", { words: ["ABC"], prefix: "a" }],
    ["lowerbound", { nums: [3, 1], target: 1 }],
    ["capacity", { weights: [0], days: 1 }],
    ["topk", { nums: [1], k: 2 }],
    ["queens", { n: 8 }],
    ["lcs", { text1: "a".repeat(30), text2: "b" }],
    ["intervals", { intervals: [[5, 2]] }],
    ["sudoku", { board: Array.from({ length: 9 }, () => Array(9).fill(0)) }],
  ])
    assert.throws(() => validateLab(id, input));
});
test("race interleaving loses an update while lock ownership prevents it", () => {
  let s = initialRace;
  for (const w of ["a", "b", "a", "b"]) s = raceStep(s, w, false);
  assert.equal(s.value, 1);
  s = initialRace;
  for (const w of ["a", "b", "a", "b", "b"]) s = raceStep(s, w, true);
  assert.equal(s.value, 2);
  assert.equal(s.owner, null);
  assert.equal(initialRace.value, 0);
});
test("traffic experiment grows and drains queues, amplifies retries, and restores after recovery", () => {
  let paused = initialTraffic;
  for (let i = 0; i < 5; i++) paused = trafficTick(paused, { paused: true });
  assert.equal(paused.queue, 500);
  let restored = trafficTick(paused, { rate: 10 });
  assert.ok(restored.queue < paused.queue);
  let fail = initialTraffic;
  for (let i = 0; i < 4; i++)
    fail = trafficTick(fail, { databaseDown: true, cacheDown: true });
  assert.equal(fail.open, true);
  assert.equal(fail.success, 0);
  assert.equal(trafficTick(fail, {}).open, false);
  const bounded = trafficTick(initialTraffic, {
      databaseDown: true,
      cacheDown: true,
      backoff: true,
    }),
    unbounded = trafficTick(initialTraffic, {
      databaseDown: true,
      cacheDown: true,
      backoff: false,
    });
  assert.ok(unbounded.retry > bounded.retry);
});
test("search comparisons and debugging execute rather than use canned results", () => {
  const nums = [1, 3, 5, 7, 9],
    r = compareSearch(nums, 9);
  assert.equal(r.answer, 4);
  assert.equal(r.bAnswer, 4);
  assert.ok(r.binary.length < r.linear.length);
  assert.equal(debugSearch([5], 5, false).result, -1);
  assert.equal(debugSearch([5], 5, true).result, 0);
});
test("Spring and foundation sequences reference real participants, with a complete HTTP return path", () => {
  for (const lesson of [
    ...Object.values(springLessons),
    ...Object.values(foundationLessons),
  ])
    for (const s of lesson.scenarios) {
      for (const [from, to] of s.steps) {
        assert.ok(s.nodes[from]);
        assert.ok(s.nodes[to]);
      }
      assert.ok(walkthrough(s).events.at(-1).done);
    }
  const request = springLessons["spring-request"].scenarios[0];
  assert.equal(request.steps.at(-1)[1], 0);
  assert.match(request.steps.at(-1)[3], /201/);
  assert.ok(springAnnotations.length >= 30);
  for (const a of springAnnotations)
    assert.equal(walkthrough(annotationScenario(a)).events.length, 3);
});
test("shared traces round-trip input and reject mismatched or invalid versions", () => {
  const input = { nums: [1, 2, 3], target: 2 };
  assert.deepEqual(
    decodeTrace(encodeTrace("lowerbound", input, 3), "lowerbound").input,
    input,
  );
  assert.throws(() => decodeTrace(encodeTrace("lowerbound", input, 3), "lcs"));
  assert.throws(() =>
    decodeTrace(JSON.stringify({ v: 1, id: "lcs", index: -1 }), "lcs"),
  );
  assert.throws(() => decodeTrace("x".repeat(12001), "lcs"));
});
