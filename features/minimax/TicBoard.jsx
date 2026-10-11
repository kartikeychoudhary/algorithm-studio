import { WIN_LINES } from "../../lib/algorithms/tic-tac-toe.js";

export default function TicBoard({ board, onMove, terminal, mini = false }) {
  if (mini)
    return (
      <span className="mini-board" aria-hidden="true">
        {board.map((cell, i) => (
          <span key={i} className={cell || ""}>
            {cell}
          </span>
        ))}
      </span>
    );
  if (!onMove)
    return (
      <div className="trace-tic-board">
        {board.map((cell, i) => (
          <span key={i} className={cell || ""}>
            {cell || "·"}
          </span>
        ))}
      </div>
    );
  const line =
    WIN_LINES.find(
      (indices) =>
        board[indices[0]] &&
        indices.every((i) => board[i] === board[indices[0]]),
    ) || [];
  return (
    <div className="tic-board" aria-label="Tic-tac-toe board">
      {board.map((cell, i) => (
        <button
          key={i}
          className={`tic-square ${cell || ""} ${line.includes(i) ? "winning" : ""}`}
          onClick={() => onMove(i)}
          disabled={!!cell || !!terminal}
          aria-label={`Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}: ${cell || "empty"}`}
        >
          {cell || <span className="square-index">{i + 1}</span>}
        </button>
      ))}
    </div>
  );
}
