import { trace, node, bars, bounded, choice } from "./trace.js";
export function partitions(p) {
  if (
    !Array.isArray(p.keys) ||
    !p.keys.length ||
    p.keys.length > 12 ||
    p.keys.some((k) => typeof k !== "string" || !k.length || k.length > 12)
  )
    throw new Error(
      "Use 1–12 nonempty string keys, at most 12 characters each.",
    );
  const count = bounded(p.partitions, 1, 4, "partitions"),
    logs = Array.from({ length: count }, () => []),
    r = trace();
  for (const [i, key] of p.keys.entries()) {
    const hash = [...key].reduce((s, c) => s + c.charCodeAt(0), 0),
      partition = hash % count;
    logs[partition].push({ key, id: i });
    r.step(
      "partition=teachingHash(key)%count; append at next offset",
      `Message ${i}, key ${key}, appends to partition ${partition} at offset ${logs[partition].length - 1}. Ordering is per partition, not a total order across this topic.`,
      {
        nodes: logs.map((l, j) =>
          node(
            `Partition ${j}`,
            l.map((m) => m.key).join(" → ") || "empty",
            j === partition ? "active" : "",
          ),
        ),
        columns: ["Partition", "Offset", "Message", "Key"],
        rows: logs.flatMap((l, j) => l.map((m, o) => [j, o, m.id, m.key])),
      },
    );
  }
  return r.finish({ logs });
}
export function groups(p) {
  const partitions = bounded(p.partitions, 1, 6, "partitions"),
    consumers = bounded(p.consumers, 1, 4, "consumers"),
    failure = choice(p.failure, ["none", "consumer-0"], "failure"),
    r = trace(),
    owners = Array.from({ length: partitions }, (_, i) => i % consumers);
  const show = (active, label) => ({
    nodes: Array.from({ length: consumers }, (_, i) =>
      node(
        `Consumer ${i}`,
        active.includes(i)
          ? owners
              .map((o, j) => (o === i ? `P${j}` : null))
              .filter(Boolean)
              .join(", ") || "idle"
          : "offline",
        active.includes(i) ? "" : "active",
      ),
    ),
    columns: ["Partition", "Group A owner", "Group B owner"],
    rows: owners.map((o, i) => [
      `P${i}`,
      o < 0 ? "unassigned" : `C${o}`,
      "Independent consumer B",
    ]),
    metrics: { Phase: label },
  });
  r.step(
    "assign each partition to one consumer within this group",
    "This is a simplified classic consumer-group assignment. A separate group has independent ownership and offsets; extra consumers can be idle.",
    show(
      Array.from({ length: consumers }, (_, i) => i),
      "assigned",
    ),
  );
  if (failure !== "none") {
    const live = Array.from({ length: consumers - 1 }, (_, i) => i + 1);
    owners.forEach((o, i) => {
      if (o === 0) owners[i] = -1;
    });
    r.step(
      "detect failure; revoke affected ownership",
      "Consumer 0 is offline. Unassigned partitions pause until reassignment.",
      show(live, "failure detected"),
    );
    owners.forEach(
      (_, i) => (owners[i] = live.length ? live[i % live.length] : -1),
    );
    r.step(
      "rebalance among remaining members; resume from committed offsets",
      live.length
        ? "The group assigns partitions to surviving members. Previously processed but uncommitted records may replay."
        : "No consumer remains; processing stops and lag grows.",
      show(live, "rebalanced"),
    );
  }
  return r.finish({ owners });
}
export function delivery(p) {
  const commit = choice(p.commit, ["before-effect", "after-effect"], "commit"),
    dedupe = choice(p.dedupe, ["off", "on"], "dedupe"),
    r = trace();
  let offset = 0,
    effects = 0;
  const seen = new Set(),
    rows = [];
  const snapshot = () => ({
    nodes: [
      node("Committed next offset", offset),
      node("Business effects", effects),
      node("Deduplication record", seen.size ? "event-0" : "none"),
    ],
    columns: ["Attempt", "Action"],
    rows,
    metrics: { Effects: effects },
  });
  if (commit === "before-effect") {
    offset = 1;
    rows.push([1, "Commit next offset 1"]);
    r.step(
      "commit offset before processing",
      "Commit first, then crash before the effect. Recovery starts at offset 1 and skips event 0.",
      snapshot(),
    );
    r.step(
      "restart from committed next offset",
      "No business effect occurred: this crash window loses the work.",
      snapshot(),
    );
  } else {
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (dedupe === "off" || !seen.has("event-0")) {
        effects++;
        if (dedupe === "on") seen.add("event-0");
        rows.push([attempt, "Apply effect"]);
      } else rows.push([attempt, "Skip duplicate effect"]);
      r.step(
        "apply effect; atomically record processed event ID if enabled",
        attempt === 1
          ? "The effect completes, but the consumer crashes before committing its offset."
          : "Recovery replays event 0 from committed offset 0.",
        snapshot(),
      );
      if (attempt === 2) offset = 1;
    }
    r.step(
      "commit next offset only after processing",
      "The second attempt commits offset 1. Deduplication assumes the marker and effect share one atomic transaction.",
      snapshot(),
    );
  }
  return r.finish({
    offset,
    effects,
    lost: effects === 0,
    duplicated: effects > 1,
  });
}
export function pressure(p) {
  const arrival = bounded(p.arrival, 1, 12, "arrival"),
    rate = bounded(p.rate, 1, 12, "rate"),
    capacity = bounded(p.capacity, 1, 30, "capacity"),
    ticks = bounded(p.ticks, 1, 12, "ticks"),
    policy = choice(p.policy, ["unbounded", "bounded"], "policy"),
    r = trace(),
    history = [];
  let queue = 0,
    processed = 0,
    rejected = 0;
  for (let t = 1; t <= ticks; t++) {
    const admitted =
      policy === "bounded"
        ? Math.min(arrival, Math.max(0, capacity - queue))
        : arrival;
    rejected += arrival - admitted;
    queue += admitted;
    const done = Math.min(rate, queue);
    queue -= done;
    processed += done;
    history.push([t, admitted, done, queue, rejected]);
    r.step(
      "admit arrivals; process service capacity; carry remaining backlog",
      `Tick ${t}: admit ${admitted}, process ${done}, retain ${queue}. Rejected arrivals require an explicit retry or failure policy.`,
      {
        columns: [
          "Tick",
          "Admitted",
          "Processed",
          "Queue",
          "Cumulative rejected",
        ],
        rows: history,
        bars: bars(
          [queue, processed, rejected],
          ["Queued", "Processed", "Rejected"],
        ),
      },
    );
  }
  return r.finish({ queue, processed, rejected, history });
}
export function traces(p) {
  const database = bounded(p.database, 10, 500, "database"),
    remote = bounded(p.remote, 10, 500, "remote"),
    context = choice(p.context, ["propagate", "break"], "context"),
    r = trace(),
    total = 20 + Math.max(database, remote) + 10,
    spans = [
      {
        name: "HTTP request",
        start: 0,
        duration: total,
        parent: "none",
        trace: "T1",
      },
      {
        name: "Handler setup",
        start: 0,
        duration: 20,
        parent: "HTTP request",
        trace: "T1",
      },
      {
        name: "Database",
        start: 20,
        duration: database,
        parent: "HTTP request",
        trace: "T1",
      },
      {
        name: "Remote service",
        start: 20,
        duration: remote,
        parent: context === "break" ? "unknown" : "HTTP request",
        trace: context === "break" ? "T2" : "T1",
      },
      {
        name: "Serialize response",
        start: 20 + Math.max(database, remote),
        duration: 10,
        parent: "HTTP request",
        trace: "T1",
      },
    ];
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    r.step(
      "record span with trace ID, parent, start and duration",
      `${s.name} runs from ${s.start} to ${s.start + s.duration} ms. ${s.name === "Remote service" && context === "break" ? "The missing context starts a separate trace, obscuring the relationship." : "Trace context relates this work to its parent."}`,
      {
        waterfall: spans.slice(0, i + 1),
        columns: ["Span", "Trace ID", "Parent", "Log event"],
        rows: spans
          .slice(0, i + 1)
          .map((s) => [s.name, s.trace, s.parent, `${s.name} completed`]),
        metrics: { "Request duration (ms)": total },
      },
    );
  }
  r.step(
    "critical path includes the slower parallel branch",
    "Database and remote calls run in parallel here. Adding all span durations would double-count overlapping work.",
    {
      waterfall: spans,
      metrics: {
        "Request duration (ms)": total,
        "Slower branch": database >= remote ? "Database" : "Remote service",
      },
    },
  );
  return r.finish({ total, spans });
}
export function latency(p) {
  if (
    !Array.isArray(p.samples) ||
    !p.samples.length ||
    p.samples.length > 30 ||
    p.samples.some((v) => !Number.isInteger(v) || v < 1 || v > 2000)
  )
    throw new Error("Use 1–30 integer latency samples from 1 to 2000 ms.");
  const threshold = bounded(p.threshold, 1, 2000, "threshold"),
    sorted = [...p.samples].sort((a, b) => a - b),
    r = trace(),
    percentile = (q) => sorted[Math.ceil(q * sorted.length) - 1],
    mean = sorted.reduce((a, b) => a + b, 0) / sorted.length,
    slow = sorted.filter((v) => v > threshold).length;
  r.step(
    "sort samples; rank=ceil(percentile*n)",
    `Use the nearest-rank convention. Small samples make high percentiles coarse; these samples do not estimate production reliability.`,
    {
      bars: bars(
        p.samples,
        p.samples.map((_, i) => `Request ${i}`),
      ),
    },
  );
  r.step(
    "read p50, p95, p99; compare average and slow count",
    `${slow} of ${sorted.length} requests exceed ${threshold} ms. Tail latency can change sharply while the average moves only a little.`,
    {
      bars: bars(
        [mean, percentile(0.5), percentile(0.95), percentile(0.99)],
        ["Mean", "p50", "p95", "p99"],
      ),
      columns: ["Rank", "Latency (ms)"],
      rows: sorted.map((v, i) => [i + 1, v]),
      metrics: { "Slow requests": slow, "Total requests": sorted.length },
    },
  );
  return r.finish({
    mean,
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99),
    slow,
  });
}
export function slo(p) {
  const requests = bounded(p.requests, 100, 100000, "requests"),
    failures = bounded(p.failures, 0, requests, "failures"),
    target = Number(p.target);
  if (![99, 99.9, 99.99].includes(target))
    throw new Error("Choose target 99, 99.9 or 99.99.");
  const allowance = (requests * (10000 - Math.round(target * 100))) / 10000,
    remaining = allowance - failures,
    burn = failures / allowance,
    r = trace();
  r.step(
    "SLI=good/total; allowed_bad=total*(1-target)",
    `This is a request-based availability SLO for one fixed window. ${requests - failures} of ${requests} eligible requests succeeded.`,
    {
      bars: bars(
        [requests - failures, failures],
        ["Good requests", "Bad requests"],
      ),
      metrics: {
        "Observed success %": (
          ((requests - failures) / requests) *
          100
        ).toFixed(3),
        "Target %": target,
      },
    },
  );
  r.step(
    "remaining=allowed_bad-observed_bad; burn=observed_bad/allowed_bad",
    "A negative remaining budget means this window exceeds its error allowance. This ratio compares the same window; it is not a multi-window alert or a prediction of future traffic.",
    {
      bars: bars(
        [allowance, failures, remaining],
        ["Allowed bad", "Observed bad", "Remaining budget"],
      ),
      metrics: {
        "Budget consumption ×": burn.toFixed(2),
        "Within budget": String(remaining >= -1e-8),
      },
    },
  );
  return r.finish({ allowance, remaining, burn, met: remaining >= -1e-8 });
}
export const productionModels = {
  "msg-partitions": partitions,
  "msg-groups": groups,
  "msg-delivery": delivery,
  "msg-pressure": pressure,
  "obs-traces": traces,
  "obs-latency": latency,
  "obs-slo": slo,
};
