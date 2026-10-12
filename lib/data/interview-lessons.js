import { advancedLessons } from "./advanced-lessons.js";
export const interviewLessons = {
  ...advancedLessons,
  binary: {
    label: "Binary search",
    title: "Cut the search space in half.",
    subtitle:
      "Track the shrinking interval and prove why the target can only be inside it.",
    topic: "Arrays & searching",
    complexity: "O(log n)",
    space: "O(1)",
    values: [-1, 0, 3, 5, 9, 12],
    parameter: {
      label: "target",
      value: 9,
      min: -99,
      max: 99,
    },
    tag: "INTERVIEW PATTERNS",
    invariant: "If the target exists, it remains inside [left, right].",
    recognize:
      "Sorted search spaces, first/last occurrence, and monotonic feasibility checks.",
    pitfall:
      "Discard mid after comparing it; otherwise the interval may never shrink. This example returns any matching occurrence.",
    note: "nums must already be sorted in strictly increasing order. The editor validates it without changing indices.",
    presets: [
      {
        name: "Target absent",
        values: [-1, 0, 3, 5, 9, 12],
        parameter: 2,
      },
    ],
    problem: {
      number: 704,
      name: "Binary Search",
      url: "https://leetcode.com/problems/binary-search/",
      input: "nums",
      parameter: "target",
      task: "Find target in a sorted array. Return its zero-based index, or -1 if it is absent.",
      explanation: "The value 9 is at index 4.",
      expected: 4,
    },
  },
  pointers: {
    label: "Two pointers",
    title: "Bring two ends together.",
    subtitle:
      "Find a target pair in a sorted array without checking every possible pair.",
    topic: "Arrays & searching",
    complexity: "O(n)",
    space: "O(1)",
    values: [2, 7, 11, 15],
    parameter: {
      label: "target",
      value: 9,
      min: -198,
      max: 198,
    },
    tag: "INTERVIEW PATTERNS",
    invariant:
      "Values outside the two pointers cannot complete a valid pair with the remaining candidates.",
    recognize:
      "Pair sums in sorted arrays, palindrome checks, and in-place compaction.",
    pitfall:
      "Move only the pointer justified by the sum, and convert both indices to one-based positions when returning.",
    note: "numbers must be sorted. Diagram pointers use zero-based indices; the returned answer uses one-based positions, as in Two Sum II.",
    presets: [
      {
        name: "Skip the middle",
        values: [2, 3, 4],
        parameter: 6,
      },
      {
        name: "Negative pair",
        values: [-1, 0],
        parameter: -1,
      },
    ],
    problem: {
      number: 167,
      name: "Two Sum II",
      url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      input: "numbers",
      parameter: "target",
      task: "Find two distinct entries in a sorted array that add to target. Return their one-based positions.",
      explanation: "2 + 7 = 9, so return positions [1,2].",
      expected: [1, 2],
    },
  },
  window: {
    label: "Sliding window",
    title: "Reuse the work inside the window.",
    subtitle:
      "Track a window of exactly k values and find its maximum average.",
    topic: "Arrays & searching",
    complexity: "O(n)",
    space: "O(1)",
    values: [1, 12, -5, -6, 50, 3],
    parameter: {
      label: "k",
      value: 4,
      min: 1,
      max: 16,
    },
    tag: "INTERVIEW PATTERNS",
    invariant:
      "After removing the outgoing value, sum equals the sum of the current window.",
    recognize:
      "Contiguous subarrays and substrings with fixed length or a maintainable condition.",
    pitfall:
      "Only compare full windows. Initialize the best sum to negative infinity so all-negative arrays work.",
    note: "For a fixed k, maximizing the sum also maximizes the average. Return best sum / k.",
    presets: [
      {
        name: "Single value",
        values: [5],
        parameter: 1,
      },
      {
        name: "All negative",
        values: [-5, -2, -7, -1, -4],
        parameter: 2,
      },
    ],
    problem: {
      number: 643,
      name: "Maximum Average Subarray I",
      url: "https://leetcode.com/problems/maximum-average-subarray-i/",
      input: "nums",
      parameter: "k",
      task: "Find the largest average among all contiguous subarrays of exactly k elements.",
      explanation:
        "The window [12,-5,-6,50] has sum 51 and average 51 / 4 = 12.75.",
      expected: 12.75,
    },
  },
  hashing: {
    label: "Hash map · Two Sum",
    title: "Remember the missing half.",
    subtitle:
      "Look up the complement in a map and keep the original array order.",
    topic: "Arrays & searching",
    complexity: "O(n) expected",
    space: "O(n)",
    values: [2, 7, 11, 15],
    parameter: {
      label: "target",
      value: 9,
      min: -198,
      max: 198,
    },
    tag: "INTERVIEW PATTERNS",
    invariant: "The map contains only indices before the current index.",
    recognize:
      "Complement lookup, counting frequencies, duplicate detection, and prefix-sum maps.",
    pitfall:
      "Look up before inserting, so one element is never paired with itself. Duplicate values can still form a valid pair.",
    note: "Expected time assumes efficient map operations. No sorting is performed.",
    presets: [
      {
        name: "Unsorted input",
        values: [3, 2, 4],
        parameter: 6,
      },
      {
        name: "Duplicate pair",
        values: [3, 3],
        parameter: 6,
      },
    ],
    problem: {
      number: 1,
      name: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      input: "nums",
      parameter: "target",
      task: "Find two distinct indices whose values add to target. Keep the original array order.",
      explanation: "nums[0] + nums[1] = 2 + 7 = 9.",
      expected: [0, 1],
    },
  },
  merge: {
    label: "Merge sort",
    title: "Split. Sort. Reassemble.",
    subtitle:
      "Watch recursive ranges become sorted runs, then merge them into one answer.",
    topic: "Sorting algorithms",
    complexity: "O(n log n)",
    space: "O(n)",
    values: [5, 2, 3, 1],
    parameter: null,
    tag: "INTERVIEW PATTERNS",
    invariant:
      "Each merge reads two sorted halves and produces one sorted range.",
    recognize:
      "Stable sorting, divide and conquer, inversion counting, and merging ordered streams.",
    pitfall:
      "Copy the merged buffer back only after reading both halves. Taking the left value on a tie preserves stability.",
    note: "Visualization limits: 1–16 integers from 0 to 100. Small and zero values keep a visible minimum bar height. These limits are narrower than LeetCode’s.",
    presets: [
      {
        name: "Duplicates and zeros",
        values: [5, 1, 1, 2, 0, 0],
      },
      {
        name: "Mixed heights",
        values: [100, 1, 75, 20, 50, 5],
      },
    ],
    problem: {
      number: 912,
      name: "Sort an Array",
      url: "https://leetcode.com/problems/sort-an-array/",
      input: "nums",
      task: "Sort nums in ascending order with merge sort. Compare bar heights as the sorted runs are merged.",
      explanation: "Merge [2,5] with [1,3] to obtain [1,2,3,5].",
      expected: [1, 2, 3, 5],
    },
  },
  stack: {
    label: "Monotonic stack",
    title: "Let the next value resolve the past.",
    subtitle:
      "Use a monotonic stack to find how many days each temperature waits for a warmer day.",
    topic: "Stacks & heaps",
    complexity: "O(n)",
    space: "O(n)",
    values: [73, 74, 75, 71, 69, 72, 76, 73],
    parameter: null,
    tag: "INTERVIEW PATTERNS",
    invariant:
      "Stack values are non-increasing; their next-greater answers are unresolved.",
    recognize:
      "Next greater element, daily temperatures, stock spans, and histogram boundaries.",
    pitfall:
      "Return waiting days, not temperatures. Equal temperatures do not count as warmer.",
    note: "Store day indices. When a warmer day arrives, the answer is current index − saved index. Unresolved answers remain 0.",
    presets: [
      {
        name: "Increasing temperatures",
        values: [30, 40, 50, 60],
      },
      {
        name: "No warmer day",
        values: [90, 80, 70, 60],
      },
    ],
    problem: {
      number: 739,
      name: "Daily Temperatures",
      url: "https://leetcode.com/problems/daily-temperatures/",
      input: "temperatures",
      task: "For each day, return how many days until a warmer temperature. Use 0 when there is no warmer day ahead.",
      explanation:
        "The day with temperature 75 waits four days for 76. The last two days have no warmer day ahead.",
      expected: [1, 1, 4, 2, 1, 1, 0, 0],
    },
  },
  heap: {
    label: "Min-heap · Kth largest",
    title: "Keep the strongest k candidates.",
    subtitle:
      "Use a small heap to retain the largest k values while scanning an unsorted array.",
    topic: "Stacks & heaps",
    complexity: "O(n log(k + 1))",
    space: "O(k)",
    values: [3, 2, 1, 5, 6, 4],
    parameter: {
      label: "k",
      value: 2,
      min: 1,
      max: 16,
    },
    tag: "INTERVIEW PATTERNS",
    invariant:
      "The heap contains the largest min(k, seen) values; its root is the smallest retained value.",
    recognize:
      "Top K, kth largest, bounded leaderboards, and merging sorted lists.",
    pitfall:
      "For largest-k selection use a min-heap. A heap is partially ordered, not a sorted array.",
    note: "The heap holds k candidates, not a sorted list. Its minimum is the kth largest value in the full input.",
    presets: [
      {
        name: "Duplicates count",
        values: [3, 2, 3, 1, 2, 4, 5, 5, 6],
        parameter: 4,
      },
    ],
    problem: {
      number: 215,
      name: "Kth Largest Element in an Array",
      url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
      input: "nums",
      parameter: "k",
      task: "Return the kth largest value, counting duplicates separately. Keep the largest k values in a min-heap.",
      explanation:
        "The two largest values are 6 and 5. The heap root gives the second largest: 5.",
      expected: 5,
    },
  },
  linked: {
    label: "Reverse linked list",
    title: "Turn every arrow around.",
    subtitle:
      "Save the next node, reverse one pointer, and move the boundary between the two lists.",
    topic: "Lists & trees",
    complexity: "O(n)",
    space: "O(1)",
    values: [1, 2, 3, 4, 5],
    parameter: null,
    tag: "INTERVIEW PATTERNS",
    invariant:
      "prev heads the reversed prefix; current heads the untouched suffix.",
    recognize:
      "Pointer rewiring, reversing a sublist, palindrome lists, and reversing groups.",
    pitfall:
      "Save current.next before overwriting it, or the rest of the list becomes unreachable.",
    note: "Node IDs stay fixed in the diagram so you can follow the changing links.",
    presets: [
      {
        name: "Two nodes",
        values: [1, 2],
      },
      {
        name: "Empty list",
        values: [],
      },
    ],
    problem: {
      number: 206,
      name: "Reverse Linked List",
      url: "https://leetcode.com/problems/reverse-linked-list/",
      input: "head",
      task: "Reverse the next pointers of the linked list and return its new head.",
      explanation: "The chain 1 → 2 → 3 → 4 → 5 becomes 5 → 4 → 3 → 2 → 1.",
      expected: [5, 4, 3, 2, 1],
    },
  },
  tree: {
    label: "Binary tree · Inorder",
    title: "Visit left. Visit the node. Visit right.",
    subtitle:
      "Use an explicit stack to remember ancestors while traversing a binary tree.",
    topic: "Lists & trees",
    complexity: "O(n)",
    space: "O(h)",
    values: [1, null, 2, 3],
    parameter: null,
    tag: "INTERVIEW PATTERNS",
    invariant:
      "The stack remembers ancestors whose left subtree is being explored.",
    recognize:
      "Tree traversal, BST validation, kth-smallest in a BST, and iterative recursion.",
    pitfall:
      "Inorder produces sorted values only for a valid binary search tree. Arbitrary binary trees need not be sorted.",
    note: "Use level-order input such as [1,null,2,3]. Missing child slots are null. Inorder is sorted only for a valid BST.",
    presets: [
      {
        name: "Balanced tree",
        values: [4, 2, 6, 1, 3, 5, 7],
      },
      {
        name: "Empty tree",
        values: [],
      },
    ],
    problem: {
      number: 94,
      name: "Binary Tree Inorder Traversal",
      url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
      input: "root",
      task: "Return the values visited in left → node → right order. Input uses level-order serialization with null for missing children.",
      explanation:
        "Root 1 has right child 2; node 2 has left child 3. The visit order is [1,3,2].",
      expected: [1, 3, 2],
    },
  },
  coins: {
    label: "Coin change",
    title: "Build an answer one amount at a time.",
    subtitle:
      "Find the fewest coins for an amount, with unlimited use of each denomination.",
    topic: "DP & backtracking",
    complexity: "O(amount × coins)",
    space: "O(amount)",
    values: [1, 2, 5],
    parameter: {
      label: "amount",
      value: 11,
      min: 0,
      max: 30,
    },
    tag: "INTERVIEW PATTERNS",
    invariant:
      "Before solving total, every smaller amount already has its optimal answer.",
    recognize:
      "Unbounded choices, minimum-step DP, and counting or optimizing combinations.",
    pitfall:
      "Unreachable states must stay infinite. Greedy largest-first fails for denominations such as 1, 3, 4.",
    note: "Unlike 0/1 knapsack, a denomination can be used repeatedly.",
    presets: [
      {
        name: "Impossible amount",
        values: [2],
        parameter: 3,
      },
      {
        name: "Greedy fails",
        values: [1, 3, 4],
        parameter: 6,
      },
      {
        name: "Zero amount",
        values: [1],
        parameter: 0,
      },
    ],
    problem: {
      number: 322,
      name: "Coin Change",
      url: "https://leetcode.com/problems/coin-change/",
      input: "coins",
      parameter: "amount",
      task: "Return the minimum number of coins needed for amount. Coins can be reused; return -1 when no combination works.",
      explanation: "11 = 5 + 5 + 1, using three coins.",
      expected: 3,
    },
  },
  subsets: {
    label: "Backtracking · Subsets",
    title: "Choose. Explore. Undo.",
    subtitle:
      "Build the power set while watching the recursion path grow and shrink.",
    topic: "DP & backtracking",
    complexity: "O(n × 2ⁿ)",
    space: "O(n) auxiliary",
    values: [1, 2, 3],
    parameter: null,
    tag: "INTERVIEW PATTERNS",
    invariant:
      "The current path uses increasing indices; each subset appears once.",
    recognize:
      "Subsets, combinations, permutations, constraint search, and decision trees.",
    pitfall:
      "Copy the path when recording an answer, and undo each choice before exploring the next branch.",
    note: "Inputs must be distinct. Up to 8 values keeps the 2ⁿ answers inspectable. Output storage is O(n × 2ⁿ).",
    presets: [
      {
        name: "One element",
        values: [0],
      },
      {
        name: "Four elements",
        values: [1, 2, 3, 4],
      },
    ],
    problem: {
      number: 78,
      name: "Subsets",
      url: "https://leetcode.com/problems/subsets/",
      input: "nums",
      task: "Return every subset of the distinct input values. The empty subset is included; output order does not matter.",
      explanation:
        "Three distinct choices produce eight subsets. Each recursive return undoes one choice.",
      expected: [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]],
    },
  },
  topo: {
    label: "Topological sort",
    title: "Take the courses that are ready.",
    subtitle:
      "Remove satisfied prerequisites and detect when a directed cycle prevents a complete schedule.",
    topic: "Graphs",
    complexity: "O(V + E)",
    space: "O(V + E)",
    values: [0, 1, 2, 3],
    parameter: {
      label: "numCourses",
      value: 4,
      min: 1,
      max: 8,
    },
    tag: "INTERVIEW PATTERNS",
    invariant:
      "Every queued node has zero incoming edges from unprocessed nodes.",
    recognize:
      "Course schedules, dependency ordering, build systems, and directed cycle detection.",
    pitfall:
      "If fewer than V nodes are processed, a cycle remains. More than one valid topological order may exist.",
    note: "prerequisites uses [course, prerequisite]. The diagram draws the arrow prerequisite → course. Multiple valid orders are possible.",
    edges: "[[1,0],[2,0],[3,1],[3,2]]",
    presets: [
      {
        name: "Directed cycle",
        values: [0, 1],
        parameter: 2,
        edges: "[[1,0],[0,1]]",
      },
      {
        name: "One prerequisite",
        values: [0, 1],
        parameter: 2,
        edges: "[[1,0]]",
      },
    ],
    problem: {
      number: 210,
      name: "Course Schedule II",
      url: "https://leetcode.com/problems/course-schedule-ii/",
      input: "prerequisites",
      parameter: "numCourses",
      task: "Return an order in which all courses can be completed. A pair [a,b] means take b before a. Return [] if a cycle prevents completion.",
      explanation: "Take course 0 first, then 1 and 2 in either order, then 3.",
      expected: [0, 1, 2, 3],
    },
  },
};
