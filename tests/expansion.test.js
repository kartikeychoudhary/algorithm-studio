import test from "node:test";
import assert from "node:assert/strict";
import {
  productExceptSelf,
  rotatedSearch,
  rainWater,
  minimumWindow,
  majorityVote,
  unionFind,
} from "../lib/algorithms/interview-more.js";
import { parseProblem, runInterview } from "../lib/algorithms/interview.js";
import { moreLessons } from "../lib/data/more-lessons.js";
import { caseStudies } from "../lib/data/case-studies.js";
import { lessons } from "../lib/data/lessons.js";
import { walkthrough } from "../lib/learning/models.js";
import { practiceFor } from "../lib/data/practice.js";

test("new lesson defaults agree with their linked problem examples", () => {
  for (const [id, l] of Object.entries(moreLessons)) {
    const run = runInterview(
      id,
      parseProblem(id, JSON.stringify(l.values), l.parameter?.value, l.edges),
    );
    assert.deepEqual(run.result, l.problem.expected, id);
    assert.equal(run.events.at(-1).done, true);
    for (const e of run.events)
      assert.ok(e.line >= 0 && e.line < run.code.length);
  }
});
test("product, rainwater and variable window match independent exhaustive references", () => {
  for (let code = 0; code < 256; code++) {
    const a = Array.from({ length: 4 }, (_, i) => (code >> (i * 2)) & 3);
    assert.deepEqual(
      productExceptSelf(a).result,
      a.map((_, i) => a.reduce((p, x, j) => (i === j ? p : p * x), 1)),
    );
    const water = a.reduce(
      (sum, v, i) =>
        sum +
        Math.min(Math.max(...a.slice(0, i + 1)), Math.max(...a.slice(i))) -
        v,
      0,
    );
    assert.equal(rainWater(a).result, water);
    const positive = a.map((x) => x + 1);
    for (const target of [1, 5, 9, 20]) {
      let best = Infinity;
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j <= 4; j++)
          if (positive.slice(i, j).reduce((s, n) => s + n, 0) >= target)
            best = Math.min(best, j - i);
      assert.equal(
        minimumWindow(positive, target).result,
        best === Infinity ? 0 : best,
      );
    }
  }
  assert.deepEqual(
    productExceptSelf([-1, 1, 0, -3, 3]).result.map((x) => x || 0),
    [0, 0, 9, 0, 0],
  );
});
test("rotated search handles every pivot and missing target; majority survives cancellation", () => {
  for (let n = 1; n <= 12; n++) {
    const a = Array.from({ length: n }, (_, i) => i * 3 - 10);
    for (let k = 0; k < n; k++) {
      const rotated = [...a.slice(k), ...a.slice(0, k)];
      for (let target = -11; target < 28; target++)
        assert.equal(
          rotatedSearch(rotated, target).result,
          rotated.indexOf(target),
        );
    }
    const votes = [
      ...Array(n + 1).fill(7),
      ...Array.from({ length: n }, (_, i) => i + 20),
    ];
    for (let k = 0; k < votes.length; k++)
      assert.equal(
        majorityVote([...votes.slice(k), ...votes.slice(0, k)]).result,
        7,
      );
  }
});
test("union-find agrees with graph traversal on every graph with four vertices", () => {
  const candidates = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  for (let mask = 0; mask < 64; mask++) {
    const edges = candidates.filter((_, i) => mask & (1 << i));
    const visited = new Set();
    let components = 0;
    for (let v = 0; v < 4; v++) {
      if (visited.has(v)) continue;
      components++;
      const queue = [v];
      visited.add(v);
      while (queue.length) {
        const u = queue.shift();
        for (const [a, b] of edges) {
          const next = a === u ? b : b === u ? a : null;
          if (next !== null && !visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
    }
    assert.equal(
      unionFind(4, edges).result,
      edges.length < 3 ? -1 : components - 1,
    );
  }
});
test("editors enforce algorithm preconditions", () => {
  for (const [id, values, p, edges] of [
    ["rotated", "[2,1,3]", 1],
    ["rotated", "[1,1]", 1],
    ["minwindow", "[1,0,2]", 3],
    ["majority", "[1,2,3]"],
    ["rain", "[-1,2]"],
    ["product", "[10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]"],
    ["union", "[]", 3, "[[0,1],[1,0]]"],
  ])
    assert.throws(() => parseProblem(id, values, p, edges));
});
test("case studies connect valid lessons and playable scenarios; practice links are distinct HTTPS problem URLs", () => {
  for (const c of Object.values(caseStudies)) {
    assert.ok(c.requirements.length && c.apis.length && c.failures.length);
    for (const [id] of c.concepts) assert.ok(lessons[id]);
    for (const s of c.scenarios) {
      const run = walkthrough(s);
      assert.equal(run.events.at(-1).done, true);
      for (const [a, b] of s.edges) {
        assert.ok(s.nodes[a]);
        assert.ok(s.nodes[b]);
        assert.notEqual(a, b);
      }
    }
  }
  for (const [id, l] of Object.entries(lessons)) {
    const list = practiceFor(id, l);
    assert.equal(new Set(list.map((p) => p.url)).size, list.length);
    for (const p of list) {
      assert.match(p.url, /^https:\/\/leetcode.com\/problems\/[a-z0-9-]+\/$/);
      assert.ok(p.reason);
    }
  }
});
