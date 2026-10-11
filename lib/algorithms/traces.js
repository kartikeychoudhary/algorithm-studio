import { Chess } from "chess.js";
import { winner } from "./tic-tac-toe.js";
import { evaluateChess } from "./chess.js";

export const MINIMAX_CODE = [
  "minimax(position, depth, alpha, beta):",
  "  if terminal(position): return terminal_score",
  "  if depth == 0: return evaluate(position)",
  "  if cached(position, depth): return cached_score",
  "  best = -infinity if MAX else +infinity",
  "  for move in legal_moves(position):",
  "    child = apply(position, move)",
  "    score = minimax(child, depth-1, alpha, beta)",
  "    best = max(best, score) if MAX else min(best, score)",
  "    update alpha (MAX) or beta (MIN) with best",
  "    if beta <= alpha: break  // prune this branch",
  "  cache exact score when no bound is used",
  "  return best",
];
export const KNAPSACK_CODE = [
  "dp[0][w] = 0 for every capacity w",
  "for i = 1 to number_of_items:",
  "  for w = 0 to capacity:",
  "    skip = dp[i-1][w]",
  "    if weight[i] > w: dp[i][w] = skip",
  "    else: take = value[i] + dp[i-1][w-weight[i]]",
  "          dp[i][w] = max(skip, take)",
  "w = capacity; selected = []",
  "for i = number_of_items down to 1:",
  "  if dp[i][w] != dp[i-1][w]:",
  "    selected.add(i); w = w - weight[i]",
  "return dp[number_of_items][capacity], selected",
];

export function traceMinimax({ board, turn = "X", fen, depth = 2 }) {
  const chess = !!fen,
    game = chess ? new Chess(fen) : null;
  const events = [],
    cache = new Map();
  let calls = 0;
  function search(b, player, remaining, ply, alpha, beta) {
    calls++;
    const maximizing = chess ? game.turn() === "w" : player === "X";
    const position = chess ? { fen: game.fen() } : { board: b.slice() };
    const role = maximizing ? "MAX" : "MIN";
    let best = maximizing ? -Infinity : Infinity;
    const emit = (line, message, extra = {}) =>
      events.push({
        line,
        message,
        ...position,
        vars: {
          ply,
          depth: remaining,
          player: role,
          best,
          alpha,
          beta,
          ...extra,
        },
        calls,
      });
    emit(0, `Enter ${role} at depth ${ply}.`);
    const result = chess ? game.isGameOver() : winner(b);
    if (result) {
      const score = chess
        ? evaluateChess(game, ply)
        : result === "X"
          ? 1
          : result === "O"
            ? -1
            : 0;
      emit(1, `Terminal position returns ${score}.`, { score });
      return score;
    }
    if (remaining === 0) {
      const score = evaluateChess(game, ply);
      emit(2, `Search horizon reached; material score = ${score}.`, { score });
      return score;
    }
    const key = chess ? "" : b.map((v) => v || "-").join("") + player;
    if (!chess && cache.has(key)) {
      const score = cache.get(key);
      emit(3, `Reuse the exact score ${score} from an identical position.`, {
        score,
      });
      return score;
    }
    emit(4, `Initialize ${role}'s best score.`);
    const moves = chess
      ? game.moves({ verbose: true })
      : b.flatMap((v, i) => (v ? [] : [i]));
    for (const move of moves) {
      const label = chess ? move.san : `square ${move + 1}`;
      emit(5, `Consider ${label}.`, { move: label });
      let child;
      if (chess) game.move(move);
      else {
        child = b.slice();
        child[move] = player;
      }
      events.push({
        line: 6,
        message: `Apply ${label}; the opponent moves next.`,
        ...(chess ? { fen: game.fen() } : { board: child.slice() }),
        vars: { ply: ply + 1, depth: remaining - 1, move: label },
        calls,
      });
      emit(7, `Recurse into ${label}.`, { move: label });
      const score = search(
        child,
        player === "X" ? "O" : "X",
        remaining - 1,
        ply + 1,
        alpha,
        beta,
      );
      if (chess) game.undo();
      best = maximizing ? Math.max(best, score) : Math.min(best, score);
      emit(8, `${label} returned ${score}; ${role} keeps ${best}.`, {
        move: label,
        score,
      });
      // The tic-tac-toe lesson uses full search + exact memoization; chess uses bounds.
      if (chess && ply > 0) {
        if (maximizing) alpha = Math.max(alpha, best);
        else beta = Math.min(beta, best);
        emit(9, "Tighten the alpha–beta bound.", { score });
        if (beta <= alpha) {
          emit(10, "No remaining move can improve the ancestor’s decision.");
          break;
        }
      }
    }
    if (!chess) {
      cache.set(key, best);
      emit(11, "Cache this exact result for repeated positions.");
    }
    emit(12, `Return ${best} to the parent call.`, { score: best });
    return best;
  }
  const score = search(
    board,
    turn,
    chess ? depth : board.filter((v) => !v).length,
    0,
    -Infinity,
    Infinity,
  );
  events[events.length - 1].done = true;
  return { events, score, code: MINIMAX_CODE };
}

export function traceKnapsack(items, capacity) {
  const table = Array.from({ length: items.length + 1 }, () =>
    Array(capacity + 1).fill(0),
  );
  const events = [],
    selected = [];
  let i = 0,
    w = 0,
    skip = null,
    take = null;
  const emit = (line, message) =>
    events.push({
      line,
      message,
      table: table.map((r) => r.slice()),
      selected: selected.slice(),
      vars: { i, w, skip, take },
      i,
      w,
    });
  emit(0, "Initialize the row for zero items.");
  for (i = 1; i <= items.length; i++) {
    emit(1, `Consider the first ${i} item${i === 1 ? "" : "s"}.`);
    for (w = 0; w <= capacity; w++) {
      skip = null;
      take = null;
      emit(2, `Solve capacity ${w} with the first ${i} items.`);
      skip = table[i - 1][w];
      emit(3, `Skipping ${items[i - 1].name} keeps ${skip}.`);
      if (items[i - 1].weight > w) {
        table[i][w] = skip;
        emit(4, "This item does not fit; copy the previous row.");
      } else {
        take = items[i - 1].value + table[i - 1][w - items[i - 1].weight];
        emit(
          5,
          `Taking adds the item value to the best remaining capacity: ${take}.`,
        );
        table[i][w] = Math.max(skip, take);
        emit(6, `Store max(${skip}, ${take}) = ${table[i][w]}.`);
      }
    }
  }
  w = capacity;
  skip = null;
  take = null;
  i = items.length;
  emit(7, "Recover which items produced the optimal value.");
  for (i = items.length; i > 0; i--) {
    emit(8, `Inspect row ${i} at capacity ${w}.`);
    emit(9, "Compare this value with the value directly above it.");
    if (table[i][w] !== table[i - 1][w]) {
      selected.push(i - 1);
      w -= items[i - 1].weight;
      emit(10, `Pack ${items[i - 1].name}; ${w} capacity remains.`);
    }
  }
  emit(11, `Optimal value ${table[items.length][capacity]}.`);
  events.at(-1).done = true;
  return { events, score: table[items.length][capacity], code: KNAPSACK_CODE };
}
