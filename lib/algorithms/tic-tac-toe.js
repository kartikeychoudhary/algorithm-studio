export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export function winner(board) {
  for (const line of WIN_LINES)
    if (board[line[0]] && line.every((i) => board[i] === board[line[0]]))
      return board[line[0]];
  return board.every(Boolean) ? "draw" : null;
}
export function analyzeTicTacToe(board, player = "X") {
  const cache = new Map();
  let nodes = 0;
  function search(b, turn) {
    nodes++;
    const result = winner(b);
    if (result) return result === "X" ? 1 : result === "O" ? -1 : 0;
    const key = b.map((v) => v || "-").join("") + turn;
    if (cache.has(key)) return cache.get(key);
    const values = b.flatMap((v, i) => {
      if (v) return [];
      const child = b.slice();
      child[i] = turn;
      return [search(child, turn === "X" ? "O" : "X")];
    });
    const value = turn === "X" ? Math.max(...values) : Math.min(...values);
    cache.set(key, value);
    return value;
  }
  if (winner(board))
    return { moves: [], nodes: 1, score: search(board, player) };
  const moves = board.flatMap((v, index) => {
    if (v) return [];
    const next = board.slice();
    next[index] = player;
    const score = search(next, player === "X" ? "O" : "X");
    return [{ index, board: next, score }];
  });
  const score =
    player === "X"
      ? Math.max(...moves.map((m) => m.score))
      : Math.min(...moves.map((m) => m.score));
  return { moves, nodes, score };
}
