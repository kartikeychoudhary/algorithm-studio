import test from "node:test";
import assert from "node:assert/strict";
import { priorityLessons } from "../lib/data/priority-lessons.js";
import { lessons } from "../lib/data/lessons.js";
import { runSystems } from "../lib/simulations/index.js";
import {
  studyGoals,
  goalIds,
  goalStats,
  goalPosition,
} from "../lib/data/study-goals.js";
import { incidentLessons, incidentOutcome } from "../lib/data/incidents.js";
import { recoveryTrace } from "../lib/learning/recovery.js";
const run = (id, p = {}) =>
  runSystems(id, { ...priorityLessons[id].input, ...p });
const result = (id, p) => run(id, p).result;
test("goal guides have unique valid lessons, meaningful checkpoints and independent completion", () => {
  for (const goal of Object.values(studyGoals)) {
    const ids = goalIds(goal);
    assert.equal(new Set(ids).size, ids.length);
    ids.forEach((id) => assert.ok(lessons[id], id));
    goal.stages.forEach((s) => assert.ok(s.checkpoint && s.outcome));
    assert.equal(goalStats(goal, {}).next, ids[0]);
    assert.equal(goalStats(goal, { [ids[0]]: { status: "learned" } }).done, 0);
    const progress = Object.fromEntries(
      ids.map((id) => [id, { completed: true, status: "review" }]),
    );
    assert.equal(goalStats(goal, progress).percent, 100);
    assert.equal(goalStats(goal, progress).next, undefined);
    ids.forEach((id, i) => assert.equal(goalPosition(goal, id).index, i));
  }
  const dsa = new Set(goalIds(studyGoals.dsa));
  for (const id of Object.keys(priorityLessons).filter((id) =>
    id.startsWith("adv-"),
  ))
    assert.ok(dsa.has(id));
  assert.ok(
    !goalIds(studyGoals.structures).some(
      (id) => id.startsWith("spring-") || id.startsWith("llm-"),
    ),
  );
});
test("every new model produces immutable deterministic traces for defaults and alternatives", () => {
  for (const [id, l] of Object.entries(priorityLessons))
    for (const patch of [{}, l.alternative.patch]) {
      const p = { ...l.input, ...patch },
        before = structuredClone(p),
        r = runSystems(id, p);
      assert.deepEqual(p, before);
      assert.deepEqual(runSystems(id, p), r);
      assert.ok(r.events.length > 0 && r.events.length < 500);
      for (const e of r.events) {
        assert.ok(r.code[e.line]);
        for (const [a, b] of e.links) assert.ok(e.nodes[a] && e.nodes[b]);
        for (const row of e.rows) assert.equal(row.length, e.columns.length);
      }
    }
});
test("both range structures match direct sums after point assignment", () => {
  for (let n = 1; n <= 10; n++)
    for (let index = 0; index < n; index++)
      for (let left = 0; left < n; left++) {
        const nums = Array.from(
            { length: n },
            (_, i) => ((i * 7 + n) % 19) - 9,
          ),
          value = 17,
          right = n - 1,
          updated = nums.map((v, i) => (i === index ? value : v)),
          expected = updated.slice(left, right + 1).reduce((a, b) => a + b, 0);
        for (const id of ["adv-fenwick", "adv-segment"])
          assert.equal(
            result(id, { nums, index, value, left, right }).sum,
            expected,
          );
      }
});
test("monotonic deque agrees with all brute-force windows including duplicate values", () => {
  for (let n = 1; n <= 12; n++)
    for (let k = 1; k <= n; k++) {
      const nums = Array.from({ length: n }, (_, i) => ((i * 3 + n) % 7) - 3),
        expected = nums
          .slice(k - 1)
          .map((_, i) => Math.max(...nums.slice(i, i + k)));
      assert.deepEqual(result("adv-deque", { nums, k }).result, expected);
    }
});
test("Kruskal agrees with an independent Prim reference", () => {
  for (let seed = 1; seed <= 25; seed++) {
    const points = Array.from({ length: (seed % 7) + 1 }, (_, i) => [
        ((seed * i + 3) % 17) - 8,
        ((i * i + seed) % 13) - 6,
      ]),
      used = new Set([0]);
    let cost = 0;
    while (used.size < points.length) {
      let best = Infinity,
        to = -1;
      for (const a of used)
        for (let b = 0; b < points.length; b++)
          if (!used.has(b)) {
            const w =
              Math.abs(points[a][0] - points[b][0]) +
              Math.abs(points[a][1] - points[b][1]);
            if (w < best) {
              best = w;
              to = b;
            }
          }
      cost += best;
      used.add(to);
    }
    const r = result("adv-mst", { points });
    assert.equal(r.cost, cost);
    assert.equal(r.edges.length, points.length - 1);
  }
});
function reach(n, edges, start, undirected = false) {
  const seen = new Set([start]),
    q = [start];
  while (q.length) {
    const v = q.shift();
    for (const [a, b] of edges) {
      const w = a === v ? b : undirected && b === v ? a : null;
      if (w !== null && !seen.has(w)) {
        seen.add(w);
        q.push(w);
      }
    }
  }
  return seen;
}
test("SCC assignments agree with mutual reachability on directed graphs", () => {
  const n = 4,
    pairs = [];
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) if (a !== b) pairs.push([a, b]);
  for (let mask = 0; mask < 1 << pairs.length; mask += 7) {
    const edges = pairs.filter((_, i) => mask & (1 << i)),
      r = result("adv-scc", { n, edges }),
      reachability = Array.from({ length: n }, (_, i) => reach(n, edges, i));
    for (let a = 0; a < n; a++)
      for (let b = 0; b < n; b++)
        assert.equal(
          r.assigned[a] === r.assigned[b],
          reachability[a].has(b) && reachability[b].has(a),
        );
  }
});
test("bridges match removal-based connectivity across all four-vertex graphs", () => {
  const n = 4,
    pairs = [];
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) pairs.push([a, b]);
  for (let mask = 0; mask < 1 << pairs.length; mask++) {
    const edges = pairs.filter((_, i) => mask & (1 << i)),
      expected = edges.filter(
        ([a, b], i) =>
          !reach(
            n,
            edges.filter((_, j) => j !== i),
            a,
            true,
          ).has(b),
      );
    assert.deepEqual(result("adv-bridges", { n, edges }).bridges, expected);
  }
});
test("KMP matches native substring search and valid proper prefix/suffix lengths", () => {
  const words = (n) =>
    Array.from({ length: 1 << n }, (_, v) =>
      Array.from({ length: n }, (_, i) => (v & (1 << i) ? "a" : "b")).join(""),
    );
  for (let n = 1; n <= 5; n++)
    for (const haystack of words(n))
      for (let m = 1; m <= 3; m++)
        for (const needle of words(m)) {
          const r = result("adv-kmp", { haystack, needle });
          assert.equal(r.index, haystack.indexOf(needle));
          r.lps.forEach((v, i) => {
            const part = needle.slice(0, i + 1);
            assert.ok(v < part.length);
            assert.equal(part.slice(0, v), v ? part.slice(-v) : "");
          });
        }
});
test("bitmask partition agrees with a bucket backtracking reference", () => {
  function brute(nums, k) {
    const sum = nums.reduce((a, b) => a + b, 0);
    if (sum % k) return false;
    const target = sum / k,
      buckets = Array(k).fill(0);
    function visit(i) {
      if (i === nums.length) return buckets.every((v) => v === target);
      for (let j = 0; j < k; j++) {
        if (buckets[j] + nums[i] > target) continue;
        buckets[j] += nums[i];
        if (visit(i + 1)) return true;
        buckets[j] -= nums[i];
        if (!buckets[j]) break;
      }
      return false;
    }
    return visit(0);
  }
  for (let seed = 1; seed <= 30; seed++) {
    const nums = Array.from(
      { length: (seed % 6) + 2 },
      (_, i) => ((seed + i * 3) % 6) + 1,
    );
    for (let k = 1; k <= Math.min(nums.length, 4); k++) {
      const r = result("adv-bitmask", { nums, k });
      assert.equal(r.possible, brute(nums, k));
      if (r.possible) {
        assert.equal(r.groups.length, k);
        assert.equal(new Set(r.groups.flat()).size, nums.length);
        r.groups.forEach((g) =>
          assert.equal(
            g.reduce((s, i) => s + nums[i], 0),
            r.target,
          ),
        );
      }
    }
  }
});
test("messaging preserves per-key order, unique ownership and explicit crash semantics", () => {
  const logs = result("msg-partitions").logs;
  for (const key of ["order-a", "order-b"]) {
    const locations = logs
      .map((l, i) => (l.some((m) => m.key === key) ? i : -1))
      .filter((i) => i >= 0);
    assert.equal(locations.length, 1);
  }
  logs.forEach((l) =>
    assert.deepEqual(
      l.map((m) => m.id),
      l.map((m) => m.id).sort((a, b) => a - b),
    ),
  );
  assert.deepEqual(
    result("msg-groups", { consumers: 1, failure: "consumer-0" }).owners,
    [-1, -1, -1, -1],
  );
  assert.ok(
    result("msg-groups", { failure: "consumer-0" }).owners.every(
      (o) => o === 1,
    ),
  );
  assert.equal(result("msg-delivery").effects, 2);
  assert.equal(result("msg-delivery", { dedupe: "on" }).effects, 1);
  assert.equal(result("msg-delivery", { commit: "before-effect" }).lost, true);
  for (const policy of ["bounded", "unbounded"])
    for (let arrival = 1; arrival <= 12; arrival++) {
      const r = result("msg-pressure", { arrival, policy });
      assert.equal(r.queue + r.processed + r.rejected, arrival * 8);
      if (policy === "bounded") assert.ok(r.queue <= 15);
    }
});
test("observability models compute parallel duration, nearest-rank percentiles and budgets", () => {
  for (const database of [10, 60, 500])
    for (const remote of [10, 60, 500]) {
      const r = result("obs-traces", { database, remote, context: "break" });
      assert.equal(r.total, 30 + Math.max(database, remote));
      assert.equal(r.spans[3].trace, "T2");
      r.spans.forEach((s) => assert.ok(s.start + s.duration <= r.total));
    }
  assert.deepEqual(result("obs-latency"), {
    mean: 64,
    p50: 21,
    p95: 450,
    p99: 450,
    slow: 1,
  });
  assert.equal(result("obs-slo", { failures: 10 }).met, true);
  assert.equal(result("obs-slo", { failures: 11 }).met, false);
  assert.equal(result("obs-slo").allowance, 10);
});
test("incident outcomes agree with recovery calculations and reject unsupported choices", () => {
  for (const [id, l] of Object.entries(incidentLessons)) {
    for (const [c] of l.choices) {
      const result = incidentOutcome(id, c),
        run = recoveryTrace(id, c);
      assert.equal(result.value, run.result.value);
      assert.equal(result.correct, c === l.correct);
      assert.ok(run.events.length >= 2);
    }
    assert.throws(() => incidentOutcome(id, "missing"));
  }
});
test("algorithm input bounds prevent ambiguous or excessive work", () => {
  for (const [id, p] of [
    ["adv-fenwick", { right: 99 }],
    ["adv-segment", { left: 4, right: 1 }],
    ["adv-deque", { k: 0 }],
    ["adv-scc", { edges: [[0, 0]] }],
    [
      "adv-bridges",
      {
        edges: [
          [0, 1],
          [1, 0],
        ],
      },
    ],
    ["adv-bitmask", { nums: Array(9).fill(1) }],
    ["adv-kmp", { needle: "" }],
    ["obs-slo", { failures: 99999 }],
  ])
    assert.throws(() => run(id, p));
});
