import { make } from "./advanced-lessons.js";
export const moreLessons = {
  product: make(
    "Product except self",
    "Multiply everything except here.",
    "Arrays & searching",
    "O(n)",
    "O(1) excluding output",
    [1, 2, 3, 4],
    238,
    "Product of Array Except Self",
    "product-of-array-except-self",
    [24, 12, 8, 6],
    "Combine products strictly before and after each index.",
    "Division breaks on zero. The output buffer doubles as prefix storage.",
    "Build the result in two passes, without dividing.",
    [
      { name: "With a zero", values: [-1, 1, 0, -3, 3] },
      { name: "Two zeros", values: [0, 2, 0, 4] },
    ],
  ),
  rotated: make(
    "Rotated binary search",
    "Find the half that stayed sorted.",
    "Arrays & searching",
    "O(log n)",
    "O(1)",
    [4, 5, 6, 7, 0, 1, 2],
    33,
    "Search in Rotated Sorted Array",
    "search-in-rotated-sorted-array",
    4,
    "With distinct values, at least one half is sorted.",
    "Duplicate values need different logic and can destroy the logarithmic guarantee.",
    "Return the original index of target, or −1 if missing.",
    [
      { name: "Missing target", values: [4, 5, 6, 7, 0, 1, 2], parameter: 3 },
      { name: "Not rotated", values: [1, 2, 3, 4, 5], parameter: 4 },
    ],
    { label: "target", value: 0, min: -100, max: 100 },
  ),
  rain: make(
    "Trapping rain water",
    "Let the smaller boundary decide.",
    "Arrays & searching",
    "O(n)",
    "O(1) excluding visual trace",
    [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1],
    42,
    "Trapping Rain Water",
    "trapping-rain-water",
    6,
    "The smaller known boundary fixes the water on that side.",
    "Water is measured above each bar, not across the entire outer rectangle.",
    "Compute the water trapped between non-negative height bars.",
    [
      { name: "Deep basin", values: [4, 2, 0, 3, 2, 5] },
      { name: "No basin", values: [1, 2, 3, 4] },
    ],
  ),
  minwindow: make(
    "Variable sliding window",
    "Grow to qualify. Shrink to improve.",
    "Arrays & searching",
    "O(n)",
    "O(1)",
    [2, 3, 1, 2, 4, 3],
    209,
    "Minimum Size Subarray Sum",
    "minimum-size-subarray-sum",
    2,
    "With positive numbers, removing the leftmost value always reduces the sum.",
    "This algorithm is not correct for arrays with negative numbers.",
    "Find the shortest contiguous range whose sum reaches target; return 0 when impossible.",
    [
      { name: "One element works", values: [1, 4, 4], parameter: 4 },
      { name: "Impossible", values: [1, 1, 1, 1], parameter: 11 },
    ],
    { label: "target", value: 7, min: 1, max: 1600 },
  ),
  majority: make(
    "Boyer–Moore voting",
    "Cancel pairs. Keep the majority.",
    "Greedy algorithms",
    "O(n)",
    "O(1)",
    [2, 2, 1, 1, 1, 2, 2],
    169,
    "Majority Element",
    "majority-element",
    2,
    "Removing a pair of unequal votes cannot eliminate a strict majority.",
    "Without a guaranteed majority, verify the candidate with a second counting pass.",
    "Find the value occurring more than n/2 times. The editor enforces this problem's majority guarantee.",
    [
      { name: "Three votes", values: [3, 2, 3] },
      { name: "All equal", values: [7, 7, 7] },
    ],
  ),
  union: {
    ...make(
      "Union–find",
      "Merge components, not whole graphs.",
      "Graphs & pathfinding",
      "O((V + E) α(V)) amortized",
      "O(V)",
      [0, 1, 2, 3],
      1319,
      "Number of Operations to Make Network Connected",
      "number-of-operations-to-make-network-connected",
      1,
      "Each root represents one connected component; union reduces the count by one.",
      "A spare cable can connect two components, but fewer than n−1 total cables can never suffice.",
      "Return the minimum cable relocations needed to connect the network, or −1.",
      [
        {
          name: "Too few cables",
          values: [0, 1, 2, 3],
          parameter: 4,
          edges: "[[0,1],[2,3]]",
        },
        {
          name: "Already connected",
          values: [0, 1, 2],
          parameter: 3,
          edges: "[[0,1],[1,2]]",
        },
      ],
      { label: "n", value: 4, min: 1, max: 8 },
    ),
    edges: "[[0,1],[0,2],[1,2]]",
  },
};
moreLessons.rain.problem.input = "height";
moreLessons.rain.topic = "Pointers & windows";
moreLessons.minwindow.topic = "Pointers & windows";
moreLessons.rain.note =
  "Use up to 16 non-negative integer heights from 0 to 100. Blue shows resolved water; the labels show ground height.";
moreLessons.minwindow.note =
  "Use up to 16 positive integers from 1 to 100 and a target from 1 to 1600.";
moreLessons.union.problem.input = "connections";
moreLessons.union.note =
  "Use 1–8 computers labeled 0 to n−1 and distinct undirected connections. Arrows show parent pointers in the disjoint-set forest, not physical cables.";
moreLessons.product.note =
  "Use 2–16 integers from −10 to 10; products must remain safe JavaScript integers.";
