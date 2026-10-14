import { trace, node, choice, text, flow } from "./trace.js";
export function gitGraph(p) {
  const mode = choice(p.action, ["branch", "detached"], "action"),
    r = trace(),
    commits = [
      { id: "A", parents: [] },
      { id: "B", parents: ["A"] },
    ];
  let main = "B",
    feature = "B",
    head = mode === "branch" ? "feature" : "B";
  const visual = () => ({
    nodes: commits.map((c) =>
      node(
        c.id,
        `${main === c.id ? "main " : ""}${feature === c.id ? "feature " : ""}${head === c.id ? "HEAD " : ""}` ||
          "snapshot",
      ),
    ),
    links: commits.flatMap((c, i) =>
      c.parents.map((parent) => [i, commits.findIndex((n) => n.id === parent)]),
    ),
    metrics: { HEAD: head, main, feature },
  });
  r.step(
    "checkout feature or detach HEAD at B",
    "Arrows point from a commit to its parent. Branches are movable references; HEAD normally names the current branch.",
    visual(),
  );
  commits.push({ id: "C", parents: ["B"] });
  if (mode === "branch") feature = "C";
  else head = "C";
  r.step(
    "commit snapshot with parent B",
    mode === "branch"
      ? "The current feature branch advances to C; main stays at B."
      : "Detached HEAD advances to C while both branch references stay at B.",
    visual(),
  );
  r.step(
    "inspect reachability before switching away",
    mode === "branch"
      ? "C remains reachable through feature."
      : "Create a branch if you want a durable name for C. Reflogs can offer temporary recovery after leaving detached HEAD.",
    visual(),
  );
  return r.finish({ main, feature, head, commits });
}
export function merge(p) {
  const scenario = choice(p.scenario, ["independent", "conflict"], "scenario"),
    resolution = choice(p.resolution, ["main", "feature"], "resolution"),
    base = { color: "blue", size: "small" },
    main = { ...base, color: "red" },
    feature =
      scenario === "conflict"
        ? { ...base, color: "green" }
        : { ...base, size: "large" },
    result = {},
    conflicts = [],
    r = trace();
  const nodes = [
    node("B · base", JSON.stringify(base)),
    node("C · main", JSON.stringify(main)),
    node("D · feature", JSON.stringify(feature)),
  ];
  r.step(
    "find merge base B; compare changes on both sides",
    "A three-way merge compares each side with the common ancestor, not only with the other side.",
    {
      nodes,
      links: [
        [1, 0],
        [2, 0],
      ],
    },
  );
  for (const key of Object.keys(base)) {
    if (main[key] === feature[key]) result[key] = main[key];
    else if (main[key] === base[key]) result[key] = feature[key];
    else if (feature[key] === base[key]) result[key] = main[key];
    else {
      conflicts.push(key);
      result[key] = "CONFLICT";
    }
    r.step(
      "merge unchanged sides; flag incompatible overlapping changes",
      `${key}: base=${base[key]}, main=${main[key]}, feature=${feature[key]} → ${result[key]}.`,
      {
        columns: ["Field", "Base", "Main", "Feature", "Merged"],
        rows: Object.keys(result).map((k) => [
          k,
          base[k],
          main[k],
          feature[k],
          result[k],
        ]),
      },
    );
  }
  for (const key of conflicts)
    result[key] = resolution === "main" ? main[key] : feature[key];
  r.step(
    "resolve conflicts; create merge commit with two parents",
    conflicts.length
      ? `Explicit resolution keeps ${resolution} for ${conflicts.join(", ")}. The merge commit records both histories.`
      : "Independent edits combine automatically. The merge commit records both parents.",
    {
      nodes: [...nodes, node("M · merge", JSON.stringify(result), "active")],
      links: [
        [1, 0],
        [2, 0],
        [3, 1],
        [3, 2],
      ],
    },
  );
  return r.finish({ result, conflicts, parents: ["C", "D"] });
}
export function rebase(p) {
  const conflict =
    choice(p.scenario, ["clean", "conflict"], "scenario") === "conflict";
  const r = trace();
  r.step(
    "find commits unique to feature: C, D",
    "Original history: main advanced to E while feature has C and D after B.",
    {
      nodes: ["B", "C", "D", "E"].map((x) =>
        node(x, x === "D" ? "feature" : x === "E" ? "main" : "commit"),
      ),
      links: [
        [1, 0],
        [2, 1],
        [3, 0],
      ],
    },
  );
  if (conflict)
    r.step(
      "pause applying C; resolve overlapping edit",
      "The replay conflicts with E. Resolve the file and stage that resolution before continuing; this model records an explicit manual resolution.",
      {
        nodes: [
          node("Patch C", "overlapping edit"),
          node("Base E", "different value"),
          node("Index", "resolved manually", "active"),
        ],
        links: [
          [0, 2],
          [1, 2],
        ],
      },
    );
  r.step(
    "replay C onto E → C′",
    "The same logical change now has a different parent, producing a new commit identity. IDs here are symbolic, not real hashes.",
    {
      nodes: ["B", "E", "C′"].map((x) =>
        node(x, x === "C′" ? "replayed" : "commit"),
      ),
      links: [
        [1, 0],
        [2, 1],
      ],
    },
  );
  r.step(
    "replay D → D′; move feature",
    "Feature ends at D′. Rebase rewrites these commit identities; it does not create a two-parent merge commit.",
    {
      nodes: ["B", "E", "C′", "D′"].map((x) =>
        node(x, x === "D′" ? "feature" : "commit"),
      ),
      links: [
        [1, 0],
        [2, 1],
        [3, 2],
      ],
    },
  );
  return r.finish({ parents: { "C′": "E", "D′": "C′" }, conflict });
}
export function dependencies(p) {
  const a = choice(p.a, ["1", "2"], "a"),
    b = choice(p.b, ["1", "2"], "b"),
    policy = choice(p.policy, ["single", "isolated"], "policy"),
    r = trace(),
    versions = ["1.0", "1.1", "2.0"],
    accepted = versions.filter(
      (v) => v.startsWith(a + ".") && v.startsWith(b + "."),
    );
  r.step(
    "collect transitive constraints",
    "A@1 needs C major 1; A@2 needs C major 2. B follows the same mapping. This is a bounded major-range resolver.",
    {
      nodes: [
        node("App", "A + B"),
        node("A", `v${a}; C^${a}`),
        node("B", `v${b}; C^${b}`),
        node("C candidates", versions.join(", ")),
      ],
      links: [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
    },
  );
  for (const v of versions)
    r.step(
      "intersect ranges for a shared package instance",
      `C@${v}: satisfies A=${v.startsWith(a + ".")}, B=${v.startsWith(b + ".")}.`,
      {
        columns: ["Candidate", "A accepts", "B accepts"],
        rows: versions.map((v) => [
          v,
          String(v.startsWith(a + ".")),
          String(v.startsWith(b + ".")),
        ]),
      },
    );
  const result = accepted.length
    ? [accepted.at(-1)]
    : policy === "isolated"
      ? [
          versions.filter((v) => v.startsWith(a + ".")).at(-1),
          versions.filter((v) => v.startsWith(b + ".")).at(-1),
        ]
      : [];
  r.step(
    "lock exact selected versions or report conflict",
    result.length
      ? `Resolved C instance(s): ${result.join(", ")}. Separate installs can satisfy incompatible ranges when package semantics allow isolation.`
      : "No single C version satisfies both constraints. Report a conflict instead of silently choosing an incompatible version.",
    {
      nodes: result.length
        ? result.map((v, i) => node(`C instance ${i}`, v, "active"))
        : [node("Resolution", "conflict", "error")],
      metrics: { Instances: result.length, Policy: policy },
    },
  );
  return r.finish({ result, conflict: !result.length });
}
export function compiler(p) {
  const expression = text(p.expression, 60, "expression"),
    optimize = choice(p.optimize, ["on", "off"], "optimize") === "on";
  if (/[^0-9+*()\s]/.test(expression))
    throw new Error("Use integers, +, *, and parentheses only.");
  const tokens = expression.match(/\d+|[+*()]/g) || [],
    output = [],
    operators = [],
    r = trace();
  let expectOperand = true;
  const prec = { "+": 1, "*": 2 };
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      if (!expectOperand || Number(t) > 99)
        throw new Error("Expected operator; numeric literals are 0–99.");
      output.push(Number(t));
      expectOperand = false;
    } else if (t === "(") {
      if (!expectOperand) throw new Error("Missing operator before (.");
      operators.push(t);
    } else if (t === ")") {
      if (expectOperand) throw new Error("Missing operand.");
      while (operators.length && operators.at(-1) !== "(")
        output.push(operators.pop());
      if (operators.pop() !== "(") throw new Error("Unmatched ).");
      expectOperand = false;
    } else {
      if (expectOperand) throw new Error("Missing operand.");
      while (operators.length && prec[operators.at(-1)] >= prec[t])
        output.push(operators.pop());
      operators.push(t);
      expectOperand = true;
    }
    r.step(
      "lex tokens; parse using operator precedence",
      `Read ${t}. Multiplication binds more tightly than addition; parentheses override precedence.`,
      {
        nodes: [
          node("Token", t, "active"),
          node("Operators", operators.join(" ") || "empty"),
          node("Postfix", output.join(" ") || "empty"),
        ],
        links: [
          [0, 1],
          [1, 2],
        ],
      },
    );
  }
  if (expectOperand) throw new Error("Expression ends before an operand.");
  while (operators.length) {
    const t = operators.pop();
    if (t === "(") throw new Error("Unmatched (.");
    output.push(t);
  }
  const stack = [];
  for (const t of output) {
    if (typeof t === "number") stack.push(t);
    else {
      const b = stack.pop(),
        a = stack.pop();
      stack.push(t === "+" ? a + b : a * b);
    }
    if (stack.some((v) => !Number.isSafeInteger(v)))
      throw new Error("Result exceeds safe integer range.");
    r.step(
      typeof t === "number" ? `PUSH ${t}` : t === "+" ? "ADD" : "MULTIPLY",
      `Execute a stack instruction: ${t}.`,
      {
        nodes: stack.map((v, i) =>
          node(`Stack ${i}`, v, i === stack.length - 1 ? "active" : ""),
        ),
        metrics: { "Stack depth": stack.length },
      },
    );
  }
  if (stack.length !== 1) throw new Error("Invalid expression.");
  const value = stack[0];
  r.step(
    optimize
      ? "constant fold entire expression → PUSH result"
      : "emit stack bytecode without folding",
    optimize
      ? `All operands are literals, so fold the expression into PUSH ${value}.`
      : `Keep ${output.length} instructions. A full compiler also handles types, names, control flow and target-specific code generation.`,
    {
      columns: ["Instruction"],
      rows: (optimize
        ? [`PUSH ${value}`]
        : output.map((t) =>
            typeof t === "number"
              ? `PUSH ${t}`
              : t === "+"
                ? "ADD"
                : "MULTIPLY",
          )
      ).map((x) => [x]),
      metrics: { Result: value, Instructions: optimize ? 1 : output.length },
    },
  );
  return r.finish({ value, instructions: optimize ? 1 : output.length });
}
export function cicd(p) {
  const failure = choice(p.failure, ["none", "test", "health"], "failure");
  return flow(
    ["Commit", "CI runner", "Artifact registry", "Production"],
    [
      [
        0,
        1,
        "checkout exact commit; install locked dependencies",
        "Build and test the reviewed revision with controlled dependency versions.",
        "source ready",
      ],
      [
        1,
        1,
        "run unit + integration checks",
        failure === "test"
          ? "A test fails. Stop the pipeline before publishing an artifact."
          : "Checks pass for this commit.",
        failure === "test" ? "failed" : "passed",
      ],
      ...(failure === "test"
        ? []
        : [
            [
              1,
              2,
              "build once; publish immutable artifact digest",
              "The artifact digest identifies exactly what was tested and deployed.",
              "sha256:demo",
            ],
            [
              2,
              3,
              "deploy candidate; run readiness / smoke checks",
              "Shift traffic only after the candidate passes the configured health checks.",
              "candidate running",
            ],
            [
              3,
              1,
              "report health",
              failure === "health"
                ? "Candidate health fails; stop rollout and restore the last known good artifact. Database rollback compatibility requires separate planning."
                : "Candidate health passes; complete the rollout.",
              failure === "health" ? "rollback required" : "healthy",
            ],
            [
              1,
              3,
              failure === "health"
                ? "restore previous artifact"
                : "promote candidate",
              failure === "health"
                ? "Service returns to the previous artifact; failed deployment remains recorded."
                : "Production now serves this commit’s artifact.",
              failure === "health" ? "previous version" : "new version",
            ],
          ]),
    ],
    { deployed: failure === "none", rollback: failure === "health" },
  );
}
export const toolingModels = {
  "tool-git": gitGraph,
  "tool-merge": merge,
  "tool-rebase": rebase,
  "tool-dependencies": dependencies,
  "tool-compiler": compiler,
  "tool-cicd": cicd,
};
