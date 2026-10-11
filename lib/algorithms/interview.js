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

export function parseProblem(id, text, parameter, edgeText = "") {
  if (id === "topo") {
    if (!Number.isInteger(parameter) || parameter < 2 || parameter > 8)
      throw new Error("Use 2–8 courses.");
    const parts = edgeText.trim() ? edgeText.split(",") : [];
    const edges = parts.map((part) => {
      const match = part.trim().match(/^(\d+)\s*>\s*(\d+)$/);
      if (!match) throw new Error("Use directed edges like 0>1, 1>2.");
      const pair = match.slice(1).map(Number);
      if (pair.some((n) => n >= parameter))
        throw new Error(`Course IDs must be 0–${parameter - 1}.`);
      return pair;
    });
    if (new Set(edges.map((e) => e.join(">"))).size !== edges.length)
      throw new Error("Remove duplicate edges.");
    return {
      values: Array.from({ length: parameter }, (_, i) => i),
      parameter,
      edges,
    };
  }
  const parts = text.trim().split(/[\s,]+/),
    values = parts.map(Number),
    max = id === "subsets" ? 8 : id === "tree" ? 15 : 16;
  if (
    !text.trim() ||
    values.length > max ||
    values.some((n) => !Number.isInteger(n) || n < -99 || n > 99)
  )
    throw new Error(
      `Enter 1–${max} integers between −99 and 99, separated by commas.`,
    );
  if (id === "subsets" && new Set(values).size !== values.length)
    throw new Error("Use distinct values for subsets.");
  if (id === "coins" && values.some((n) => n <= 0))
    throw new Error("Coin denominations must be positive integers.");
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
  return id === "topo"
    ? topologicalSort(problem.parameter, problem.edges)
    : interviewSolvers[id](problem.values, problem.parameter);
}
