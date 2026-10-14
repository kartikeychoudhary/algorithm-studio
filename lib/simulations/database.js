import { trace, node, bars, bounded, numbers, choice, flow } from "./trace.js";
export function bplus(p) {
  const values = [...new Set(numbers(p.values, { count: 16 }))],
    target = bounded(p.target, 0, 99, "target"),
    r = trace();
  let nextId = 0;
  const make = (leaf) => ({ id: nextId++, leaf, keys: [], children: [] });
  let root = make(true);
  const first = (n) => (n.leaf ? n.keys[0] : first(n.children[0]));
  const refresh = (n) => {
    if (!n.leaf) n.keys = n.children.slice(1).map(first);
  };
  const insert = (n, v) => {
    if (n.leaf) (n.keys.push(v), n.keys.sort((a, b) => a - b));
    else {
      let i = n.keys.findIndex((k) => v < k);
      if (i < 0) i = n.children.length - 1;
      const split = insert(n.children[i], v);
      if (split) n.children.splice(i + 1, 0, split);
      refresh(n);
    }
    if (n.leaf && n.keys.length > 3) {
      const right = make(true);
      right.keys = n.keys.splice(2);
      return right;
    }
    if (!n.leaf && n.children.length > 4) {
      const right = make(false);
      right.children = n.children.splice(2);
      refresh(n);
      refresh(right);
      return right;
    }
    return null;
  };
  const visual = (active) => {
    const all = [],
      edges = [];
    const visit = (n) => {
      const i = all.length;
      all.push(
        node(
          `${n.leaf ? "Leaf" : "Branch"} ${n.id}`,
          n.keys.join(" | ") || "empty",
          n.id === active ? "active" : "",
        ),
      );
      for (const c of n.children) {
        const j = all.length;
        visit(c);
        edges.push([i, j]);
      }
    };
    visit(root);
    return { nodes: all, links: edges, layout: "tree" };
  };
  for (const v of values) {
    const split = insert(root, v);
    if (split) {
      const old = root;
      root = make(false);
      root.children = [old, split];
      refresh(root);
    }
    r.step(
      "insert_sorted(); split_overflow(); copy_separator_up()",
      `Insert ${v}. Leaves hold at most three keys; branch separators are the smallest keys in their right children.`,
      visual(),
    );
  }
  let cursor = root,
    reads = 0;
  while (!cursor.leaf) {
    reads++;
    r.step(
      "follow child containing target range",
      `Read branch ${cursor.id}; route ${target} using separators.`,
      { ...visual(cursor.id), metrics: { "Pages read": reads } },
    );
    let i = cursor.keys.findIndex((k) => target < k);
    if (i < 0) i = cursor.children.length - 1;
    cursor = cursor.children[i];
  }
  reads++;
  const found = cursor.keys.includes(target);
  r.step(
    "search leaf for target",
    `${target} is ${found ? "present" : "absent"} in leaf ${cursor.id}.`,
    {
      ...visual(cursor.id),
      metrics: { "Pages read": reads, Found: String(found) },
    },
  );
  return r.finish({ found, reads, root, sorted: values.sort((a, b) => a - b) });
}
export function indexes(p) {
  const tenant = bounded(p.tenant, 1, 3, "tenant"),
    min = bounded(p.minScore, 0, 9, "minScore"),
    mode = choice(p.order, ["tenant-score", "score-tenant", "scan"], "order");
  const data = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    tenant: (i % 3) + 1,
    score: Math.floor(i / 3) * 2,
  }));
  const ordered = [...data].sort((a, b) =>
    mode === "tenant-score"
      ? a.tenant - b.tenant || a.score - b.score
      : a.score - b.score || a.tenant - b.tenant,
  );
  const examined =
    mode === "scan"
      ? data
      : ordered.filter((row) =>
          mode === "tenant-score"
            ? row.tenant === tenant && row.score >= min
            : row.score >= min,
        );
  const r = trace(),
    result = [];
  let n = 0;
  r.step(
    "seek leading equality, then range; otherwise scan",
    `Query: tenant = ${tenant} AND score >= ${min}. Index order: ${mode}. This lab models a contiguous range scan, excluding skip-scan and optimizer shortcuts.`,
    {
      columns: ["ID", "Tenant", "Score"],
      rows: ordered.map((x) => Object.values(x)),
      metrics: { "Table rows": data.length },
    },
  );
  for (const row of examined) {
    n++;
    if (row.tenant === tenant && row.score >= min) result.push(row.id);
    r.step(
      "inspect candidate; apply remaining predicate",
      `Inspect row ${row.id}: ${row.tenant === tenant && row.score >= min ? "match" : "discard after filter"}.`,
      {
        nodes: [
          node("Predicate", `tenant ${tenant}, score ≥ ${min}`),
          node("Current row", `${row.tenant}, ${row.score}`, "active"),
          node("Results", result.join(", ") || "none"),
        ],
        metrics: { "Candidates examined": n, Matches: result.length },
        bars: bars([n, data.length], ["This plan", "Full scan"]),
      },
    );
  }
  return r.finish({ result: result.sort((a, b) => a - b), examined: n });
}
export function joins(p) {
  const size = bounded(p.size, 2, 10, "size"),
    method = choice(p.method, ["nested", "hash"], "method"),
    r = trace(),
    customers = Array.from({ length: size }, (_, i) => i + 1),
    orders = Array.from({ length: size + 2 }, (_, i) => ({
      id: i + 1,
      customer: (i % size) + 1,
    }));
  let work = 0;
  const result = [],
    map = new Map();
  if (method === "hash")
    for (const id of customers) {
      map.set(id, `Customer ${id}`);
      work++;
      r.step(
        "build hash table on customer.id",
        `Insert customer ${id} into the build-side hash table.`,
        {
          nodes: customers.map((k) =>
            node(
              `Key ${k}`,
              map.has(k) ? "built" : "pending",
              k === id ? "active" : "",
            ),
          ),
          metrics: { Operations: work },
        },
      );
    }
  for (const order of orders) {
    if (method === "nested") {
      for (const id of customers) {
        work++;
        if (id === order.customer) result.push([order.id, id]);
        r.step(
          "for each order, compare each customer key",
          `Compare order ${order.id} with customer ${id}.`,
          {
            columns: ["Order", "Customer"],
            rows: result,
            metrics: { Comparisons: work, Matches: result.length },
          },
        );
      }
    } else {
      work++;
      if (map.has(order.customer)) result.push([order.id, order.customer]);
      r.step(
        "probe hash table with order.customer_id",
        `Probe order ${order.id}; match customer ${order.customer}.`,
        {
          columns: ["Order", "Customer"],
          rows: result,
          metrics: { "Build + probe operations": work, Matches: result.length },
        },
      );
    }
  }
  return r.finish({ result, work });
}
export function plan(p) {
  const rows = bounded(p.rows, 100, 10000, "rows"),
    matches = bounded(p.matches, 1, rows, "matches"),
    indexed = choice(p.index, ["available", "missing"], "index"),
    r = trace();
  const pages = Math.ceil(rows / 50),
    heapPages = Math.min(matches, pages),
    scanCost = pages + rows * 0.01,
    indexCost = 3 + heapPages * 4 + matches * 0.02,
    use = indexed === "available" && indexCost < scanCost;
  const visual = {
    nodes: [
      node("Scan", use ? "Index scan" : "Sequential scan", "active"),
      node("Filter", `${matches} selected rows`),
      node("Aggregate", "COUNT(*)"),
    ],
    links: [
      [0, 1],
      [1, 2],
    ],
    bars: bars([scanCost, indexCost], ["Sequential cost", "Index cost"]),
    metrics: {
      "Estimated heap pages": heapPages,
      "Chosen cost": (use ? indexCost : scanCost).toFixed(2),
    },
  };
  r.step(
    "estimate cardinality and candidate plan costs",
    "Toy cost model: sequential = pages + rows × 0.01; index = 3 + touched pages × 4 + matches × 0.02. Costs are not milliseconds.",
    visual,
  );
  r.step(
    "choose lowest-cost available plan",
    indexed === "missing"
      ? "An unavailable index cannot be chosen."
      : use
        ? "Selective query: index navigation avoids most rows."
        : "Low selectivity: many random heap reads make a sequential scan cheaper.",
    visual,
  );
  r.step(
    "scan → filter → aggregate",
    `Return COUNT = ${matches}. Real EXPLAIN estimates can differ from actual execution, especially with stale statistics.`,
    {
      ...visual,
      nodes: visual.nodes.map((n, i) => ({
        ...n,
        status: i === 2 ? "active" : "",
      })),
      rows: [["COUNT", matches]],
      columns: ["Output", "Value"],
    },
  );
  return r.finish({
    plan: use ? "index" : "scan",
    scanCost,
    indexCost,
    matches,
  });
}
export function mvcc(p) {
  const mode = choice(
    p.isolation,
    ["read-committed", "repeatable-read"],
    "isolation",
  );
  return flow(
    ["Transaction A", "Version store", "Transaction B"],
    [
      [
        0,
        1,
        "BEGIN; SELECT balance",
        "A starts with a snapshot that sees the committed balance 100.",
        "v1: 100",
      ],
      [
        2,
        1,
        "UPDATE balance = 70",
        "B creates a new row version; its uncommitted change is not visible to A.",
        "v1:100; v2:70 pending",
      ],
      [
        2,
        1,
        "COMMIT B",
        "B commits v2. Old versions can remain while active snapshots need them.",
        "v1:100; v2:70 committed",
      ],
      [
        0,
        1,
        "SELECT balance again",
        mode === "read-committed"
          ? "A new statement snapshot sees 70."
          : "A keeps its transaction snapshot and sees 100.",
        mode === "read-committed" ? "A reads v2:70" : "A reads v1:100",
      ],
      [
        0,
        1,
        "COMMIT A; cleanup eligible versions",
        "A releases its snapshot. Cleanup eligibility depends on all active snapshots; commits do not instantly erase old versions.",
        "old version eligible",
      ],
    ],
    { seen: mode === "read-committed" ? [100, 70] : [100, 100] },
  );
}
export function wal(p) {
  const crash = choice(p.crash, ["before-commit", "after-commit"], "crash");
  return flow(
    ["Client", "Buffer pages", "Durable WAL", "Recovery"],
    [
      [
        0,
        1,
        "BEGIN; UPDATE x = 2",
        "Modify a buffered page; the durable table page still contains 1.",
        "x=2 dirty",
      ],
      [
        1,
        2,
        "append WAL; flush WAL before page flush",
        "The log record can reach durable storage before the data page. This ordering enables redo.",
        "UPDATE x=2 durable",
      ],
      ...(crash === "after-commit"
        ? [
            [
              0,
              2,
              "flush COMMIT record; acknowledge",
              "With synchronous durability assumed, acknowledge only after the commit record is durable.",
              "COMMIT durable",
            ],
          ]
        : []),
      [
        1,
        3,
        "CRASH; discard volatile buffers",
        "A process crash loses dirty buffers; durable log and data pages survive.",
        "replay starts",
      ],
      [
        2,
        3,
        "redo; apply transaction visibility",
        crash === "after-commit"
          ? "Redo reconstructs x=2 and the committed transaction is visible."
          : "The uncommitted transaction remains invisible. Redo may restore physical changes without making them committed.",
        crash === "after-commit" ? "visible x=2" : "visible x=1",
      ],
    ],
    { visible: crash === "after-commit" ? 2 : 1 },
  );
}
export const databaseModels = {
  "db-bplus": bplus,
  "db-composite": indexes,
  "db-joins": joins,
  "db-plans": plan,
  "db-mvcc": mvcc,
  "db-wal": wal,
};
