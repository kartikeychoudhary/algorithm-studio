const stage = (title, outcome, ids, checkpoint) => ({
  title,
  outcome,
  ids,
  checkpoint,
});
export const studyGoals = {
  structures: {
    title: "Learn data structures",
    eyebrow: "FOUNDATIONS",
    description:
      "Understand how data is stored, traversed, and updated. A focused route through structures and their essential operations.",
    audience: "You know variables, loops, and functions.",
    stages: [
      stage(
        "Start with cost and lookup",
        "Compare the work done by common operations.",
        ["complexity", "hashing", "prefix"],
        "Explain when a hash map helps and what extra memory it costs.",
      ),
      stage(
        "Follow links and maintain order",
        "Trace references and explain what the structure preserves.",
        ["linked", "stack", "heap", "tree", "trie"],
        "Draw the state after one insertion, removal, or traversal step.",
      ),
      stage(
        "Represent relationships",
        "Use queues, stacks, and disjoint sets to explore connections.",
        ["bfs", "dfs", "union"],
        "Explain why BFS finds a shortest unweighted path and DFS need not.",
      ),
      stage(
        "Answer repeated range queries",
        "Choose structures based on updates and queries.",
        ["adv-fenwick", "adv-segment"],
        "Compare a prefix array, Fenwick tree, and segment tree for mutable data.",
      ),
    ],
  },
  dsa: {
    title: "Prepare for coding interviews",
    eyebrow: "DATA STRUCTURES & ALGORITHMS",
    description:
      "A complete ordered route through the algorithm library, with practice problems and checkpoints after each stage.",
    audience: "Basic programming; no algorithm experience required.",
    stages: [
      stage(
        "Reason about arrays",
        "State time and space costs, then recognize scan and lookup patterns.",
        [
          "complexity",
          "hashing",
          "pointers",
          "window",
          "minwindow",
          "kadane",
          "prefix",
          "product",
          "rain",
        ],
        "Solve one fresh array problem and justify the invariant.",
      ),
      stage(
        "Search, sort, and organize",
        "Choose an ordering, boundary, or data structure.",
        [
          "binary",
          "lowerbound",
          "rotated",
          "capacity",
          "merge",
          "quick",
          "intervals",
          "linked",
          "stack",
          "heap",
          "topk",
          "tree",
          "trie",
        ],
        "Explain a missing-target case and why each boundary update is safe.",
      ),
      stage(
        "Explore graphs",
        "Distinguish reachability, shortest routes, dependencies, and connectivity.",
        ["bfs", "dfs", "dijkstra", "astar", "flights", "topo", "union"],
        "Choose the appropriate graph algorithm from edge weights and constraints.",
      ),
      stage(
        "Optimize and search choices",
        "Identify state, transitions, pruning, or a greedy proof.",
        [
          "knapsack",
          "coins",
          "robber",
          "lis",
          "lcs",
          "subsets",
          "queens",
          "sudoku",
          "jump",
          "majority",
          "ttt",
          "chess",
        ],
        "Explain a DP recurrence and give a counterexample to an incorrect greedy choice.",
      ),
      stage(
        "Advanced patterns",
        "Handle range queries, directed components, critical edges, and compact states.",
        [
          "adv-fenwick",
          "adv-segment",
          "adv-deque",
          "adv-mst",
          "adv-scc",
          "adv-bridges",
          "adv-kmp",
          "adv-bitmask",
        ],
        "Solve a linked practice problem without copying the trace, then test edge cases.",
      ),
    ],
  },
  backend: {
    title: "Build Java & Spring services",
    eyebrow: "BACKEND ENGINEERING",
    description:
      "Follow a service from Java execution through Spring requests, persistence, security, and messaging.",
    audience: "Basic Java syntax and HTTP familiarity.",
    stages: [
      stage(
        "Understand the runtime",
        "Follow objects, threads, and shared state.",
        [
          "oop",
          "solid",
          "jvm-loading",
          "jvm-memory",
          "jvm-gc",
          "jvm-hashmap",
          "jvm-pools",
          "jvm-virtual",
        ],
        "Explain a thread-pool rejection and why virtual threads do not increase CPU capacity.",
      ),
      stage(
        "Follow Spring execution",
        "Trace startup, dependencies, and the complete request lifecycle.",
        [
          "spring-boot",
          "spring-beans",
          "spring-request",
          "spring-annotations",
          "spring-security",
        ],
        "Draw the request and response path, including a rejected request.",
      ),
      stage(
        "Make persistence correct",
        "Understand transactions, proxy boundaries, and query counts.",
        [
          "acid",
          "isolation",
          "spring-transactions",
          "spring-propagation",
          "spring-orm",
          "spring-testing",
        ],
        "Predict which work commits when an inner or outer transaction fails.",
      ),
      stage(
        "Connect services",
        "Handle async execution, caching, queues, and delivery safely.",
        [
          "spring-async",
          "spring-cache",
          "idempotency",
          "msg-partitions",
          "msg-groups",
          "msg-delivery",
          "msg-pressure",
        ],
        "Explain how a retried message can cause a duplicate effect and how to prevent it.",
      ),
    ],
  },
  design: {
    title: "Prepare for system design",
    eyebrow: "ARCHITECTURE",
    description:
      "Connect foundational tradeoffs to complete system-design case studies.",
    audience: "Comfort with APIs and basic databases.",
    stages: [
      stage(
        "Establish foundations",
        "Define load, consistency, and storage requirements.",
        ["complexity", "acid", "cap", "db-composite", "db-plans", "db-mvcc"],
        "Write measurable requirements before selecting components.",
      ),
      stage(
        "Handle scale and failure",
        "Reason about caches, traffic, partitioning, and retries.",
        [
          "caching",
          "queues",
          "ratelimit",
          "reliability",
          "idempotency",
          "dist-ring",
          "dist-quorum",
          "dist-raft",
          "msg-delivery",
        ],
        "Identify a failure mode and explain its effect on users.",
      ),
      stage(
        "Design end to end",
        "Practice a full answer: requirements, APIs, storage, flows, and tradeoffs.",
        ["shortener", "checkout", "chat", "feed", "storage", "scheduler"],
        "Present one design with capacity assumptions and a failure walkthrough.",
      ),
    ],
  },
  llm: {
    title: "Understand LLMs",
    eyebrow: "AI FOUNDATIONS",
    description:
      "Build from tokens and vectors to prediction, training, efficient inference, retrieval, and evaluation.",
    audience: "Basic algebra; the visualizations introduce the required math.",
    stages: [
      stage(
        "Represent text",
        "Inspect segmentation, IDs, embeddings, and positions.",
        ["llm-tokens", "llm-bpe"],
        "Explain why tokens are not always whole words.",
      ),
      stage(
        "Compute the next token",
        "Follow attention scores, masking, projections, and sampling.",
        ["llm-prediction", "llm-attention", "llm-heads", "llm-sampling"],
        "Compute one attention weight and explain how temperature changes a distribution.",
      ),
      stage(
        "Train and serve",
        "Connect loss to updates and measure inference tradeoffs.",
        ["llm-training", "llm-kv", "llm-quantization"],
        "Explain what caching saves and what quantization changes.",
      ),
      stage(
        "Retrieve and evaluate",
        "Inspect evidence selection and separate overlap from correctness.",
        ["llm-vectors", "llm-rag", "llm-evaluation"],
        "Show why a plausible answer with a citation can still be unsupported.",
      ),
    ],
  },
  production: {
    title: "Debug production systems",
    eyebrow: "RELIABILITY & OBSERVABILITY",
    description:
      "Learn to read evidence, trace requests, understand queue pressure, and verify a recovery.",
    audience: "Basic services, databases, and HTTP.",
    stages: [
      stage(
        "Understand the moving parts",
        "Follow requests, connections, retries, and asynchronous work.",
        [
          "networking",
          "jvm-pools",
          "reliability",
          "idempotency",
          "msg-partitions",
          "msg-groups",
          "msg-delivery",
          "msg-pressure",
        ],
        "Distinguish arrival rate, service rate, queue depth, and delivery attempts.",
      ),
      stage(
        "Read the evidence",
        "Correlate traces and logs, inspect tail latency, and calculate a budget.",
        ["obs-traces", "obs-latency", "obs-slo"],
        "Identify the slow span and explain why an average can hide a bad tail.",
      ),
      stage(
        "Investigate incidents",
        "Choose a mitigation from evidence and verify its modeled impact.",
        ["incident-cache", "incident-pool", "incident-lag", "incident-payment"],
        "For each incident, state cause, mitigation, verification, and remaining risks.",
      ),
    ],
  },
  internals: {
    title: "Explore computer & database internals",
    eyebrow: "SYSTEMS FOUNDATIONS",
    description:
      "Connect scheduling and memory to query execution, storage, and recovery.",
    audience: "Basic programming and SQL terminology.",
    stages: [
      stage(
        "Execution and memory",
        "Follow scheduling decisions and address translation.",
        [
          "os-processes",
          "os-scheduling",
          "os-context",
          "os-paging",
          "os-tlb",
          "os-deadlocks",
        ],
        "Explain a TLB miss, a page fault, and a context switch as distinct events.",
      ),
      stage(
        "Database execution",
        "See how data organization changes query work.",
        [
          "db-bplus",
          "db-composite",
          "db-joins",
          "db-plans",
          "db-mvcc",
          "db-wal",
        ],
        "Trace a lookup and explain recovery before versus after commit.",
      ),
    ],
  },
};
export const goalIds = (goal) => goal.stages.flatMap((s) => s.ids);
export const goalStats = (goal, progress) => {
  const ids = goalIds(goal),
    done = ids.filter((id) => progress[id]?.completed).length;
  return {
    total: ids.length,
    done,
    next: ids.find((id) => !progress[id]?.completed),
    percent: Math.round((done / ids.length) * 100),
  };
};
export function goalPosition(goal, id) {
  let offset = 0;
  for (const stage of goal.stages) {
    const i = stage.ids.indexOf(id);
    if (i >= 0) return { stage, index: offset + i };
    offset += stage.ids.length;
  }
  return null;
}
