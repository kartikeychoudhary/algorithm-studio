import { trace, node } from "../simulations/trace.js";
export function recoveryTrace(id, choice) {
  const r = trace();
  if (id === "incident-lag") {
    let lag = 30;
    const capacity = choice === "catchup" ? 16 : 12;
    r.step(
      "measure backlog before mitigation",
      "Start with 30 pending records and 12 arrivals per tick.",
      {
        nodes: [
          node("Producer", "12 / tick"),
          node("Topic", `${lag} pending`),
          node("Consumers", `${capacity} / tick`),
        ],
        links: [
          [0, 1],
          [1, 2],
        ],
        metrics: { Lag: lag },
      },
    );
    for (let tick = 1; tick <= 8; tick++) {
      const done = Math.min(lag + 12, capacity);
      lag = lag + 12 - done;
      r.step(
        "lag = max(0, lag + arrivals - service)",
        `Tick ${tick}: process ${done}; ${lag} remain.`,
        {
          nodes: [
            node("Producer", "12 / tick"),
            node("Topic", `${lag} pending`, "active"),
            node("Consumers", `${capacity} / tick`),
          ],
          links: [
            [0, 1],
            [1, 2],
          ],
          metrics: { Tick: tick, Lag: lag },
        },
      );
    }
    return r.finish({ value: lag });
  }
  if (id === "incident-cache") {
    const queries =
      choice === "singleflight" ? 1 : choice === "retry" ? 40 : 20;
    r.step(
      "observe simultaneous cache misses",
      "Twenty requests miss before the same key is refreshed.",
      {
        nodes: [
          node("Requests", 20),
          node("Cache", "expired"),
          node("Origin limit", 4),
        ],
        links: [
          [0, 1],
          [1, 2],
        ],
      },
    );
    r.step(
      "coordinate a refresh, or send independent requests",
      choice === "singleflight"
        ? "One owner refreshes; nineteen requests wait for its result."
        : "Independent refreshes still exceed origin concurrency. A future TTL change does not coalesce this burst.",
      {
        nodes: [
          node("Waiting requests", choice === "singleflight" ? 19 : 0),
          node("Refresh queries", queries, "active"),
          node("Origin limit", 4),
        ],
        links: [
          [0, 1],
          [1, 2],
        ],
        metrics: { "Refresh queries": queries },
      },
    );
    r.step(
      "verify origin request count and response fan-out",
      choice === "singleflight"
        ? "Publish the refreshed value to all waiting requests."
        : "The original cause remains; inspect concurrency rather than only expiration time.",
      {
        nodes: [
          node(
            "Cache",
            choice === "singleflight"
              ? "refreshed once"
              : "still under pressure",
          ),
          node("Origin queries", queries),
        ],
        links: [[1, 0]],
      },
    );
    return r.finish({ value: queries });
  }
  if (id === "incident-pool") {
    const size = choice === "reserve" ? 3 : 2;
    r.step(
      "outer transactions retain connections",
      "Both outer calls hold a connection while requesting an independent transaction.",
      {
        nodes: [
          node("Outer A", "holds C1"),
          node("Outer B", "holds C2"),
          node("Free connections", size - 2),
        ],
        links: [
          [0, 2],
          [1, 2],
        ],
      },
    );
    if (size === 3) {
      for (const owner of ["A", "B"])
        r.step(
          "grant spare connection; finish inner; return connection",
          `Inner ${owner} uses C3 and returns it; outer ${owner} can finish.`,
          {
            nodes: [
              node(`Inner ${owner}`, "C3 → released", "active"),
              node(`Outer ${owner}`, "completed"),
              node("Pool", 3),
            ],
            links: [
              [2, 0],
              [0, 1],
            ],
          },
        );
    } else
      r.step(
        "waiting without capacity does not create progress",
        "Both inner calls remain blocked. A retry or longer wait does not create a free connection.",
        {
          nodes: [
            node("Outer A", "waiting with C1"),
            node("Outer B", "waiting with C2"),
            node("Free connections", 0),
          ],
          links: [
            [0, 2],
            [1, 2],
          ],
        },
      );
    return r.finish({ value: size === 3 ? 2 : 0 });
  }
  const effects = choice === "new" ? 2 : 1;
  r.step(
    "provider commits effect; response is lost",
    "The first charge exists even though the caller received no response.",
    {
      nodes: [
        node("Order", 1),
        node("Provider charge", 1),
        node("Response", "lost"),
      ],
      links: [
        [0, 1],
        [1, 2],
      ],
    },
  );
  r.step(
    "recover using stable operation identity",
    choice === "stable"
      ? "The same key retrieves the stored result without another charge."
      : choice === "new"
        ? "A fresh key represents another operation and creates a second charge."
        : "No retry is sent, but the caller has not reconciled the outcome.",
    {
      nodes: [
        node("Retry", choice),
        node("Charge effects", effects, "active"),
        node("Outcome known", String(choice !== "stop")),
      ],
      links: [
        [0, 1],
        [1, 2],
      ],
    },
  );
  return r.finish({ value: effects });
}
