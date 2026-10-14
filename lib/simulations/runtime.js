import { trace, node, bars, bounded, numbers, choice, flow } from "./trace.js";
export function classLoading(p) {
  const missing =
    choice(p.dependency, ["present", "missing"], "dependency") === "missing";
  return flow(
    ["Application", "Class loader", "Verifier / linker", "Initializer"],
    [
      [
        0,
        1,
        "load OrderService",
        "Resolve a symbolic class name through the configured loader hierarchy. Loading does not by itself run static initialization.",
        "class bytes",
      ],
      [
        1,
        2,
        "verify bytecode; prepare static fields",
        "Check class-file constraints and allocate static storage with default values. Resolution can be lazy.",
        "verified; defaults set",
      ],
      ...(missing
        ? [
            [
              2,
              0,
              "resolve dependency → linkage failure",
              "The required class cannot be resolved. Initialization and the application call do not complete.",
              "NoClassDefFoundError",
            ],
          ]
        : [
            [
              2,
              3,
              "initialize superclass, then <clinit>",
              "On first active use, initialize required superclasses and execute this class’s static initialization once.",
              "static fields initialized",
            ],
            [
              3,
              0,
              "invoke application method",
              "The initialized class can now serve the method call. Classes with the same binary name but different defining loaders can be different types.",
              "method executes",
            ],
          ]),
    ],
    { loaded: !missing },
  );
}
export function frames(p) {
  const depth = bounded(p.depth, 1, 6, "depth"),
    r = trace(),
    stack = [];
  let value = 0;
  for (let n = depth; n >= 1; n--) {
    stack.push({ n, object: "O1" });
    r.step(
      "push frame sum(n); call sum(n−1)",
      `Push a frame for n=${n}. Each call owns locals and an operand stack; the copied reference still points to heap object O1.`,
      {
        nodes: stack.map((f, i) =>
          node(
            `Frame ${i}`,
            `n=${f.n}; ref→O1`,
            i === stack.length - 1 ? "active" : "",
          ),
        ),
        columns: ["Heap object", "Value"],
        rows: [["O1", "shared object"]],
        metrics: { "Stack frames": stack.length },
      },
    );
  }
  while (stack.length) {
    const f = stack.pop();
    value += f.n;
    r.step(
      "return n + child_result; pop frame",
      `Return ${value}; the caller resumes. Returning a frame does not necessarily free heap objects.`,
      {
        nodes: stack.map((f, i) => node(`Frame ${i}`, `n=${f.n}; ref→O1`)),
        metrics: { Return: value, "Stack frames": stack.length },
      },
    );
  }
  return r.finish({ value, frames: depth });
}
export function gc(p) {
  const retain = choice(p.root, ["keep", "drop"], "root") === "keep",
    r = trace(),
    edges = [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 3],
    ],
    roots = retain ? [0] : [],
    marked = new Set(),
    queue = [...roots];
  const visual = () => ({
    nodes: Array.from({ length: 5 }, (_, i) =>
      node(
        `Object ${i}`,
        marked.has(i) ? "reachable" : "not marked",
        marked.has(i) ? "active" : "",
      ),
    ),
    links: edges,
    metrics: { Roots: roots.join(", ") || "none", Marked: marked.size },
  });
  r.step(
    "start from GC roots",
    `Objects 3 and 4 form a cycle with no root path. ${retain ? "Object 0 is a root reference." : "The last root reference has been dropped."}`,
    visual(),
  );
  while (queue.length) {
    const id = queue.shift();
    if (marked.has(id)) continue;
    marked.add(id);
    queue.push(...edges.filter(([a]) => a === id).map(([, b]) => b));
    r.step(
      "mark object; visit outgoing references",
      `Mark object ${id}; reachability follows references transitively.`,
      visual(),
    );
  }
  const freed = Array.from({ length: 5 }, (_, i) => i).filter(
    (i) => !marked.has(i),
  );
  r.step(
    "sweep unmarked objects",
    `Reclaim ${freed.join(", ")}. A cycle alone cannot keep objects alive in a tracing collector.`,
    {
      nodes: Array.from({ length: 5 }, (_, i) =>
        node(
          `Object ${i}`,
          marked.has(i) ? "retained" : "reclaimed",
          marked.has(i) ? "active" : "",
        ),
      ),
      metrics: { Retained: marked.size, Reclaimed: freed.length },
    },
  );
  return r.finish({ retained: [...marked], freed });
}
export function hashMap(p) {
  if (
    !Array.isArray(p.keys) ||
    !p.keys.length ||
    p.keys.length > 12 ||
    p.keys.some((k) => typeof k !== "string" || k.length > 12)
  )
    throw new Error("Use 1–12 string keys, each at most 12 characters.");
  const r = trace();
  let capacity = 4;
  const entries = [];
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++)
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return (h ^ (h >>> 16)) >>> 0;
  };
  const visual = () => ({
    nodes: Array.from({ length: capacity }, (_, i) =>
      node(
        `Bucket ${i}`,
        entries.filter((k) => (hash(k) & (capacity - 1)) === i).join(" → ") ||
          "empty",
      ),
    ),
    columns: ["Key", "Spread hash", "Bucket"],
    rows: entries.map((k) => [k, hash(k), hash(k) & (capacity - 1)]),
    metrics: {
      Size: entries.length,
      Capacity: capacity,
      "Load factor": (entries.length / capacity).toFixed(2),
    },
  });
  for (const key of p.keys) {
    if (!entries.includes(key)) entries.push(key);
    r.step(
      "bucket = (capacity−1) & spread(hashCode(key))",
      `Insert or replace “${key}”. Colliding keys still need equality checks.`,
      visual(),
    );
    if (entries.length > capacity * 0.75) {
      capacity *= 2;
      r.step(
        "resize and redistribute buckets",
        `Size crossed the 0.75 threshold. Capacity becomes ${capacity}; hashes are redistributed. This lab omits tree bins and null keys.`,
        visual(),
      );
    }
  }
  return r.finish({ capacity, entries });
}
export function threads(p) {
  const count = bounded(p.tasks, 2, 8, "tasks"),
    workers = bounded(p.workers, 1, 3, "workers"),
    mode = choice(p.mode, ["platform", "virtual"], "mode"),
    r = trace(),
    tasks = Array.from({ length: count }, (_, id) => ({
      id,
      phase: "ready",
      io: 0,
      owner: false,
      done: false,
    }));
  let time = 0;
  const timeline = [];
  r.step(
    "submit tasks: CPU(1), IO(3), CPU(1)",
    "Each task needs two CPU ticks separated by three I/O ticks. Virtual threads release carriers during this modeled unmountable I/O.",
    { rows: tasks.map((t) => [t.id, t.phase]), columns: ["Task", "Phase"] },
  );
  while (tasks.some((t) => !t.done) && time < 60) {
    const ioAtStart = tasks.filter((t) => t.phase === "io");
    let slots = workers - (mode === "platform" ? ioAtStart.length : 0);
    const running = tasks
      .filter((t) => !t.done && (t.phase === "ready" || t.phase === "resume"))
      .slice(0, Math.max(0, slots));
    for (const t of running) {
      if (t.phase === "ready") {
        t.phase = "io";
        t.io = 3;
      } else {
        t.phase = "done";
        t.done = true;
      }
    }
    for (const t of ioAtStart) {
      t.io--;
      if (!t.io) t.phase = "resume";
    }
    timeline.push({
      label: running.map((t) => `T${t.id}`).join("+") || "idle",
      duration: 1,
    });
    time++;
    r.step(
      "schedule runnable work; advance waiting IO",
      `Tick ${time}: ${running.length} CPU task(s). ${mode === "platform" ? "Waiting tasks hold platform workers." : "Waiting tasks release carriers; CPU capacity is still bounded."}`,
      {
        nodes: tasks.map((t) =>
          node(
            `Task ${t.id}`,
            t.phase + (t.phase === "io" ? ` (${t.io})` : ""),
            running.includes(t) ? "active" : "",
          ),
        ),
        timeline,
        metrics: {
          Ticks: time,
          "CPU slots": workers,
          Completed: tasks.filter((t) => t.done).length,
        },
      },
    );
  }
  return r.finish({ time, completed: tasks.filter((t) => t.done).length });
}
export function pool(p) {
  const count = bounded(p.tasks, 2, 10, "tasks"),
    workers = bounded(p.workers, 1, 3, "workers"),
    queueSize = bounded(p.queue, 0, 5, "queue"),
    r = trace();
  const running = [],
    queue = [],
    rejected = [];
  let time = 0,
    done = 0;
  for (let id = 0; id < count; id++) {
    if (running.length < workers) running.push({ id, left: 3 });
    else if (queue.length < queueSize) queue.push(id);
    else rejected.push(id);
    r.step(
      "submit → idle worker, bounded queue, or reject",
      `Submit task ${id}: ${rejected.includes(id) ? "rejected (AbortPolicy model)" : queue.includes(id) ? "queued" : "running"}.`,
      {
        nodes: [
          node("Workers", running.map((t) => t.id).join(", ")),
          node("Queue", queue.join(", ") || "empty"),
          node("Rejected", rejected.join(", ") || "none"),
        ],
        metrics: { Submitted: id + 1, Rejected: rejected.length },
      },
    );
  }
  while (running.length) {
    time++;
    for (const t of running) t.left--;
    for (let i = running.length - 1; i >= 0; i--)
      if (!running[i].left) {
        running.splice(i, 1);
        done++;
      }
    while (queue.length && running.length < workers)
      running.push({ id: queue.shift(), left: 3 });
    r.step(
      "finish tasks; dequeue into free workers",
      `Tick ${time}: ${done} completed. Increasing a queue holds more waiting work; it does not create worker capacity.`,
      {
        nodes: [
          node("Workers", running.map((t) => t.id).join(", ") || "idle"),
          node("Queue", queue.join(", ") || "empty"),
          node("Complete", done),
        ],
        metrics: { Ticks: time, Completed: done, Rejected: rejected.length },
      },
    );
  }
  return r.finish({ done, rejected, time });
}
export function processes(p) {
  const mode = choice(p.mode, ["processes", "threads"], "mode");
  return flow(
    ["Task A", "Address space A", "Task B", "Address space B"],
    [
      [
        0,
        1,
        "store counter = 1",
        "A writes a counter in its own mapped memory.",
        "counter=1",
      ],
      [
        2,
        mode === "threads" ? 1 : 3,
        "load counter",
        mode === "threads"
          ? "Threads in one process share the address space but have distinct stacks."
          : "Separate processes do not automatically share this ordinary mapping.",
        mode === "threads" ? "B reads shared 1" : "B reads private 0",
      ],
      [
        2,
        mode === "threads" ? 1 : 3,
        "store counter = 2",
        mode === "threads"
          ? "B changes the same shared counter. Synchronization is still needed for compound operations."
          : "B changes its own counter. Shared memory or IPC would require an explicit mechanism.",
        mode === "threads" ? "shared counter=2" : "private counter=2",
      ],
      [
        0,
        1,
        "load counter again",
        mode === "threads"
          ? "A can observe the shared value after appropriate synchronization."
          : "A retains its private value.",
        mode === "threads" ? "A reads 2" : "A reads 1",
      ],
    ],
    { a: mode === "threads" ? 2 : 1, b: 2 },
  );
}
export function scheduling(p) {
  const bursts = numbers(p.bursts, {
      min: 1,
      max: 12,
      count: 6,
      name: "bursts",
    }),
    quantum = bounded(p.quantum, 1, 6, "quantum"),
    overhead = bounded(p.overhead, 0, 3, "overhead"),
    method = choice(p.method, ["fcfs", "round-robin"], "method"),
    remaining = [...bursts],
    queue = bursts.map((_, i) => i),
    completion = bursts.map(() => 0),
    timeline = [],
    r = trace();
  let time = 0,
    last = null;
  while (queue.length) {
    const id = queue.shift();
    if (last !== null && last !== id && overhead) {
      time += overhead;
      timeline.push({ label: "switch", duration: overhead });
      r.step(
        "save context; restore next context",
        `Switch P${last} → P${id}. ${overhead} modeled tick(s) do no application work.`,
        { timeline, metrics: { Clock: time } },
      );
    }
    const run =
      method === "fcfs" ? remaining[id] : Math.min(remaining[id], quantum);
    remaining[id] -= run;
    time += run;
    timeline.push({ label: `P${id}`, duration: run });
    if (remaining[id]) queue.push(id);
    else completion[id] = time;
    last = id;
    r.step(
      "run selected process for its time slice",
      `P${id} uses ${run} CPU ticks; ${remaining[id]} remain. All processes arrived at t=0.`,
      {
        timeline,
        bars: bars(
          remaining,
          bursts.map((_, i) => `P${i} remaining`),
        ),
        columns: ["Process", "CPU burst", "Completion", "Waiting"],
        rows: bursts.map((b, i) => [
          i,
          b,
          completion[i] || "pending",
          completion[i] ? completion[i] - b : "pending",
        ]),
        metrics: {
          Clock: time,
          "Ready queue": queue.map((i) => `P${i}`).join(", ") || "empty",
        },
      },
    );
  }
  return r.finish({
    time,
    completion,
    waiting: completion.map((c, i) => c - bursts[i]),
    timeline,
  });
}
export function paging(p) {
  const requests = numbers(p.pages, { max: 9, count: 18, name: "pages" }),
    capacity = bounded(p.frames, 1, 5, "frames"),
    policy = choice(p.policy, ["fifo", "lru"], "policy"),
    r = trace(),
    frames = [],
    last = new Map();
  let faults = 0;
  requests.forEach((page, time) => {
    const hit = frames.includes(page);
    let evicted = null;
    if (!hit) {
      faults++;
      if (frames.length === capacity) {
        const index =
          policy === "fifo"
            ? 0
            : frames.reduce(
                (best, v, i) =>
                  last.get(v) < last.get(frames[best]) ? i : best,
                0,
              );
        evicted = frames.splice(index, 1)[0];
      }
      frames.push(page);
    }
    last.set(page, time);
    r.step(
      "lookup page; on miss evict victim and load",
      `Access ${page}: ${hit ? "hit" : `fault${evicted === null ? "" : `; evict ${evicted}`}`}. ${policy === "lru" ? "A hit refreshes recency." : "FIFO retains insertion order even on a hit."}`,
      {
        nodes: Array.from({ length: capacity }, (_, i) =>
          node(
            `Frame ${i}`,
            frames[i] ?? "empty",
            frames[i] === page ? "active" : "",
          ),
        ),
        timeline: requests
          .slice(0, time + 1)
          .map((v) => ({ label: String(v), duration: 1 })),
        metrics: {
          Accesses: time + 1,
          Faults: faults,
          Hits: time + 1 - faults,
        },
      },
    );
  });
  return r.finish({ faults, frames });
}
export function tlb(p) {
  const addresses = numbers(p.addresses, {
      max: 63,
      count: 12,
      name: "addresses",
    }),
    capacity = bounded(p.entries, 1, 4, "entries"),
    r = trace(),
    cache = new Map();
  let misses = 0;
  const translated = [];
  for (const address of addresses) {
    const page = Math.floor(address / 8),
      offset = address % 8,
      hit = cache.has(page),
      frame = (page * 3 + 1) % 8;
    if (!hit) {
      misses++;
      if (cache.size === capacity) cache.delete(cache.keys().next().value);
    } else cache.delete(page);
    cache.set(page, frame);
    const physical = frame * 8 + offset;
    translated.push(physical);
    r.step(
      "VPN=VA÷8; offset=VA mod 8; PA=PFN×8+offset",
      `${address} → page ${page} + offset ${offset}. ${hit ? "TLB hit." : "TLB miss: consult the resident page table (not a page fault)."} Physical address ${physical}.`,
      {
        columns: ["Virtual page", "Physical frame"],
        rows: [...cache],
        nodes: [
          node("Virtual", address),
          node("Translation", `${page}→${frame}`, "active"),
          node("Physical", physical),
        ],
        links: [
          [0, 1],
          [1, 2],
        ],
        metrics: { "TLB misses": misses, "Page faults": 0 },
      },
    );
  }
  return r.finish({ translated, misses });
}
export function deadlock(p) {
  const mode = choice(p.mode, ["opposite-order", "same-order"], "mode");
  return flow(
    ["Thread A", "Lock X", "Thread B", "Lock Y"],
    mode === "opposite-order"
      ? [
          [0, 1, "A.acquire(X)", "A owns X.", "owned by A"],
          [2, 3, "B.acquire(Y)", "B owns Y.", "owned by B"],
          [
            0,
            3,
            "A.wait(Y)",
            "A waits for a lock held by B.",
            "A waits; B owns",
          ],
          [
            2,
            1,
            "B.wait(X)",
            "B waits for A. The wait-for graph contains A → B → A: deadlock.",
            "B waits; A owns",
          ],
          [
            2,
            3,
            "abort B; release its locks",
            "This recovery requires abortable work and cleanup. A timeout alone does not automatically undo side effects.",
            "released",
          ],
          [
            0,
            3,
            "A.acquire(Y); finish; release",
            "A can now make progress.",
            "A completes",
          ],
        ]
      : [
          [
            0,
            1,
            "A.acquire(X)",
            "Both threads use the global X-before-Y order.",
            "owned by A",
          ],
          [
            2,
            1,
            "B.wait(X)",
            "B waits without holding Y; no cycle forms.",
            "B waits; A owns",
          ],
          [
            0,
            3,
            "A.acquire(Y); finish",
            "A can acquire Y, finish and release both locks.",
            "released",
            { 1: "released" },
          ],
          [
            2,
            1,
            "B.acquire(X); acquire(Y); finish",
            "B now finishes using the same order.",
            "B completes",
            { 3: "released" },
          ],
        ],
    { deadlock: mode === "opposite-order" },
  );
}
export const runtimeModels = {
  "jvm-loading": classLoading,
  "jvm-memory": frames,
  "jvm-gc": gc,
  "jvm-hashmap": hashMap,
  "jvm-pools": pool,
  "jvm-virtual": threads,
  "os-processes": processes,
  "os-scheduling": scheduling,
  "os-context": scheduling,
  "os-paging": paging,
  "os-tlb": tlb,
  "os-deadlocks": deadlock,
};
