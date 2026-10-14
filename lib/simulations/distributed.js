import {
  trace,
  node,
  bars,
  bounded,
  numbers,
  choice,
  text,
  flow,
} from "./trace.js";
export function raft(p) {
  const reachable = bounded(p.reachable, 1, 5, "reachable"),
    r = trace(),
    majority = 3,
    nodes = Array.from({ length: 5 }, (_, i) => ({
      term: 4,
      log: i === 0 ? ["t4:x=7"] : [],
      committed: false,
    }));
  const visual = () => ({
    nodes: nodes.map((n, i) =>
      node(
        i ? "Follower " + i : "Leader 0",
        `${n.log.length ? "t4:x=7" : "empty"}${n.committed ? " · applied" : ""}`,
        n.committed ? "active" : "",
      ),
    ),
    links: Array.from({ length: Math.max(0, reachable - 1) }, (_, i) => [
      0,
      i + 1,
    ]),
    metrics: {
      Replicas: nodes.filter((n) => n.log.length).length,
      Majority: majority,
    },
  });
  r.step(
    "leader appends entry in current term 4",
    "The entry is initially uncommitted. A leader cannot acknowledge a durable consensus write merely because its own append succeeded.",
    visual(),
  );
  for (let i = 1; i < reachable; i++) {
    nodes[i].log = ["t4:x=7"];
    r.step(
      "AppendEntries; follower persists; acknowledge",
      `Follower ${i} accepts the current-term entry after the log-prefix check (assumed valid in this scenario).`,
      visual(),
    );
  }
  if (reachable >= majority) {
    nodes[0].committed = true;
    r.step(
      "advance commitIndex on current-term majority",
      "A majority durably stores this current-term entry. The leader applies it and may acknowledge the client.",
      visual(),
    );
    for (let i = 1; i < reachable; i++) nodes[i].committed = true;
    r.step(
      "heartbeat carries leaderCommit",
      "Reachable followers learn the commit index and apply the committed entry in order.",
      visual(),
    );
  } else
    r.step(
      "wait; do not commit or acknowledge success",
      "The leader has fewer than three replicas. The write remains uncommitted; a timeout is not a successful commit.",
      visual(),
    );
  return r.finish({ committed: reachable >= majority, nodes });
}
export function election(p) {
  const votes = bounded(p.votes, 1, 5, "votes"),
    r = trace(),
    states = Array(5).fill("follower; term 6");
  states[0] = "candidate; term 7; self-vote";
  const view = () => ({
    nodes: states.map((s, i) => node(`Node ${i}`, s, i === 0 ? "active" : "")),
    metrics: {
      Votes: states.filter(
        (s) => s.includes("voted") || s.includes("self-vote"),
      ).length,
      Required: 3,
    },
  });
  r.step(
    "election timeout; increment term; vote for self",
    "Node 0 has an up-to-date log in this scenario and starts a new election. Timeouts are staggered in real deployments.",
    view(),
  );
  for (let i = 1; i < votes; i++) {
    states[i] = "term 7; voted for 0";
    r.step(
      "RequestVote: one vote per term; check log freshness",
      `Node ${i} grants its only vote in term 7 after checking the candidate log.`,
      view(),
    );
  }
  states[0] = votes >= 3 ? "leader; term 7" : "candidate; no majority";
  r.step(
    votes >= 3
      ? "become leader; send heartbeats"
      : "remain candidate; retry after another timeout",
    votes >= 3
      ? "Three or more votes establish a leader in this term."
      : "No majority: nobody can claim leadership from this vote count.",
    { ...view(), metrics: { Votes: votes, Required: 3 } },
  );
  return r.finish({ leader: votes >= 3 });
}
export function quorum(p) {
  const n = bounded(p.n, 3, 7, "n"),
    w = bounded(p.w, 1, n, "w"),
    read = bounded(p.r, 1, n, "r"),
    r = trace();
  const written = Array.from({ length: w }, (_, i) => i),
    readSet = Array.from({ length: read }, (_, i) => n - read + i),
    intersection = written.filter((i) => readSet.includes(i));
  r.step(
    "write to W replicas",
    "Use a fixed replica set and acknowledge after W replicas accept version 2.",
    {
      nodes: Array.from({ length: n }, (_, i) =>
        node(`Replica ${i}`, i < w ? "v2" : "v1", i < w ? "active" : ""),
      ),
      metrics: { N: n, W: w, R: read },
    },
  );
  r.step(
    "read R replicas; compare versions",
    "Choose the read set with the smallest possible overlap. A read can still see old versions among its responses.",
    {
      nodes: Array.from({ length: n }, (_, i) =>
        node(
          `Replica ${i}`,
          `${i < w ? "v2" : "v1"} ${readSet.includes(i) ? "read" : ""}`,
          readSet.includes(i) ? "active" : "",
        ),
      ),
      columns: ["Write set", "Read set", "Intersection"],
      rows: [
        [
          written.join(","),
          readSet.join(","),
          intersection.join(",") || "none",
        ],
      ],
      metrics: {
        "R + W": read + w,
        "Overlap guaranteed": String(read + w > n),
      },
    },
  );
  r.step(
    "reconcile versions under the chosen protocol",
    "R+W>N guarantees intersection for this fixed set; it does not by itself guarantee linearizability under concurrent writes, sloppy quorums or failures.",
    {
      bars: bars([w, read, intersection.length], ["W", "R", "Overlap"]),
      metrics: { "Newest observed": intersection.length ? "v2" : "v1" },
    },
  );
  return r.finish({ intersection, guaranteed: w + read > n });
}
export function hash(value) {
  let h = 2166136261;
  for (const c of String(value))
    h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h >>> 0;
}
export function ring(p) {
  const count = bounded(p.keys, 4, 20, "keys"),
    vnodes = bounded(p.vnodes, 1, 4, "vnodes"),
    r = trace();
  const build = (names) =>
    names
      .flatMap((name) =>
        Array.from({ length: vnodes }, (_, i) => ({
          name,
          point: hash(`${name}:${i}`) % 1000,
        })),
      )
      .sort((a, b) => a.point - b.point || a.name.localeCompare(b.name));
  const owner = (key, ring) =>
    (ring.find((n) => n.point >= hash(key) % 1000) || ring[0]).name;
  const before = build(["A", "B", "C"]),
    after = build(["A", "B", "C", "D"]),
    keys = Array.from({ length: count }, (_, i) => `key-${i}`),
    moves = keys.filter((k) => owner(k, before) !== owner(k, after));
  for (const [title, points] of [
    ["Before join", before],
    ["After D joins", after],
  ])
    r.step(
      "hash key; choose first clockwise virtual node",
      `${title}: adding D moves only keys whose clockwise owner becomes D. Virtual nodes provide more positions, not a guarantee of perfect balance.`,
      {
        columns: ["Key", "Hash point", "Owner before", "Owner now"],
        rows: keys.map((k) => [
          k,
          hash(k) % 1000,
          owner(k, before),
          owner(k, points),
        ]),
        ring: points,
        nodes: ["A", "B", "C", ...(points === after ? ["D"] : [])].map((name) =>
          node(
            `Server ${name}`,
            `${keys.filter((k) => owner(k, points) === name).length} keys`,
          ),
        ),
        metrics: {
          "Moved keys": points === after ? moves.length : 0,
          Total: count,
        },
      },
    );
  return r.finish({
    moves,
    owners: keys.map((k) => owner(k, after)),
    before,
    after,
  });
}
export function vector(p) {
  const scenario = choice(p.scenario, ["concurrent", "causal"], "scenario"),
    r = trace();
  let a = [0, 0],
    b = [0, 0];
  const emit = (code, message) =>
    r.step(code, message, {
      nodes: [node("Replica A", `[${a}]`), node("Replica B", `[${b}]`)],
    });
  a[0]++;
  emit("increment local clock on write", "A creates version [1,0].");
  if (scenario === "causal") {
    b = b.map((v, i) => Math.max(v, a[i]));
    b[1]++;
    emit(
      "receive: elementwise max, then increment local component",
      "B has observed A and then writes [1,1].",
    );
  } else {
    b[1]++;
    emit(
      "independent local write increments its own component",
      "B independently creates [0,1] without seeing A.",
    );
  }
  const dominates = (x, y) =>
      x.every((v, i) => v >= y[i]) && x.some((v, i) => v > y[i]),
    concurrent =
      !dominates(a, b) && !dominates(b, a) && a.some((v, i) => v !== b[i]);
  r.step(
    "compare componentwise; keep concurrent siblings",
    concurrent
      ? "Neither vector dominates: both versions must be reconciled by the application."
      : "B dominates A: B causally includes A.",
    {
      nodes: [node("A", `[${a}]`), node("B", `[${b}]`)],
      metrics: {
        Concurrent: String(concurrent),
        Relation: concurrent ? "siblings" : "B after A",
      },
    },
  );
  return r.finish({ a, b, concurrent });
}
export function bloom(p) {
  if (!Array.isArray(p.items) || !p.items.length || p.items.length > 8)
    throw new Error("Use 1–8 items.");
  const items = p.items.map((s) => text(s, 16, "item")),
    query = text(p.query, 16, "query"),
    m = bounded(p.bits, 4, 32, "bits"),
    k = bounded(p.hashes, 1, 4, "hashes"),
    bits = Array(m).fill(0),
    r = trace();
  const indices = (s) =>
    Array.from({ length: k }, (_, i) => hash(`${i}:${s}`) % m);
  const visual = () => ({
    cells: bits.map((v, i) => ({ label: i, value: v, active: !!v })),
    metrics: { Bits: m, Hashes: k },
  });
  for (const item of items) {
    const positions = indices(item);
    positions.forEach((i) => (bits[i] = 1));
    r.step(
      "set all k hashed positions",
      `Insert ${item}: set bits ${positions.join(", ")}. Bits are shared across items.`,
      visual(),
    );
  }
  const positions = indices(query),
    maybe = positions.every((i) => bits[i] === 1),
    actual = items.includes(query);
  r.step(
    "if any queried bit is 0, definitely absent",
    `Query ${query}: ${positions.join(", ")} → ${maybe ? "possibly present" : "definitely absent"}. ${maybe && !actual ? "This is an actual false positive in the demo set." : ""}`,
    {
      ...visual,
      columns: ["Query", "Filter answer", "Ground truth"],
      rows: [
        [query, maybe ? "maybe" : "absent", actual ? "present" : "absent"],
      ],
      metrics: {
        "Approximate false-positive rate": (
          (1 - Math.exp((-k * new Set(items).size) / m)) **
          k
        ).toFixed(3),
      },
    },
  );
  return r.finish({ bits, maybe, actual });
}
export const distributedModels = {
  "dist-raft": raft,
  "dist-election": election,
  "dist-quorum": quorum,
  "dist-ring": ring,
  "dist-vector": vector,
  "dist-bloom": bloom,
};
