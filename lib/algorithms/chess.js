import { Chess } from "chess.js";
export const CHESS_POSITIONS = [
  {
    name: "The poisoned queen",
    fen: "3rk3/8/8/8/8/8/8/3QK3 w - - 0 1",
    description:
      "A rook on d8 looks free. But the black king is guarding it. Compare a shallow search with a deeper one.",
    hint: "At depth 1, Qxd8+ gains a rook. At depth 2, …Kxd8 loses your queen. Looking one move further changes the decision.",
  },
  {
    name: "Find checkmate",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    description:
      "White can end the game. Find a move that leaves the black king in check with no legal escape.",
    hint: "Checkmate outranks any material advantage. Watch out: some queen moves cause stalemate, which scores 0.",
  },
  {
    name: "Win the hanging queen",
    fen: "4k3/8/8/8/8/8/4q3/3RK3 w - - 0 1",
    description:
      "White is in check. The black queen is unprotected. Which legal response wins material?",
    hint: "The search only considers legal moves. Kxe2 removes the checking queen and keeps the rook.",
  },
];
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
export function evaluateChess(game, ply = 0) {
  if (game.isCheckmate()) return game.turn() === "w" ? -1000 + ply : 1000 - ply;
  if (game.isDraw()) return 0;
  return game
    .board()
    .flat()
    .reduce(
      (s, p) => s + (p ? PIECE_VALUES[p.type] * (p.color === "w" ? 1 : -1) : 0),
      0,
    );
}
export function analyzeChess(fen, depth = 2) {
  const game = new Chess(fen);
  if (game.isGameOver())
    return {
      moves: [],
      nodes: 1,
      score: evaluateChess(game),
      maximizing: game.turn() === "w",
    };
  let nodes = 0;
  function search(remaining, alpha, beta, ply) {
    nodes++;
    if (!remaining || game.isGameOver())
      return { score: evaluateChess(game, ply), line: [] };
    const maximizing = game.turn() === "w";
    let best = maximizing ? -Infinity : Infinity;
    let line = [];
    const moves = game
      .moves({ verbose: true })
      .sort((a, b) => Number(!!b.captured) - Number(!!a.captured));
    for (const move of moves) {
      game.move(move);
      const result = search(remaining - 1, alpha, beta, ply + 1);
      game.undo();
      if (
        (maximizing && result.score > best) ||
        (!maximizing && result.score < best)
      ) {
        best = result.score;
        line = [move.san, ...result.line];
      }
      if (maximizing) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return { score: best, line };
  }
  const maximizing = game.turn() === "w";
  const moves = game.moves({ verbose: true }).map((move) => {
    game.move(move);
    // Each root move gets a full window so every displayed candidate score is exact at this depth.
    const result = search(depth - 1, -Infinity, Infinity, 1);
    const nextFen = game.fen();
    game.undo();
    return {
      ...move,
      score: result.score,
      line: [move.san, ...result.line],
      fen: nextFen,
    };
  });
  moves.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));
  return {
    moves,
    nodes,
    score: moves[0]?.score ?? evaluateChess(game),
    maximizing,
  };
}
