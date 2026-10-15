import test from "node:test";
import assert from "node:assert/strict";
import { priorityLessons } from "../lib/data/priority-lessons.js";
import { deepLessons } from "../lib/data/deep-lessons.js";
import { models, runSystems } from "../lib/simulations/index.js";
const run = (id, p = {}) => runSystems(id, { ...deepLessons[id].input, ...p });
const result = (id, p) => run(id, p).result;
test("all 47 labs have deterministic bounded traces and valid visual references", () => {
  assert.equal(Object.keys(deepLessons).length, 47);
  assert.deepEqual(
    Object.keys(models).sort(),
    Object.keys({ ...deepLessons, ...priorityLessons }).sort(),
  );
  for (const [id, l] of Object.entries(deepLessons))
    for (const patch of [{}, l.alternative.patch]) {
      const input = { ...l.input, ...patch },
        copy = structuredClone(input),
        r = runSystems(id, input);
      assert.deepEqual(input, copy, id);
      assert.deepEqual(runSystems(id, input), r, id);
      assert.ok(r.events.length > 0 && r.events.length < 500, id);
      for (const e of r.events) {
        assert.ok(r.code[e.line], id);
        assert.ok(e.message, id);
        for (const [a, b] of e.links) assert.ok(e.nodes[a] && e.nodes[b], id);
        for (const row of e.rows)
          assert.equal(row.length, e.columns.length, id);
        for (const b of e.bars) assert.ok(Number.isFinite(b.value), id);
      }
    }
});
test("B+ tree split invariants and searches hold across insertion orders", () => {
  for (const values of [
    Array.from({ length: 16 }, (_, i) => i),
    Array.from({ length: 16 }, (_, i) => 15 - i),
    [9, 2, 8, 3, 7, 4, 6, 5, 1, 0, 9],
  ]) {
    for (const target of [0, 5, 15, 99]) {
      const r = result("db-bplus", { values, target }),
        depths = [],
        leaves = [];
      function visit(n, d) {
        assert.ok(n.keys.length <= 3);
        assert.deepEqual(
          n.keys,
          [...n.keys].sort((a, b) => a - b),
        );
        if (n.leaf) {
          depths.push(d);
          leaves.push(...n.keys);
          return n.keys[0];
        }
        assert.equal(n.children.length, n.keys.length + 1);
        const mins = n.children.map((c) => visit(c, d + 1));
        assert.deepEqual(n.keys, mins.slice(1));
        return mins[0];
      }
      visit(r.root, 1);
      assert.equal(new Set(depths).size, 1);
      assert.deepEqual(
        leaves,
        [...new Set(values)].sort((a, b) => a - b),
      );
      assert.equal(r.found, values.includes(target));
      assert.equal(r.reads, depths[0]);
    }
  }
});
test("index and join choices preserve answers while changing work", () => {
  const a = result("db-composite"),
    b = result("db-composite", { order: "score-tenant" }),
    c = result("db-composite", { order: "scan" });
  assert.deepEqual(a.result, b.result);
  assert.deepEqual(a.result, c.result);
  assert.ok(a.examined < b.examined && b.examined < c.examined);
  for (const size of [2, 5, 8]) {
    const a = result("db-joins", { size, method: "nested" }),
      b = result("db-joins", { size, method: "hash" });
    assert.deepEqual(a.result, b.result);
    assert.ok(a.work >= b.work);
  }
  assert.equal(result("db-plans", { matches: 5 }).plan, "index");
  assert.equal(result("db-plans", { matches: 1900 }).plan, "scan");
  assert.deepEqual(result("db-mvcc").seen, [100, 70]);
  assert.deepEqual(
    result("db-mvcc", { isolation: "repeatable-read" }).seen,
    [100, 100],
  );
  assert.equal(result("db-wal", { crash: "after-commit" }).visible, 2);
});
test("JVM reachability, hash collisions, pool limits and virtual I/O scheduling", () => {
  assert.deepEqual(result("jvm-gc").freed, [3, 4]);
  assert.equal(result("jvm-gc", { root: "drop" }).freed.length, 5);
  assert.equal(result("jvm-memory", { depth: 6 }).value, 21);
  assert.deepEqual(
    result("jvm-hashmap", { keys: ["Aa", "BB", "Aa", "cat", "dog"] }).entries,
    ["Aa", "BB", "cat", "dog"],
  );
  for (const workers of [1, 2, 3]) {
    const p = result("jvm-pools", { workers, queue: 0, tasks: 8 });
    assert.equal(p.done, workers);
    assert.equal(p.rejected.length, 8 - workers);
    const a = result("jvm-virtual", { workers }),
      b = result("jvm-virtual", { workers, mode: "virtual" });
    assert.equal(b.completed, 6);
    assert.ok(b.time <= a.time);
  }
});
test("OS scheduling conserves CPU work and paging/TLB results match references", () => {
  for (const method of ["fcfs", "round-robin"])
    for (const overhead of [0, 1, 3]) {
      const r = result("os-scheduling", {
        bursts: [5, 3, 7],
        method,
        overhead,
      });
      assert.equal(
        r.timeline.reduce((s, t) => s + t.duration, 0),
        r.time,
      );
      assert.equal(
        r.timeline
          .filter((t) => t.label !== "switch")
          .reduce((s, t) => s + t.duration, 0),
        15,
      );
      assert.deepEqual(
        r.waiting,
        r.completion.map((c, i) => c - [5, 3, 7][i]),
      );
    }
  assert.equal(result("os-paging").faults, 6);
  assert.deepEqual(result("os-tlb").translated, [8, 9, 32, 33, 56, 8, 16, 9]);
  assert.equal(result("os-tlb").misses, 5);
});
test("TCP recovers every single loss and cache keeps representation semantics", () => {
  for (let packets = 3; packets <= 8; packets++)
    for (let drop = 0; drop <= packets; drop++) {
      const r = result("web-tcp", { packets, drop });
      assert.equal(r.ack, packets * 100);
      assert.equal(r.transmissions, packets + Number(drop > 0));
    }
  assert.equal(result("web-congestion").history[5], 1);
  assert.equal(result("web-cache", { age: 0 }).networkRequests, 0);
  assert.equal(result("web-cache", { origin: "changed" }).version, 2);
});
test("majorities, quorum intersections, vector causality and ring ownership", () => {
  for (let n = 1; n <= 5; n++) {
    assert.equal(result("dist-raft", { reachable: n }).committed, n >= 3);
    assert.equal(result("dist-election", { votes: n }).leader, n >= 3);
  }
  for (let n = 3; n <= 7; n++)
    for (let w = 1; w <= n; w++)
      for (let r = 1; r <= n; r++) {
        const x = result("dist-quorum", { n, w, r });
        assert.equal(x.guaranteed, w + r > n);
        assert.equal(x.intersection.length, Math.max(0, w + r - n));
      }
  for (const vnodes of [1, 2, 4]) {
    const r = result("dist-ring", { vnodes });
    for (const k of r.moves)
      assert.equal(r.owners[Number(k.split("-")[1])], "D");
  }
  assert.equal(result("dist-vector").concurrent, true);
  for (const query of ["cat", "dog", "bird"])
    assert.equal(result("dist-bloom", { query }).maybe, true);
  assert.equal(result("dist-bloom").actual, false);
  assert.equal(result("dist-bloom").maybe, true);
});
test("compiler precedence, merge conflicts, dependency resolution and failed CI", () => {
  for (const [expression, value] of [
    ["2+3*4", 14],
    ["(2+3)*4", 20],
    ["0+7*2", 14],
  ])
    for (const optimize of ["on", "off"])
      assert.equal(
        result("tool-compiler", { expression, optimize }).value,
        value,
      );
  for (const expression of ["2 +", "(2+3", "2/3", "process.exit()", "2 3"])
    assert.throws(() => result("tool-compiler", { expression }));
  assert.deepEqual(result("tool-merge").result, {
    color: "red",
    size: "large",
  });
  assert.equal(result("tool-dependencies").conflict, true);
  assert.equal(result("tool-cicd", { failure: "test" }).deployed, false);
});
test("BPE preserves text and cached attention matches full recomputation", () => {
  const corpus = "low low lower newest";
  const r = result("llm-bpe", { corpus });
  assert.equal(
    r.words.map((w) => w.join("").replaceAll("▁", "")).join(" "),
    corpus,
  );
  for (const prompt of ["the", "the cat", "a dog"]) {
    const r = result("llm-kv", { prompt, append: "sat on the mat" });
    assert.ok(r.maxError < 1e-10);
    assert.ok(r.rows < r.uncached);
    assert.equal(r.bytes, r.rows * 32);
  }
  assert.equal(result("llm-heads").outputs.length, 2);
  for (const query of [
    [1, 0],
    [0, 1],
    [-1, 0],
    [-1, -1],
  ]) {
    const r = result("llm-vectors", { query, probes: 3 });
    assert.equal(r.approx, r.exact);
    assert.equal(r.comparisons, 6);
  }
});
test("quantization error is bounded and retrieval/evaluation do not imply truth", () => {
  for (const bits of [4, 8]) {
    const weights = [-10, -1.2, 0, 0.7, 9],
      r = result("llm-quantization", { weights, bits });
    r.restored.forEach((v, i) =>
      assert.ok(Math.abs(v - weights[i]) <= r.scale / 2 + 1e-12),
    );
    assert.ok(r.mse >= 0);
  }
  assert.equal(result("llm-quantization", { weights: [0, 0] }).mse, 0);
  assert.equal(result("llm-rag", { query: "zzzzzz" }).selected.length, 0);
  assert.ok(result("llm-evaluation").f1 > 0.8);
  assert.equal(result("llm-evaluation").grounded, false);
  assert.equal(result("llm-evaluation", { answer: "supported" }).f1, 1);
});
test("Spring fetch strategies and transaction failure matrix", () => {
  for (const users of [2, 4, 8]) {
    assert.equal(result("spring-orm", { users }).selects, users + 1);
    assert.equal(
      result("spring-orm", { users, strategy: "fetch-join" }).selects,
      1,
    );
    assert.equal(result("spring-orm", { users, strategy: "batch" }).selects, 2);
    assert.equal(
      result("spring-orm", { users, strategy: "closed" }).error,
      true,
    );
  }
  for (const [mode, failure, order, audit] of [
    ["REQUIRED", "inner", false, false],
    ["REQUIRED", "outer", false, false],
    ["REQUIRED", "none", true, true],
    ["REQUIRES_NEW", "inner", true, false],
    ["REQUIRES_NEW", "outer", false, true],
    ["REQUIRES_NEW", "none", true, true],
  ])
    assert.deepEqual(result("spring-propagation", { mode, failure }), {
      order,
      audit,
      exhausted: false,
    });
  assert.equal(
    result("spring-propagation", { mode: "REQUIRES_NEW", pool: 1 }).exhausted,
    true,
  );
  assert.equal(
    result("spring-testing", { layer: "unit", bug: "sql" }).caught,
    false,
  );
  assert.equal(
    result("spring-testing", { layer: "integration", bug: "sql" }).caught,
    true,
  );
});
test("malformed and oversized simulation inputs fail before producing traces", () => {
  for (const [id, p] of [
    ["db-bplus", { values: [] }],
    ["web-tcp", { packets: 999 }],
    ["llm-vectors", { query: [0, 0] }],
    ["os-scheduling", { bursts: [-1] }],
    ["llm-quantization", { weights: [Infinity] }],
  ])
    assert.throws(() => run(id, p));
  assert.throws(() => runSystems("missing", {}));
  assert.throws(() => runSystems("db-bplus", null));
});
