import {
  binarySearch,
  twoPointers,
  slidingWindow,
  hashTwoSum,
  monotonicStack,
} from "./array-patterns.js";
import { mergeSort, topK } from "./sorting.js";
import { reverseList, inorderTree, topologicalSort } from "./structures.js";
import { coinChange, subsets } from "./dynamic-patterns.js";
import { decodeTree } from "./tree-input.js";
export const SORT_MIN = 0,
  SORT_MAX = 100;
export const interviewSolvers = {
  binary: binarySearch,
  pointers: twoPointers,
  window: slidingWindow,
  hashing: hashTwoSum,
  merge: mergeSort,
  stack: monotonicStack,
  heap: topK,
  linked: reverseList,
  tree: inorderTree,
  coins: coinChange,
  subsets,
};
function readArray(text, label) {
  let parsed;
  try {
    parsed = JSON.parse(text.trim().startsWith("[") ? text : `[${text}]`);
  } catch {
    throw new Error(`Enter ${label} as an array, for example [1,2,3].`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${label} must be an array.`);
  return parsed;
}
export function parseProblem(id, text, parameter, edgeText = "[]") {
  if (id === "topo") {
    if (!Number.isInteger(parameter) || parameter < 1 || parameter > 8)
      throw new Error("Use 1–8 courses.");
    const pairs = readArray(edgeText || "[]", "prerequisites");
    if (
      pairs.some(
        (p) =>
          !Array.isArray(p) ||
          p.length !== 2 ||
          p.some((n) => !Number.isInteger(n) || n < 0 || n >= parameter),
      )
    )
      throw new Error(
        `Each prerequisite must be [course, prerequisite] with IDs 0–${parameter - 1}.`,
      );
    const edges = pairs.map(([course, prerequisite]) => [prerequisite, course]);
    if (new Set(edges.map((e) => e.join(">"))).size !== edges.length)
      throw new Error("Remove duplicate prerequisites.");
    return {
      values: Array.from({ length: parameter }, (_, i) => i),
      parameter,
      edges,
    };
  }
  const values = readArray(text, "input"),
    max = id === "subsets" ? 8 : id === "tree" ? 31 : 16,
    canEmpty = ["linked", "tree"].includes(id);
  if (
    (!values.length && !canEmpty) ||
    values.length > max ||
    values.some(
      (n) =>
        !(id === "tree" && n === null) &&
        (!Number.isInteger(n) || n < -100 || n > 100),
    )
  )
    throw new Error(
      `Enter ${canEmpty ? "0" : "1"}–${max} integers from −100 to 100${id === "tree" ? ", with null for missing children" : ""}.`,
    );
  if (id === "merge" && values.some((n) => n < SORT_MIN || n > SORT_MAX))
    throw new Error(
      `Sorting values must be between ${SORT_MIN} and ${SORT_MAX} so every bar stays readable.`,
    );
  if (
    ["binary", "pointers"].includes(id) &&
    values.some(
      (n, i) =>
        i > 0 && (id === "binary" ? n <= values[i - 1] : n < values[i - 1]),
    )
  )
    throw new Error(
      id === "binary"
        ? "nums must be strictly increasing. The editor does not reorder your indices."
        : "numbers must be sorted in non-decreasing order.",
    );
  if (id === "tree") {
    const nodes = decodeTree(values);
    if (nodes.length > 15 || nodes.some((n) => n.depth > 5))
      throw new Error(
        "Use at most 15 tree nodes and 6 levels for a readable diagram.",
      );
  }
  if (id === "subsets" && new Set(values).size !== values.length)
    throw new Error("Use distinct values for subsets.");
  if (id === "coins" && values.some((n) => n <= 0))
    throw new Error("Coin denominations must be positive integers.");
  if (id === "stack" && values.some((n) => n < 30 || n > 100))
    throw new Error("Daily Temperatures accepts values from 30 to 100.");
  if (
    ["window", "heap"].includes(id) &&
    (!Number.isInteger(parameter) || parameter < 1 || parameter > values.length)
  )
    throw new Error("Choose k between 1 and the number of values.");
  if (
    ["binary", "pointers", "hashing", "coins"].includes(id) &&
    !Number.isInteger(parameter)
  )
    throw new Error("Enter an integer parameter.");
  if (id === "coins" && (parameter < 0 || parameter > 30))
    throw new Error("Amount must be between 0 and 30.");
  return { values, parameter };
}
export function runInterview(id, problem) {
  const { values, parameter } = problem;
  let run;
  if (id === "topo") run = topologicalSort(parameter, problem.edges);
  else if (id === "binary" || id === "pointers")
    run = interviewSolvers[id](values, parameter, { presorted: true });
  else if (id === "stack") run = monotonicStack(values, { days: true });
  else run = interviewSolvers[id](values, parameter);
  const last = run.events.at(-1);
  // Present the judge's return value while retaining auxiliary visual state.
  if (id === "pointers") {
    run.result = run.result.map((i) => i + 1);
    run.code[3] = "  if sum == target: return [left + 1, right + 1]";
    last.message += " Return one-based positions.";
  }
  if (id === "window") {
    run.result = run.result.sum / parameter;
    run.code[6] = "return best / k  // maximum average";
    last.message += ` Average = ${run.result}.`;
  }
  if (id === "heap") {
    run.result = run.result[0];
    run.code[6] = "return heap[0]  // kth largest value";
    last.message += ` The kth largest is ${run.result}.`;
  }
  if (id === "coins") {
    run.result = run.result.count;
    run.code[7] = "recover coins for explanation; return dp[amount]";
    run.code[6] = "if dp[amount] is infinity: return -1";
  }
  if (id === "topo") {
    run.result = run.result ?? [];
    run.code[6] = "if length(order) < V: return []  // cycle";
  }
  last.result = run.result;
  return run;
}
