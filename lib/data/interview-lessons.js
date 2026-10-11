const lesson = (
  label,
  title,
  subtitle,
  topic,
  complexity,
  space,
  values,
  parameter,
  details,
) => ({
  label,
  title,
  subtitle,
  topic,
  complexity,
  space,
  values,
  parameter,
  number: "05",
  tag: "INTERVIEW PATTERNS",
  ...details,
});
export const interviewLessons = {
  binary: lesson(
    "Binary search",
    "Cut the search space in half.",
    "Track the shrinking interval and prove why the target can only be inside it.",
    "Arrays & searching",
    "O(log n)",
    "O(1)",
    [2, 5, 8, 12, 16, 23, 38, 56],
    { label: "Target", value: 23, min: -99, max: 99 },
    {
      invariant: "If the target exists, it remains inside [left, right].",
      recognize:
        "Sorted search spaces, first/last occurrence, and monotonic feasibility checks.",
      pitfall:
        "Discard mid after comparing it; otherwise the interval may never shrink. This example returns any matching occurrence.",
      note: "The editor sorts the input first. Sorting costs O(n log n); the displayed complexity is for the search.",
      presets: [
        { name: "Target absent", values: [2, 5, 8, 12, 16, 23], parameter: 10 },
        { name: "Repeated values", values: [1, 2, 2, 2, 5, 9], parameter: 2 },
      ],
    },
  ),
  pointers: lesson(
    "Two pointers",
    "Bring two ends together.",
    "Find a target pair in a sorted array without checking every possible pair.",
    "Arrays & searching",
    "O(n)",
    "O(1)",
    [1, 3, 4, 6, 8, 11, 14],
    { label: "Target", value: 14, min: -198, max: 198 },
    {
      invariant:
        "Values outside the two pointers cannot complete a valid pair with the remaining candidates.",
      recognize:
        "Pair sums in sorted arrays, palindrome checks, and in-place compaction.",
      pitfall:
        "Use distinct indices and move the pointer justified by the sum. The returned indices refer to the sorted input.",
      note: "The editor sorts values before execution. Sorting adds O(n log n) preprocessing.",
      presets: [
        { name: "No pair", values: [1, 2, 4, 8], parameter: 20 },
        {
          name: "Negative values",
          values: [-8, -3, 0, 4, 7, 12],
          parameter: 4,
        },
      ],
    },
  ),
  window: lesson(
    "Sliding window",
    "Reuse the work inside the window.",
    "Find the maximum sum of exactly k consecutive values by adding one and removing one.",
    "Arrays & searching",
    "O(n)",
    "O(1)",
    [2, 1, 5, 1, 3, 2, 8, 1],
    { label: "Window size", value: 3, min: 1, max: 16 },
    {
      invariant:
        "After removing the outgoing value, sum equals the sum of the current window.",
      recognize:
        "Contiguous subarrays and substrings with fixed length or a maintainable condition.",
      pitfall:
        "Only compare full windows. Initialize the best sum to negative infinity so all-negative arrays work.",
      note: "This is a fixed-length window. Variable-length windows need a separate rule for shrinking.",
      presets: [
        { name: "All negative", values: [-5, -2, -7, -1, -4], parameter: 2 },
        { name: "Whole array", values: [3, 1, 4, 1, 5], parameter: 5 },
      ],
    },
  ),
  hashing: lesson(
    "Hash map · Two Sum",
    "Remember the missing half.",
    "Look up the complement in a map and keep the original array order.",
    "Arrays & searching",
    "O(n) expected",
    "O(n)",
    [3, 2, 4, 7, 11],
    { label: "Target", value: 6, min: -198, max: 198 },
    {
      invariant: "The map contains only indices before the current index.",
      recognize:
        "Complement lookup, counting frequencies, duplicate detection, and prefix-sum maps.",
      pitfall:
        "Look up before inserting, so one element is never paired with itself. Duplicate values can still form a valid pair.",
      note: "Expected time assumes efficient map operations. No sorting is performed.",
      presets: [
        { name: "Duplicate pair", values: [3, 3], parameter: 6 },
        { name: "No pair", values: [1, 4, 8], parameter: 10 },
      ],
    },
  ),
  merge: lesson(
    "Merge sort",
    "Split. Sort. Reassemble.",
    "Watch recursive ranges become sorted runs, then merge them into one answer.",
    "Sorting & stacks",
    "O(n log n)",
    "O(n)",
    [8, 3, 6, 2, 7, 1, 5, 4],
    null,
    {
      invariant:
        "Each merge reads two sorted halves and produces one sorted range.",
      recognize:
        "Stable sorting, divide and conquer, inversion counting, and merging ordered streams.",
      pitfall:
        "Copy the merged buffer back only after reading both halves. Taking the left value on a tie preserves stability.",
      note: "Intervals use [left, right): left is included; right is excluded.",
      presets: [
        { name: "Duplicates", values: [4, 2, 4, 1, 2, 1] },
        { name: "Reverse order", values: [9, 8, 7, 6, 5, 4, 3, 2, 1] },
      ],
    },
  ),
  stack: lesson(
    "Monotonic stack",
    "Let the next value resolve the past.",
    "Find the next strictly greater value to the right of every array element.",
    "Sorting & stacks",
    "O(n)",
    "O(n)",
    [2, 1, 2, 4, 3],
    null,
    {
      invariant:
        "Stack values are non-increasing; their next-greater answers are unresolved.",
      recognize:
        "Next greater element, daily temperatures, stock spans, and histogram boundaries.",
      pitfall:
        "Store indices, not just values. Equal values do not resolve a strictly-greater query.",
      note: "Each index is pushed and popped at most once, despite the nested loop.",
      presets: [
        { name: "Descending", values: [9, 7, 5, 3, 1] },
        { name: "Repeated heights", values: [3, 3, 4, 2, 2, 5] },
      ],
    },
  ),
  heap: lesson(
    "Min-heap · Top K",
    "Keep the strongest k candidates.",
    "Use a small heap to retain the largest k values while scanning an unsorted array.",
    "Sorting & stacks",
    "O(n log(k + 1))",
    "O(k)",
    [4, 9, 2, 7, 1, 8, 3, 6],
    { label: "k largest", value: 3, min: 1, max: 16 },
    {
      invariant:
        "The heap contains the largest min(k, seen) values; its root is the smallest retained value.",
      recognize:
        "Top K, kth largest, bounded leaderboards, and merging sorted lists.",
      pitfall:
        "For largest-k selection use a min-heap. A heap is partially ordered, not a sorted array.",
      note: "Duplicates count as separate values. The final answer is displayed in heap order.",
      presets: [
        { name: "Duplicate leaders", values: [9, 9, 2, 8, 1, 9], parameter: 3 },
        { name: "Keep everything", values: [5, 1, 4, 2], parameter: 4 },
      ],
    },
  ),
  linked: lesson(
    "Reverse linked list",
    "Turn every arrow around.",
    "Save the next node, reverse one pointer, and move the boundary between the two lists.",
    "Lists & trees",
    "O(n)",
    "O(1)",
    [10, 20, 30, 40, 50],
    null,
    {
      invariant:
        "prev heads the reversed prefix; current heads the untouched suffix.",
      recognize:
        "Pointer rewiring, reversing a sublist, palindrome lists, and reversing groups.",
      pitfall:
        "Save current.next before overwriting it, or the rest of the list becomes unreachable.",
      note: "Node IDs stay fixed in the diagram so you can follow the changing links.",
      presets: [
        { name: "Single node", values: [42] },
        { name: "Two nodes", values: [1, 2] },
      ],
    },
  ),
  tree: lesson(
    "Binary tree · Inorder",
    "Visit left. Visit the node. Visit right.",
    "Use an explicit stack to remember ancestors while traversing a binary tree.",
    "Lists & trees",
    "O(n)",
    "O(h)",
    [8, 4, 12, 2, 6, 10, 14],
    null,
    {
      invariant:
        "The stack remembers ancestors whose left subtree is being explored.",
      recognize:
        "Tree traversal, BST validation, kth-smallest in a BST, and iterative recursion.",
      pitfall:
        "Inorder produces sorted values only for a valid binary search tree. Arbitrary binary trees need not be sorted.",
      note: "Input is level order in a complete binary tree. h is tree height; no empty child slots are used here.",
      presets: [
        { name: "Not a BST", values: [1, 2, 3, 4, 5, 6, 7] },
        { name: "Single root", values: [7] },
      ],
    },
  ),
  coins: lesson(
    "Coin change",
    "Build an answer one amount at a time.",
    "Find the fewest coins for an amount, with unlimited use of each denomination.",
    "DP & backtracking",
    "O(amount × coins)",
    "O(amount)",
    [1, 3, 4],
    { label: "Amount", value: 6, min: 0, max: 30 },
    {
      invariant:
        "Before solving total, every smaller amount already has its optimal answer.",
      recognize:
        "Unbounded choices, minimum-step DP, and counting or optimizing combinations.",
      pitfall:
        "Unreachable states must stay infinite. Greedy largest-first fails for denominations such as 1, 3, 4.",
      note: "Unlike 0/1 knapsack, a denomination can be used repeatedly.",
      presets: [
        { name: "Impossible amount", values: [2, 4], parameter: 7 },
        { name: "Zero amount", values: [1, 3, 4], parameter: 0 },
      ],
    },
  ),
  subsets: lesson(
    "Backtracking · Subsets",
    "Choose. Explore. Undo.",
    "Build the power set while watching the recursion path grow and shrink.",
    "DP & backtracking",
    "O(n × 2ⁿ)",
    "O(n) auxiliary",
    [1, 2, 3],
    null,
    {
      invariant:
        "The current path uses increasing indices; each subset appears once.",
      recognize:
        "Subsets, combinations, permutations, constraint search, and decision trees.",
      pitfall:
        "Copy the path when recording an answer, and undo each choice before exploring the next branch.",
      note: "Inputs must be distinct. Up to 8 values keeps the 2ⁿ answers inspectable. Output storage is O(n × 2ⁿ).",
      presets: [
        { name: "Four choices", values: [1, 2, 3, 4] },
        { name: "One choice", values: [7] },
      ],
    },
  ),
  topo: lesson(
    "Topological sort",
    "Take the courses that are ready.",
    "Remove satisfied prerequisites and detect when a directed cycle prevents a complete schedule.",
    "Graphs",
    "O(V + E)",
    "O(V + E)",
    [0, 1, 2, 3, 4, 5],
    { label: "Number of courses", value: 6, min: 2, max: 8 },
    {
      invariant:
        "Every queued node has zero incoming edges from unprocessed nodes.",
      recognize:
        "Course schedules, dependency ordering, build systems, and directed cycle detection.",
      pitfall:
        "If fewer than V nodes are processed, a cycle remains. More than one valid topological order may exist.",
      note: "An edge 0>1 means course 0 is a prerequisite of course 1.",
      edges: "0>1, 0>2, 1>3, 2>3, 3>4, 2>5",
      presets: [
        {
          name: "Directed cycle",
          values: [0, 1, 2, 3],
          parameter: 4,
          edges: "0>1, 1>2, 2>0, 2>3",
        },
        {
          name: "Independent courses",
          values: [0, 1, 2, 3],
          parameter: 4,
          edges: "",
        },
      ],
    },
  ),
};

export const interviewGroups = [
  "Arrays & searching",
  "Sorting & stacks",
  "Lists & trees",
  "DP & backtracking",
];
