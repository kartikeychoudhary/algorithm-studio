import test from "node:test";
import assert from "node:assert/strict";
import {
  quickSort,
  kadane,
  prefixSum,
  increasingSubsequence,
  houseRobber,
  jumpGame,
} from "../lib/algorithms/interview-advanced.js";
import {
  transactionTrace,
  replicaAction,
  initialReplicas,
  walkthrough,
} from "../lib/learning/models.js";
import { patternList } from "../lib/data/design-patterns.js";
import { conceptLessons } from "../lib/data/concepts.js";
import { lessons } from "../lib/data/lessons.js";
import { navigationSections } from "../lib/data/navigation.js";
let seed = 390;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const samples = Array.from({ length: 80 }, () =>
  Array.from(
    { length: 1 + Math.floor(rnd() * 8) },
    () => Math.floor(rnd() * 15) - 7,
  ),
);
test("quicksort, Kadane and prefix counts agree with exhaustive reference results", () => {
  for (const a of samples) {
    assert.deepEqual(
      quickSort(a).result,
      [...a].sort((x, y) => x - y),
    );
    const sums = [];
    for (let i = 0; i < a.length; i++)
      for (let j = i; j < a.length; j++)
        sums.push(a.slice(i, j + 1).reduce((x, y) => x + y, 0));
    assert.equal(kadane(a).result, Math.max(...sums));
    for (const k of [-3, 0, 4])
      assert.equal(
        prefixSum(a, k).result,
        sums.filter((sum) => sum === k).length,
      );
  }
});
test("subsequence DP, non-adjacent DP and greedy reachability match independent searches", () => {
  for (const a of samples) {
    let lis = 0,
      rob = 0;
    const positive = a.map(Math.abs);
    for (let mask = 0; mask < 2 ** a.length; mask++) {
      const chosen = a.filter((_, i) => mask & (1 << i));
      if (chosen.every((x, i) => !i || x > chosen[i - 1]))
        lis = Math.max(lis, chosen.length);
      if (!(mask & (mask << 1)))
        rob = Math.max(
          rob,
          positive.reduce((sum, x, i) => sum + (mask & (1 << i) ? x : 0), 0),
        );
    }
    assert.equal(increasingSubsequence(a).result, lis);
    assert.equal(houseRobber(positive).result, rob);
    const reached = new Set([0]);
    for (let i = 0; i < positive.length; i++)
      if (reached.has(i))
        for (let step = 1; step <= positive[i]; step++) reached.add(i + step);
    assert.equal(jumpGame(positive).result, reached.has(positive.length - 1));
  }
});
test("transactions preserve committed invariants, rollback isolation and crash recovery", () => {
  for (const amount of [1, 30, 100]) {
    for (const mode of ["success", "rollback", "recovery"]) {
      const run = transactionTrace(amount, mode);
      assert.deepEqual(
        run.result,
        mode === "rollback" ? [100, 50] : [100 - amount, 50 + amount],
      );
      for (const event of run.events) {
        assert.equal(event.committed[0] + event.committed[1], 150);
        assert.ok(event.committed.every((x) => x >= 0));
      }
      assert.deepEqual(
        run.events.find((e) => e.line === 2).committed,
        [100, 50],
      );
      assert.equal(run.events.at(-1).done, true);
    }
  }
  for (const amount of [-1, 0, 101, 1.5])
    assert.deepEqual(transactionTrace(amount).result, [100, 50]);
});
test("partition model rejects isolated CP reads, allows stale AP reads and converges after repair", () => {
  let s = replicaAction(initialReplicas, "split");
  s = replicaAction(s, "write");
  assert.equal(s.a, 2);
  assert.equal(s.b, 1);
  s = replicaAction(s, "read");
  assert.match(s.reply, /Unavailable/);
  s = replicaAction(s, "ap");
  s = replicaAction(s, "read");
  assert.match(s.reply, /stale/);
  s = replicaAction(s, "heal");
  s = replicaAction(s, "read");
  assert.equal(s.reply, "Version 2");
  assert.equal(initialReplicas.a, 1);
});
test("all 23 patterns and principle walkthroughs have valid diagrams and immutable states", () => {
  assert.equal(patternList.length, 23);
  for (const scenario of [
    ...patternList,
    ...Object.values(conceptLessons)
      .flatMap((c) => c.facets)
      .filter((f) => f.nodes),
  ]) {
    assert.ok(scenario.nodes.length <= 5);
    const run = walkthrough(scenario);
    assert.equal(run.events.length, scenario.steps.length);
    assert.equal(run.events.at(-1).done, true);
    for (const event of run.events) {
      assert.ok(
        event.from < scenario.nodes.length && event.to < scenario.nodes.length,
      );
      assert.ok(event.line < run.code.length);
    }
    for (const [a, b] of scenario.edges)
      assert.ok(scenario.nodes[a] && scenario.nodes[b]);
    const first = structuredClone(run.events[0]);
    run.events.at(-1).states[0] = "changed";
    assert.deepEqual(run.events[0], first);
  }
});
test("the nested navigation contains every lesson exactly once", () => {
  const ids = navigationSections.flatMap((section) =>
    section.groups.flatMap((group) => group.ids),
  );
  assert.equal(ids.length, new Set(ids).size);
  assert.deepEqual(ids.sort(), Object.keys(lessons).sort());
});
