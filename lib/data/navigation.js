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
    ids: ["bfs", "dfs", "dijkstra", "astar", "flights", "topo"],
  },
  {
    title: "Arrays & searching",
    description: "Find the pattern in a sequence",
    ids: ["binary", "pointers", "window", "hashing", "kadane", "prefix"],
  },
  {
    title: "Sorting algorithms",
    description: "Bring order to the data",
    ids: ["merge", "quick"],
  },
  {
    title: "Stacks & heaps",
    description: "Keep the candidates that matter",
    ids: ["stack", "heap"],
  },
  {
    title: "Linked lists & trees",
    description: "Follow pointers and branches",
    ids: ["linked", "tree"],
  },
  {
    title: "DP & backtracking",
    description: "Build answers from smaller choices",
    ids: ["coins", "subsets", "lis", "robber"],
  },
  { title: "Greedy algorithms", ids: ["jump"] },
];
export const navigationSections = [
  { id: "algorithms", title: "Algorithms", groups: navigationGroups },
  {
    id: "concepts",
    title: "Important Concepts",
    groups: [
      { title: "Data & distributed systems", ids: ["acid", "cap"] },
      { title: "Code & design principles", ids: ["solid", "oop", "clean"] },
      { title: "Performance foundations", ids: ["complexity"] },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    groups: ["Creational", "Structural", "Behavioral"].map((category) => ({
      title: `${category} patterns`,
      ids: patternList.filter((p) => p.category === category).map((p) => p.id),
    })),
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
