import { recorder } from "./recorder.js";

export function validateLab(id, raw) {
  const p = typeof raw === "string" ? JSON.parse(raw) : structuredClone(raw);
  if (!p || typeof p !== "object" || Array.isArray(p))
    throw new Error("Enter a JSON object with the named inputs.");
  const nums = (a, min = -100, max = 100) =>
    Array.isArray(a) &&
    a.length > 0 &&
    a.length <= 20 &&
    a.every((x) => Number.isInteger(x) && x >= min && x <= max);
  if (
    id === "trie" &&
    !(
      Array.isArray(p.words) &&
      p.words.length > 0 &&
      p.words.length <= 8 &&
      p.words.every((w) => /^[a-z]{1,8}$/.test(w)) &&
      /^[a-z]{1,8}$/.test(p.prefix)
    )
  )
    throw new Error("Use 1–8 lowercase words and a prefix, each 1–8 letters.");
  if (
    id === "intervals" &&
    !(
      Array.isArray(p.intervals) &&
      p.intervals.length > 0 &&
      p.intervals.length <= 10 &&
      p.intervals.every(
        (a) =>
          Array.isArray(a) &&
          a.length === 2 &&
          a.every((x) => Number.isInteger(x) && x >= 0 && x <= 30) &&
          a[0] <= a[1],
      )
    )
  )
    throw new Error(
      "Use 1–10 [start,end] intervals with 0 ≤ start ≤ end ≤ 30.",
    );
  if (
    id === "topk" &&
    !(
      nums(p.nums) &&
      Number.isInteger(p.k) &&
      p.k >= 1 &&
      p.k <= new Set(p.nums).size
    )
  )
    throw new Error(
      "Use 1–20 integers from −100 to 100; k must fit the number of distinct values.",
    );
  if (
    id === "lcs" &&
    ![p.text1, p.text2].every(
      (s) => typeof s === "string" && /^[a-z]{0,10}$/i.test(s),
    )
  )
    throw new Error(
      "Use strings of at most 10 letters. Empty strings are allowed.",
    );
  if (id === "queens" && !(Number.isInteger(p.n) && p.n >= 1 && p.n <= 6))
    throw new Error("Choose n from 1 to 6.");
  if (id === "sudoku") {
    if (!(
      Array.isArray(p.board) &&
      p.board.length === 9 &&
      p.board.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 9 &&
          row.every((v) => Number.isInteger(v) && v >= 0 && v <= 9),
      )
    ))
      throw new Error("Use a 9×9 board, with 0 for empty cells.");
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (p.board[r][c]) {
          const v = p.board[r][c];
          p.board[r][c] = 0;
          if (!sudokuAllowed(p.board, r, c, v))
            throw new Error(
              "The given digits conflict in a row, column, or 3×3 box.",
            );
          p.board[r][c] = v;
        }
    if (p.board.flat().filter((v) => !v).length > 24)
      throw new Error(
        "Keep at most 24 empty cells so the full visual trace stays bounded.",
      );
  }
  if (
    id === "lowerbound" &&
    !(
      nums(p.nums) &&
      p.nums.every((v, i) => !i || v >= p.nums[i - 1]) &&
      Number.isInteger(p.target) &&
      Math.abs(p.target) <= 100
    )
  )
    throw new Error(
      "Use sorted numbers and an integer target, all between −100 and 100.",
    );
  if (
    id === "capacity" &&
    !(
      nums(p.weights, 1, 100) &&
      Number.isInteger(p.days) &&
      p.days >= 1 &&
      p.days <= p.weights.length
    )
  )
    throw new Error(
      "Use 1–20 positive weights up to 100; days must be between 1 and the number of packages.",
    );
  return p;
}
export function sudokuAllowed(board, r, c, v) {
  for (let i = 0; i < 9; i++)
    if (
      board[r][i] === v ||
      board[i][c] === v ||
      board[3 * Math.floor(r / 3) + Math.floor(i / 3)][
        3 * Math.floor(c / 3) + (i % 3)
      ] === v
    )
      return false;
  return true;
}
export function runLab(id, p) {
  const codes = {
    trie: [
      "root = new Node()",
      "for word in words: walk/create one edge per letter; mark terminal",
      "walk each letter of prefix from root",
      "return whether the entire prefix path exists",
    ],
    intervals: [
      "sort intervals by start",
      "for [start,end] in intervals:",
      "  if result empty or start > last.end: append interval",
      "  else: last.end = max(last.end, end)",
      "return result",
    ],
    topk: [
      "count each value in a hash map",
      "buckets = lists indexed by frequency",
      "put each distinct value in bucket[count[value]]",
      "scan buckets from highest frequency down",
      "return first k values",
    ],
    lcs: [
      "dp[0][*] = dp[*][0] = 0",
      "for i in 1..m, j in 1..n:",
      "  if a[i-1] == b[j-1]: dp[i][j] = dp[i-1][j-1] + 1",
      "  else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
      "trace backward to recover one subsequence",
      "return dp[m][n]",
    ],
    queens: [
      "place(row): if row == n: save solution",
      "for column in 0..n-1:",
      "  if column or diagonal occupied: prune",
      "  place queen; place(row+1)",
      "  remove queen // undo",
      "return solutions",
    ],
    sudoku: [
      "choose an empty cell with fewest legal candidates",
      "if no empty cell remains: return true",
      "for candidate in legal candidates:",
      "  place candidate; if solve(): return true",
      "  clear cell // undo",
      "return false if every candidate fails",
    ],
    lowerbound: [
      "lo = 0; hi = n // half-open interval",
      "while lo < hi: mid = floor((lo+hi)/2)",
      "  if nums[mid] < target: lo = mid+1",
      "  else: hi = mid",
      "return lo // may equal n",
    ],
    capacity: [
      "lo = max(weights); hi = sum(weights)",
      "while lo < hi: mid = floor((lo+hi)/2)",
      "  pack in order; count days needed with capacity mid",
      "  if needed <= days: hi = mid",
      "  else: lo = mid+1",
      "return lo",
    ],
  };
  if (!codes[id]) throw new Error("Unknown algorithm");
  const r = recorder(codes[id]);
  let state = { vars: {}, active: [] };
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, { ...state, ...extra });
  let result;
  if (id === "trie") {
    const nodes = [{ text: "root", parent: -1, terminal: false }];
    const children = [{}];
    state = { ...state, nodes };
    emit(0, "Begin at the root.");
    for (const word of p.words) {
      let node = 0;
      for (const letter of word) {
        if (children[node][letter] === undefined) {
          children[node][letter] = nodes.length;
          nodes.push({ text: letter, parent: node, terminal: false });
          children.push({});
        }
        node = children[node][letter];
        emit(1, `Insert ${word}: follow ${letter}.`, {
          active: [node],
          vars: { word, letter },
        });
      }
      nodes[node].terminal = true;
      emit(1, `Mark ${word} as a complete word.`, { active: [node] });
    }
    let node = 0;
    result = true;
    for (const letter of p.prefix) {
      if (children[node][letter] === undefined) {
        result = false;
        emit(2, `No ${letter} edge exists here.`, { active: [node] });
        break;
      }
      node = children[node][letter];
      emit(2, `Follow prefix letter ${letter}.`, { active: [node] });
    }
    emit(
      3,
      `startsWith(${p.prefix}) = ${result}. A prefix need not end at a terminal node.`,
      { done: true, result },
    );
  } else if (id === "intervals") {
    const sorted = p.intervals.map((a) => [...a]).sort((a, b) => a[0] - b[0]);
    const merged = [];
    state = { ...state, intervals: sorted, merged };
    emit(0, "Sort by start while preserving the original input.");
    sorted.forEach(([a, b], i) => {
      emit(1, `Inspect [${a},${b}].`, { active: [i] });
      if (!merged.length || a > merged.at(-1)[1]) {
        merged.push([a, b]);
        emit(2, "Start a disjoint interval.", { active: [i] });
      } else {
        merged.at(-1)[1] = Math.max(merged.at(-1)[1], b);
        emit(3, "Extend the overlapping interval.", { active: [i] });
      }
    });
    result = merged;
    emit(4, "All overlaps have been merged.", { done: true, result });
  } else if (id === "topk") {
    const counts = {};
    state = { ...state, counts, output: [] };
    for (const v of p.nums) {
      counts[v] = (counts[v] || 0) + 1;
      emit(0, `Frequency of ${v} is ${counts[v]}.`, { vars: { value: v } });
    }
    const buckets = Array.from({ length: p.nums.length + 1 }, () => []);
    emit(1, "Allocate buckets from 0 to n.");
    Object.entries(counts).forEach(([v, c]) => {
      buckets[c].push(+v);
      emit(2, `Put ${v} into frequency bucket ${c}.`, {
        vars: { frequency: c },
      });
    });
    for (let f = buckets.length - 1; f >= 1 && state.output.length < p.k; f--) {
      for (const v of buckets[f]) {
        state.output.push(v);
        emit(3, `Take ${v} from frequency ${f}.`, { vars: { frequency: f } });
        if (state.output.length === p.k) break;
      }
    }
    result = state.output;
    emit(
      4,
      "Return k most frequent values. Ties use numeric key order in this teaching implementation.",
      { done: true, result },
    );
  } else if (id === "lcs") {
    const a = p.text1,
      b = p.text2,
      dp = Array.from({ length: a.length + 1 }, () =>
        Array(b.length + 1).fill(0),
      );
    state = {
      ...state,
      matrix: dp,
      rowLabels: ["∅", ...a],
      colLabels: ["∅", ...b],
    };
    emit(0, "Empty prefixes share no characters.");
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1] + 1
            : Math.max(dp[i - 1][j], dp[i][j - 1]);
        emit(
          a[i - 1] === b[j - 1] ? 2 : 3,
          `Compare ${a[i - 1]} and ${b[j - 1]}; best length is ${dp[i][j]}.`,
          { cell: [i, j], vars: { i, j } },
        );
      }
    let i = a.length,
      j = b.length,
      word = "";
    while (i && j) {
      if (a[i - 1] === b[j - 1]) {
        word = a[--i] + word;
        --j;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
      else j--;
      emit(4, `Recover subsequence: ${word || "empty so far"}.`, {
        cell: [i, j],
        vars: { subsequence: word },
      });
    }
    result = dp[a.length][b.length];
    emit(5, `One longest common subsequence is “${word}”.`, {
      done: true,
      result,
      vars: { subsequence: word },
    });
  } else if (id === "queens") {
    const board = Array.from({ length: p.n }, () => Array(p.n).fill(""));
    state = { ...state, matrix: board };
    const positions = [],
      solutions = [];
    function search(row) {
      if (row === p.n) {
        solutions.push([...positions]);
        emit(0, `Save solution ${solutions.length}.`, {
          vars: { solutions: solutions.length },
        });
        return;
      }
      for (let col = 0; col < p.n; col++) {
        emit(1, `Try row ${row}, column ${col}.`, { cell: [row, col] });
        if (
          positions.some((c, r) => c === col || Math.abs(c - col) === row - r)
        ) {
          emit(2, "Prune: an earlier queen attacks this square.", {
            cell: [row, col],
          });
          continue;
        }
        positions.push(col);
        board[row][col] = "♛";
        emit(3, "Place a queen and explore the next row.", {
          cell: [row, col],
        });
        search(row + 1);
        positions.pop();
        board[row][col] = "";
        emit(4, "Undo the placement before the next choice.", {
          cell: [row, col],
        });
      }
    }
    search(0);
    result = solutions;
    emit(5, `Found ${solutions.length} solutions.`, {
      done: true,
      result,
      vars: { solutions: solutions.length },
    });
  } else if (id === "sudoku") {
    const board = p.board.map((row) => [...row]);
    state = { ...state, matrix: board };
    let explored = 0;
    function solve() {
      if (++explored > 12000)
        throw new Error(
          "This puzzle exceeds the visual search budget. Add more clues.",
        );
      let best = null,
        options = [];
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 9; col++)
          if (!board[row][col]) {
            const legal = Array.from({ length: 9 }, (_, i) => i + 1).filter(
              (v) => sudokuAllowed(board, row, col, v),
            );
            if (!best || legal.length < options.length) {
              best = [row, col];
              options = legal;
            }
          }
      if (!best) {
        emit(1, "Every cell is filled consistently.");
        return true;
      }
      const [row, col] = best;
      emit(
        0,
        `Choose a constrained cell with ${options.length} candidate(s).`,
        { cell: best, vars: { candidates: options.join(", ") || "none" } },
      );
      for (const value of options) {
        board[row][col] = value;
        emit(3, `Place ${value}, then recurse.`, { cell: best });
        if (solve()) return true;
        board[row][col] = 0;
        emit(4, "Undo a choice that led to a dead end.", { cell: best });
      }
      return false;
    }
    result = solve() ? board.map((row) => [...row]) : null;
    emit(
      result ? 1 : 5,
      result
        ? "Solved the 9×9 puzzle."
        : "No completion exists for these clues.",
      { done: true, result },
    );
  } else {
    const values = id === "lowerbound" ? p.nums : p.weights;
    let lo = id === "lowerbound" ? 0 : Math.max(...values),
      hi =
        id === "lowerbound" ? values.length : values.reduce((a, b) => a + b, 0);
    state = { ...state, values };
    emit(0, "Establish the initial search bounds.", { vars: { lo, hi } });
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      emit(1, `Test midpoint ${mid}.`, {
        active: id === "lowerbound" ? [mid] : [],
        vars: { lo, mid, hi },
      });
      if (id === "lowerbound") {
        if (values[mid] < p.target) {
          lo = mid + 1;
          emit(2, "Exclude values smaller than target.", { vars: { lo, hi } });
        } else {
          hi = mid;
          emit(3, "Keep this possible first qualifying position.", {
            vars: { lo, hi },
          });
        }
      } else {
        let needed = 1,
          load = 0;
        for (const v of values) {
          if (load + v > mid) {
            needed++;
            load = 0;
          }
          load += v;
        }
        emit(2, `Capacity ${mid} needs ${needed} day(s).`, {
          vars: { lo, mid, hi, needed, allowed: p.days },
        });
        if (needed <= p.days) {
          hi = mid;
          emit(3, "Feasible: try a smaller capacity.", { vars: { lo, hi } });
        } else {
          lo = mid + 1;
          emit(4, "Too small: raise the lower bound.", { vars: { lo, hi } });
        }
      }
    }
    result = lo;
    emit(id === "lowerbound" ? 4 : 5, `The first feasible answer is ${lo}.`, {
      done: true,
      result,
      vars: { lo, hi },
    });
  }
  return r.finish(result);
}
