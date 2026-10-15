export const incidentLessons = {
  "incident-cache": {
    label: "Incident · cache stampede",
    signal:
      "At 12:00 the cached product expires. Twenty requests for that same key arrive before any refresh finishes.",
    evidence: [
      ["Cache hit rate", "95% → 0%"],
      ["Concurrent misses for one key", "20"],
      ["Origin queries before recovery", "20"],
      ["Origin capacity for refreshes", "4 concurrent queries"],
    ],
    choices: [
      ["singleflight", "Coalesce concurrent refreshes for the same key"],
      ["retry", "Retry every failed query immediately"],
      ["ttl", "Increase the TTL for future writes only"],
    ],
    correct: "singleflight",
    why: "One request refreshes the key while the others wait for the same result. This prevents the concurrent misses from independently querying the origin.",
    boundary:
      "One key and one application instance. A production solution must define lock scope, timeouts, stale-data policy, and what happens if the refresh owner fails.",
    before: [20, 4],
    after: [1, 4],
    labels: ["Refresh queries", "Origin concurrency limit"],
    metric: "Origin refresh queries",
    baseline: 20,
    fixed: 1,
    wrong: { retry: 40, ttl: 20 },
    verify:
      "Check that only one origin refresh runs for the key and that waiting requests receive the result.",
    followup:
      "Decide whether stale data is acceptable and whether refresh coordination must span instances.",
    related: ["caching", "reliability"],
  },
  "incident-pool": {
    label: "Incident · exhausted connection pool",
    signal:
      "Two outer Spring transactions occupy both database connections. Each synchronously calls REQUIRES_NEW and waits for a second connection.",
    evidence: [
      ["Pool size", "2"],
      ["Outer transactions holding a connection", "2"],
      ["Inner transactions waiting", "2"],
      ["Database CPU", "Low"],
      ["Thread state", "Waiting for pool acquisition"],
    ],
    choices: [
      ["reserve", "Provide one spare connection for this bounded schedule"],
      ["retry", "Retry the same work immediately"],
      ["timeout", "Increase the wait timeout only"],
    ],
    correct: "reserve",
    why: "A third connection lets one inner transaction finish and release it; the other inner call can then run. Both outer transactions eventually complete.",
    boundary:
      "Exactly two synchronous outer calls, one inner call each, and fair progress. Three connections are sufficient for this schedule, not a general production sizing rule. Review transaction boundaries and concurrency limits as well.",
    before: [2, 2],
    after: [3, 2],
    labels: ["Pool connections", "Outer holders"],
    metric: "Transactions completed",
    baseline: 0,
    fixed: 2,
    wrong: { retry: 0, timeout: 0 },
    verify:
      "Confirm that inner work acquires a connection, releases it, and allows both outer transactions to finish.",
    followup:
      "Consider moving independent work outside the outer transaction; size pools against database limits.",
    related: ["spring-propagation", "jvm-pools"],
  },
  "incident-lag": {
    label: "Incident · growing consumer lag",
    signal:
      "A topic receives 12 records per tick across four evenly loaded partitions. Two consumers can each process three records per tick.",
    evidence: [
      ["Arrival rate", "12 records/tick"],
      ["Current processing rate", "6 records/tick"],
      ["Initial lag", "30 records"],
      ["Partition count", "4"],
      ["Per-consumer capacity", "3 records/tick"],
    ],
    choices: [
      ["catchup", "Use four consumers at four records/tick each"],
      ["equal", "Use four consumers at three records/tick each"],
      ["extra", "Use eight consumers at three records/tick each"],
    ],
    correct: "catchup",
    why: "A total service rate of 16 exceeds the arrival rate of 12, draining the 30-record backlog in eight ticks. Merely matching arrivals stops growth but does not drain existing lag.",
    boundary:
      "Classic partition ownership, even traffic, no skew or failures, and enough downstream capacity. At most four consumers are active for four partitions. The assumed per-consumer speedup must be measured before relying on it.",
    before: [12, 6],
    after: [12, 16],
    labels: ["Arrival rate", "Service rate"],
    metric: "Lag after eight ticks",
    baseline: 78,
    fixed: 0,
    wrong: { equal: 30, extra: 30 },
    verify:
      "Check both throughput and decreasing lag; a flat lag line is not catch-up.",
    followup:
      "Inspect partition skew and downstream capacity before increasing concurrency or batch sizes.",
    related: ["msg-groups", "msg-pressure"],
  },
  "incident-payment": {
    label: "Incident · duplicate payment",
    signal:
      "The provider accepts a charge, but the response is lost. A retry creates a second charge because it uses a new operation identity.",
    evidence: [
      ["Logical orders", "1"],
      ["Provider charge attempts", "2"],
      ["Successful charge effects", "2"],
      ["First response", "Timed out after acceptance"],
    ],
    choices: [
      [
        "stable",
        "Reuse one provider-supported idempotency key for this operation",
      ],
      ["new", "Generate a new key on each retry"],
      ["stop", "Stop retrying and leave the outcome unknown"],
    ],
    correct: "stable",
    why: "A retry with the same operation identity and matching request can recover the original outcome instead of creating a second charge.",
    boundary:
      "A simulated provider that atomically stores the key and result with its effect, within its retention window. This prevents a duplicate on recovery; it does not refund a duplicate charge that already happened.",
    before: [2, 1],
    after: [1, 1],
    labels: ["Charge effects on replay", "Logical orders"],
    metric: "Charge effects in recovered scenario",
    baseline: 2,
    fixed: 1,
    wrong: { new: 2, stop: 1 },
    verify:
      "Reconcile the operation key and provider result; verify one charge for the order, not merely an HTTP 200.",
    followup:
      "Reconcile any existing duplicate separately, and document retention, payload mismatch, and concurrent retry behavior.",
    related: ["idempotency", "checkout", "msg-delivery"],
  },
};
for (const [id, l] of Object.entries(incidentLessons))
  Object.assign(l, {
    id,
    title: l.label,
    kind: "incident",
    section: "Practice",
    topic: "Incident challenges",
    tag: "INCIDENT LAB · READ THE EVIDENCE",
    subtitle:
      "Investigate the signals, choose a mitigation, and verify the outcome.",
  });
export function incidentOutcome(id, choice) {
  const l = incidentLessons[id];
  if (!l || !l.choices.some(([c]) => c === choice))
    throw new Error("Choose one of the available mitigations.");
  const correct = choice === l.correct;
  return {
    correct,
    value: correct ? l.fixed : l.wrong[choice],
    bars: correct ? l.after : l.before,
  };
}
