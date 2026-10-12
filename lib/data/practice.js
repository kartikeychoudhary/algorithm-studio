const p = (number, name, slug, reason, difficulty = "Medium") => ({
  number,
  name,
  url: `https://leetcode.com/problems/${slug}/`,
  reason,
  difficulty,
});
const lru = p(
  146,
  "LRU Cache",
  "lru-cache",
  "Implement cache eviction with a hash map and doubly linked list. This drill does not model TTL or distributed invalidation.",
);
const recent = p(
  933,
  "Number of Recent Calls",
  "number-of-recent-calls",
  "Practice timestamp-window accounting. This is a sliding-window counter, not a token-bucket implementation.",
  "Easy",
);
const versions = p(
  981,
  "Time Based Key-Value Store",
  "time-based-key-value-store",
  "Index each key's history and binary-search the last version at or before a timestamp.",
);
const queue = p(
  622,
  "Design Circular Queue",
  "design-circular-queue",
  "Implement bounded FIFO storage and full/empty conditions. Durability and redelivery are additional system concerns.",
);
const snapshot = p(
  1146,
  "Snapshot Array",
  "snapshot-array",
  "Preserve earlier values while later writes change the current state; sparse histories avoid copying everything.",
);
const iterator = p(
  284,
  "Peeking Iterator",
  "peeking-iterator",
  "Wrap an iterator to add peek without advancing its observable position.",
);
const nested = p(
  341,
  "Flatten Nested List Iterator",
  "flatten-nested-list-iterator",
  "Traverse a recursively composed structure through a uniform iterator interface.",
);
const game = p(
  486,
  "Predict the Winner",
  "predict-the-winner",
  "Model both players' optimal choices with a score-difference recurrence.",
);
const islands = p(
  200,
  "Number of Islands",
  "number-of-islands",
  "Traverse connected land cells and count components.",
);
const path = p(
  1091,
  "Shortest Path in Binary Matrix",
  "shortest-path-in-binary-matrix",
  "Use BFS for equal-cost moves. An A* variant needs a heuristic valid for eight-direction movement.",
);
const tiny = p(
  535,
  "Encode and Decode TinyURL",
  "encode-and-decode-tinyurl",
  "Implement the code-to-URL mapping from the case study. Availability, abuse controls, and storage durability are separate design work.",
);
export const relatedPractice = {
  ttt: [game],
  chess: [game],
  knapsack: [
    p(
      416,
      "Partition Equal Subset Sum",
      "partition-equal-subset-sum",
      "Treat half of the total sum as a 0/1 subset-sum capacity.",
    ),
  ],
  bfs: [islands, path],
  dfs: [islands, nested],
  dijkstra: [
    p(
      743,
      "Network Delay Time",
      "network-delay-time",
      "Find nonnegative shortest-path distances and take the maximum arrival time.",
    ),
  ],
  astar: [path],
  flights: [
    p(
      787,
      "Cheapest Flights Within K Stops",
      "cheapest-flights-within-k-stops",
      "Keep distance layers separate so each round adds at most one edge.",
    ),
  ],
  binary: [versions],
  rotated: [versions],
  prefix: [
    {
      number: 238,
      name: "Product of Array Except Self",
      url: "https://leetcode.com/problems/product-of-array-except-self/",
      reason:
        "Transfer the prefix/suffix idea from addition to multiplication.",
      difficulty: "Medium",
    },
  ],
  hashing: [lru],
  linked: [lru],
  tree: [nested],
  stack: [
    p(
      42,
      "Trapping Rain Water",
      "trapping-rain-water",
      "Try the monotonic-stack alternative after understanding the two-pointer solution.",
      "Hard",
    ),
  ],
  window: [recent],
  minwindow: [recent],
  union: [islands],
  caching: [lru],
  indexes: [versions],
  queues: [queue, recent],
  ratelimit: [recent],
  iterator: [iterator, nested],
  decorator: [iterator],
  adapter: [iterator],
  composite: [nested],
  memento: [snapshot],
  command: [
    p(
      1472,
      "Design Browser History",
      "design-browser-history",
      "Model navigation commands and what happens to forward history after a new visit.",
    ),
  ],
  shortener: [tiny, lru, recent],
  checkout: [queue, snapshot],
};
export function practiceFor(id, lesson) {
  const primary = lesson.problem
    ? [
        {
          ...lesson.problem,
          reason:
            "Solve the lesson's problem independently, then compare invariants and edge cases.",
          difficulty: "Lesson problem",
        },
      ]
    : [];
  return [
    ...new Map(
      [...primary, ...(relatedPractice[id] || [])].map((p) => [p.url, p]),
    ).values(),
  ];
}
