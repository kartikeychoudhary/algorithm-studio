import { trace, node, bounded, choice, flow } from "./trace.js";
export function orm(p) {
  const n = bounded(p.users, 2, 8, "users"),
    strategy = choice(
      p.strategy,
      ["lazy", "fetch-join", "batch", "closed"],
      "strategy",
    ),
    r = trace();
  let selects = 1,
    updates = 0;
  const loaded = [];
  r.step(
    strategy === "fetch-join"
      ? "SELECT users LEFT JOIN orders"
      : "SELECT users",
    "Load managed users into one persistence context. A fetch join can repeat parent columns for each child row; SQL row count and query count are different measures.",
    {
      nodes: [
        node("Database", `${n} users, 2 orders each`),
        node("Persistence context", `${n} managed users`),
        node(
          "Associations",
          strategy === "fetch-join" ? "initialized" : "lazy",
        ),
      ],
      links: [
        [0, 1],
        [1, 2],
      ],
      metrics: {
        "SELECT statements": selects,
        "Rows in initial result": strategy === "fetch-join" ? n * 2 : n,
      },
    },
  );
  r.step(
    "find same entity ID again",
    "Within the same persistence context, the managed instance is reused. This identity map is distinct from the optional second-level cache.",
    {
      nodes: [
        node("find(User,1)", "same identity"),
        node("Context", "User#1"),
        node("Database", "no additional SELECT"),
      ],
      links: [[0, 1]],
      metrics: { "SELECT statements": selects },
    },
  );
  if (strategy === "closed") {
    r.step(
      "close context; access uninitialized lazy collection",
      "With no open persistence context to initialize the collection, this modeled access fails. Fetch the data within the intended transaction boundary.",
      {
        nodes: [
          node("Context", "closed"),
          node("Lazy association", "LazyInitializationException", "error"),
        ],
        metrics: { "SELECT statements": selects },
      },
    );
    return r.finish({ selects, updates, error: true });
  }
  if (strategy === "batch") selects++;
  for (let i = 1; i <= n; i++) {
    if (strategy === "lazy") selects++;
    loaded.push(i);
    r.step(
      "access user.orders",
      `Read orders for User#${i}. ${strategy === "lazy" ? "One extra SELECT initializes this association." : strategy === "batch" ? "One batch SELECT supplied all associations in this example." : "The fetch join already supplied these rows."}`,
      {
        nodes: Array.from({ length: n }, (_, j) =>
          node(
            `User ${j + 1}`,
            loaded.includes(j + 1) ? "orders initialized" : "waiting",
            j + 1 === i ? "active" : "",
          ),
        ),
        metrics: {
          "SELECT statements": selects,
          "Initialized users": loaded.length,
        },
      },
    );
  }
  r.step(
    'managedUser.name = "Updated"',
    "Change the managed object. An explicit repository save is not required for dirty checking of this already managed entity.",
    {
      columns: ["Entity", "Loaded snapshot", "Current value"],
      rows: [["User#1", "Original", "Updated"]],
      metrics: { "SELECT statements": selects, "UPDATE statements": updates },
    },
  );
  updates++;
  r.step(
    "flush dirty changes; commit transaction",
    "Flush synchronizes the changed entity with SQL; flush and commit are distinct. Rollback could still prevent the transaction from committing.",
    {
      nodes: [
        node("Managed entity", "name=Updated"),
        node("Dirty checker", "changed"),
        node("Database", "UPDATE then COMMIT", "active"),
      ],
      links: [
        [0, 1],
        [1, 2],
      ],
      metrics: { "SELECT statements": selects, "UPDATE statements": updates },
    },
  );
  return r.finish({ selects, updates, error: false });
}
export function propagation(p) {
  const mode = choice(p.mode, ["REQUIRED", "REQUIRES_NEW"], "mode"),
    failure = choice(p.failure, ["none", "inner", "outer"], "failure"),
    pool = bounded(p.pool, 1, 3, "pool"),
    r = trace();
  let outer = "active",
    inner = mode === "REQUIRED" ? "joined outer" : "not started",
    used = 1,
    audit = false,
    order = false;
  const visual = () => ({
    nodes: [
      node("Outer service", outer),
      node("Inner audit", inner),
      node("Connections", `${used}/${pool}`),
    ],
    links: [
      [0, 1],
      [1, 2],
    ],
    metrics: {
      "Order committed": String(order),
      "Audit committed": String(audit),
    },
  });
  r.step(
    "outer proxy begins transaction on connection 1",
    "Assume calls cross Spring proxies, use a JDBC transaction manager, and the outer method catches the inner RuntimeException.",
    visual(),
  );
  if (mode === "REQUIRES_NEW") {
    outer = "suspended";
    if (pool < 2) {
      inner = "waiting for connection";
      r.step(
        "REQUIRES_NEW requests independent connection",
        "The outer transaction still holds its connection. With one connection, the inner call cannot proceed and eventually times out in a configured pool.",
        visual(),
      );
      return r.finish({ order: false, audit: false, exhausted: true });
    }
    used = 2;
    inner = "independent transaction";
  }
  r.step(
    mode === "REQUIRED"
      ? "join existing physical transaction"
      : "suspend outer; begin independent transaction",
    mode === "REQUIRED"
      ? "Both scopes share one physical transaction and one eventual outcome."
      : "The inner scope owns its own physical transaction and can commit or roll back independently.",
    visual(),
  );
  if (failure === "inner") {
    inner = "rolled back";
    if (mode === "REQUIRED") outer = "rollback-only";
  } else {
    inner = mode === "REQUIRED" ? "returns; commit deferred" : "committed";
    if (mode === "REQUIRES_NEW") audit = true;
  }
  if (mode === "REQUIRES_NEW") {
    used = 1;
    outer = "resumed";
  }
  r.step(
    failure === "inner"
      ? "inner RuntimeException; outer catches it"
      : "inner returns",
    failure === "inner" && mode === "REQUIRED"
      ? "Catching the exception does not clear rollback-only. The outer commit will fail with UnexpectedRollbackException."
      : mode === "REQUIRES_NEW"
        ? "Resume the outer transaction after releasing the inner connection."
        : "The shared transaction has not committed yet.",
    visual(),
  );
  order = failure !== "outer" && outer !== "rollback-only";
  if (mode === "REQUIRED") audit = order;
  outer = order ? "committed" : "rolled back";
  used = 0;
  r.step(
    "finish outer transaction",
    failure === "outer" && audit
      ? "The outer rollback does not undo the already committed independent audit."
      : order
        ? "The order is committed."
        : "The order is rolled back.",
    visual(),
  );
  return r.finish({ order, audit, exhausted: false });
}
export function springTesting(p) {
  const layer = choice(p.layer, ["unit", "mvc-slice", "integration"], "layer"),
    bug = choice(p.bug, ["none", "business", "validation", "sql"], "bug"),
    coverage =
      layer === "unit"
        ? ["business"]
        : layer === "mvc-slice"
          ? ["validation"]
          : ["business", "validation", "sql"],
    caught = coverage.includes(bug);
  return flow(
    ["Test", "MVC boundary", "Service", "Database"],
    [
      [
        0,
        layer === "unit" ? 2 : 1,
        layer === "unit"
          ? "new Service(mockRepository)"
          : "perform POST /orders with invalid or valid DTO",
        layer === "unit"
          ? "A focused unit test runs business code with a fake repository. It does not boot MVC or a database."
          : layer === "mvc-slice"
            ? "A configured MVC slice tests routing, conversion and validation through MockMvc while the service is mocked."
            : "An integration test uses the application context and an actual test database in the intended setup.",
        layer,
      ],
      [
        layer === "unit" ? 2 : 1,
        layer === "integration" ? 3 : 2,
        "exercise configured real components",
        `Injected fault: ${bug}. This lesson models test boundaries; it does not launch Java or execute a real test runner.`,
        layer === "integration"
          ? "real database adapter"
          : layer === "mvc-slice"
            ? "mocked service"
            : "mocked repository",
      ],
      [
        layer === "integration" ? 3 : 2,
        0,
        "assert observable behavior",
        bug === "none"
          ? "The healthy scenario passes."
          : caught
            ? "This test crosses the faulty boundary and catches the injected defect."
            : "The fault is outside this test’s real components. The passing result cannot validate that boundary.",
        caught ? "FAIL: defect detected" : "PASS",
      ],
    ],
    { caught, passes: !caught, coverage },
  );
}
export const springModels = {
  "spring-orm": orm,
  "spring-propagation": propagation,
  "spring-testing": springTesting,
};
