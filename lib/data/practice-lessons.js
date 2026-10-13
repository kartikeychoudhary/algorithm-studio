const item = (label, subtitle) => ({
  kind: "practice",
  section: "Practice",
  topic: "Active learning",
  tag: "PRACTICE STUDIO",
  label,
  title: label,
  subtitle,
});
export const practiceLessons = {
  roadmap: item(
    "My study roadmap",
    "Build foundations, practice the patterns, and return to weak topics. Progress stays in this browser.",
  ),
  compare: item(
    "Compare approaches",
    "Run the same input through a linear scan and binary search; inspect actual comparisons and modeled auxiliary state.",
  ),
  debug: item(
    "Find the bug",
    "Repair a boundary condition and run examples that expose the error. No arbitrary code execution is used.",
  ),
};
export const studyPaths = [
  {
    title: "Read and search",
    requires: [],
    ids: [
      "complexity",
      "binary",
      "lowerbound",
      "rotated",
      "pointers",
      "window",
      "minwindow",
      "hashing",
    ],
  },
  {
    title: "Organize data",
    requires: ["binary"],
    ids: [
      "merge",
      "quick",
      "intervals",
      "heap",
      "topk",
      "trie",
      "linked",
      "tree",
    ],
  },
  {
    title: "Explore and optimize",
    requires: ["complexity"],
    ids: [
      "bfs",
      "dfs",
      "dijkstra",
      "astar",
      "union",
      "coins",
      "lcs",
      "queens",
      "sudoku",
      "capacity",
    ],
  },
  {
    title: "Understand systems",
    requires: ["complexity"],
    ids: [
      "concurrency",
      "isolation",
      "networking",
      "memory",
      "caching",
      "queues",
      "reliability",
      "idempotency",
    ],
  },
  {
    title: "Design a complete service",
    requires: ["caching", "queues", "idempotency"],
    ids: ["shortener", "checkout", "chat", "feed", "storage", "scheduler"],
  },
  {
    title: "Follow Spring from startup to response",
    requires: ["oop", "networking"],
    ids: [
      "spring-boot",
      "spring-beans",
      "spring-request",
      "spring-security",
      "spring-transactions",
      "spring-async",
      "spring-cache",
      "spring-annotations",
    ],
  },
];
