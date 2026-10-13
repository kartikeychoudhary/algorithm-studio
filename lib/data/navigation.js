import { patternList } from "./design-patterns.js";
export const navigationGroups = [
  {
    title: "Minimax algorithm",
    description: "Think like your opponent",
    ids: ["ttt", "chess"],
  },
  {
    title: "Knapsack algorithm",
    description: "Choose what matters",
    ids: ["knapsack"],
  },
  {
    title: "Graphs & pathfinding",
    description: "Find your way through",
    ids: ["bfs", "dfs", "dijkstra", "astar", "flights", "topo", "union"],
  },
  {
    title: "Arrays & searching",
    description: "Find the pattern in a sequence",
    ids: [
      "binary",
      "lowerbound",
      "rotated",
      "capacity",
      "hashing",
      "kadane",
      "prefix",
      "product",
    ],
  },
  {
    title: "Pointers & windows",
    ids: ["pointers", "window", "minwindow", "rain"],
  },
  {
    title: "Sorting algorithms",
    description: "Bring order to the data",
    ids: ["merge", "quick"],
  },
  {
    title: "Stacks & heaps",
    description: "Keep the candidates that matter",
    ids: ["stack", "heap", "topk"],
  },
  {
    title: "Linked lists & trees",
    description: "Follow pointers and branches",
    ids: ["linked", "tree"],
  },
  {
    title: "DP & backtracking",
    description: "Build answers from smaller choices",
    ids: ["coins", "subsets", "lis", "robber", "lcs", "queens", "sudoku"],
  },
  { title: "Greedy algorithms", ids: ["jump", "majority"] },
  { title: "Strings & tries", ids: ["trie"] },
  { title: "Intervals", ids: ["intervals"] },
];
export const navigationSections = [
  { id: "algorithms", title: "Algorithms", groups: navigationGroups },
  {
    id: "concepts",
    title: "Important Concepts",
    shortTitle: "Concepts",
    groups: [
      {
        title: "Data & storage",
        ids: ["acid", "isolation", "indexes", "caching"],
      },
      {
        title: "Distributed systems",
        ids: ["cap", "replication", "sharding", "queues"],
      },
      {
        title: "Reliability & traffic",
        ids: ["idempotency", "ratelimit", "reliability"],
      },
      { title: "Runtime & concurrency", ids: ["concurrency", "memory"] },
      { title: "Networking", ids: ["networking"] },
      { title: "Code & design principles", ids: ["solid", "oop", "clean"] },
      { title: "Performance foundations", ids: ["complexity"] },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    shortTitle: "Patterns",
    groups: ["Creational", "Structural", "Behavioral"].map((category) => ({
      title: `${category} patterns`,
      ids: patternList.filter((p) => p.category === category).map((p) => p.id),
    })),
  },
  {
    id: "case-studies",
    title: "Case Studies",
    shortTitle: "Case studies",
    groups: [
      { title: "Read-heavy systems", ids: ["shortener", "feed"] },
      { title: "Reliable workflows", ids: ["checkout", "scheduler"] },
      { title: "Real-time systems", ids: ["chat"] },
      { title: "Data-intensive systems", ids: ["storage"] },
    ],
  },
  {
    id: "spring",
    title: "Spring",
    groups: [
      { title: "Startup & container", ids: ["spring-boot", "spring-beans"] },
      { title: "Web & security", ids: ["spring-request", "spring-security"] },
      {
        title: "Data & cross-cutting flows",
        ids: ["spring-transactions", "spring-async", "spring-cache"],
      },
      { title: "Annotation atlas", ids: ["spring-annotations"] },
    ],
  },
  {
    id: "practice",
    title: "Practice",
    groups: [
      { title: "Study & review", ids: ["roadmap"] },
      { title: "Active learning", ids: ["compare", "debug"] },
    ],
  },
];
export const groupKey = (section, group) => `${section.id}:${group.title}`;
export function lessonAncestors(id) {
  const result = [];
  for (const section of navigationSections)
    for (const group of section.groups)
      if (group.ids.includes(id))
        result.push(section.id, groupKey(section, group));
  return result;
}
