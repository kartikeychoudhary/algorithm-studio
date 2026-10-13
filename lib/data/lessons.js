import { interviewLessons } from "./interview-lessons.js";
import { conceptLessons } from "./concepts.js";
import { designLessons } from "./design-patterns.js";
import { caseStudies } from "./case-studies.js";
import { labLessons } from "./lab-lessons.js";
import { foundationLessons } from "./foundation-lessons.js";
import { springLessons } from "./spring-lessons.js";
import { practiceLessons } from "./practice-lessons.js";
export const graphLessons = {
  bfs: {
    title: "Explore one layer at a time.",
    subtitle:
      "Watch a queue turn a maze into the shortest route by number of moves.",
    label: "Breadth-first search",
    number: "03",
    tag: "GRAPH TRAVERSAL",
    complexity: "O(V + E)",
    topic: "Graphs",
  },
  dfs: {
    title: "Follow a path. Then backtrack.",
    subtitle:
      "A stack takes you deep into a graph. Discover why finding a route is not the same as finding the shortest one.",
    label: "Depth-first search",
    number: "03",
    tag: "GRAPH TRAVERSAL",
    complexity: "O(V + E)",
    topic: "Graphs",
  },
  dijkstra: {
    title: "Find the cheapest way through.",
    subtitle:
      "When every step has a different cost, explore the lowest known cost first.",
    label: "Dijkstra",
    number: "03",
    tag: "WEIGHTED SHORTEST PATH",
    complexity: "O((V + E) log V)",
    topic: "Graphs",
  },
  astar: {
    title: "Give your search a sense of direction.",
    subtitle:
      "Combine the cost so far with a safe estimate of the cost ahead. See A* choose its next move.",
    label: "A* search",
    number: "03",
    tag: "HEURISTIC SEARCH",
    complexity: "O((V + E) log V)",
    topic: "Graphs",
  },
  flights: {
    title: "The cheapest flight has a catch.",
    subtitle:
      "Find an affordable route without exceeding your stop limit. A classic graph problem with an extra constraint.",
    label: "Cheapest flights",
    number: "04",
    tag: "BELLMAN–FORD · DYNAMIC PROGRAMMING",
    complexity: "O((K + 1) × (V + E))",
    topic: "Graphs",
  },
};

export const lessons = {
  ...labLessons,
  ...foundationLessons,
  ...springLessons,
  ...practiceLessons,
  ...caseStudies,
  ...conceptLessons,
  ...designLessons,
  ...interviewLessons,
  ...graphLessons,
  ttt: {
    title: "Think a few moves ahead.",
    subtitle:
      "Explore how minimax finds the best move by considering an opponent who plays perfectly.",
    label: "Tic-tac-toe",
    number: "01",
    tag: "GAME THEORY",
    complexity: "O(bᵈ)",
    topic: "Minimax",
  },
  chess: {
    title: "See the move after the move.",
    subtitle:
      "Take minimax to the chessboard. Discover why looking deeper can change the best decision.",
    label: "Chess",
    number: "01",
    tag: "GAME THEORY",
    complexity: "O(bᵈ)",
    topic: "Minimax",
  },
  knapsack: {
    title: "Make room for the best.",
    subtitle:
      "A small bag. A few good choices. Find the most valuable combination with dynamic programming.",
    label: "0/1 Knapsack",
    number: "02",
    tag: "DYNAMIC PROGRAMMING",
    complexity: "O(n × W)",
    topic: "Knapsack",
  },
};
