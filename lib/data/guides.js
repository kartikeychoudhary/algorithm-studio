export const graphGuides = {
  bfs: [
    [
      "Use a queue",
      "FIFO order expands all distance-1 nodes before distance-2 nodes. The first arrival gives the fewest edges.",
    ],
    [
      "Mark on discovery",
      "Add a node to the seen set when enqueuing it. This prevents cycles and duplicate queue entries.",
    ],
    [
      "Recover the route",
      "Store a parent for every discovered node, then walk backward from the goal. Weights do not affect BFS.",
    ],
  ],
  dfs: [
    [
      "Use a stack",
      "LIFO order follows the most recently discovered node. When a branch ends, pending branches remain on the stack.",
    ],
    [
      "Track visited nodes",
      "Mark on discovery so cycles cannot trap the traversal. The playground stops when it reaches the goal.",
    ],
    [
      "Know its limits",
      "DFS is useful for reachability and exploring structure. Its first route need not be the shortest or cheapest.",
    ],
  ],
  dijkstra: [
    [
      "Keep tentative distances",
      "Start at 0, with every other distance infinite. Relax an edge if the route through the current node improves its neighbor.",
    ],
    [
      "Pop the cheapest node",
      "A binary min-heap keeps the smallest distance at the front. Ignore old entries whose distance has been improved.",
    ],
    [
      "Use non-negative weights",
      "Once the goal is removed from the priority queue, its cost is optimal. Negative edges invalidate this guarantee.",
    ],
  ],
  astar: [
    [
      "Separate g, h, and f",
      "g is the known cost from the start; h estimates the remaining cost. Choose the node with the smallest f = g + h.",
    ],
    [
      "Keep the estimate safe",
      "The grid uses Manhattan distance because moves are orthogonal and each costs at least 1. The network uses scaled geometric distance. Both are consistent.",
    ],
    [
      "Compare the search",
      "On the same weighted map, A* and Dijkstra return the same optimal cost. A* can explore fewer nodes; it is not guaranteed to do so on every map.",
    ],
  ],
  flights: [
    [
      "Count edges, not just stops",
      "K intermediate stops allow at most K + 1 flights. A direct flight uses zero stops.",
    ],
    [
      "Freeze the previous round",
      "For each round, copy costs into next. Every flight reads its departure cost from the old array; in-place reads could chain too many flights.",
    ],
    [
      "Preserve cheaper short routes",
      "Each round allows one extra edge and retains earlier solutions. This handles the extra stop constraint that an ordinary one-distance-per-node search misses.",
    ],
  ],
};
