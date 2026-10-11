const symbols = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};
const names = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

export default function ChessBoard({ game, selected, candidate, onSquare }) {
  const legal = selected ? game.moves({ square: selected, verbose: true }) : [];
  return (
    <div className="chess-board" aria-label="Chess board">
      {game
        .board()
        .flat()
        .map((piece, i) => {
          const r = Math.floor(i / 8),
            c = i % 8,
            square = "abcdefgh"[c] + (8 - r);
          return (
            <button
              key={square}
              className={`chess-square ${(r + c) % 2 ? "dark" : "light"} ${selected === square ? "selected" : ""} ${candidate && [candidate.from, candidate.to].includes(square) ? "suggested" : ""}`}
              disabled={!onSquare || game.isGameOver()}
              onClick={() => onSquare?.(square)}
              aria-label={`${square}: ${piece ? `${piece.color === "w" ? "white" : "black"} ${names[piece.type]}` : "empty"}`}
            >
              {c === 0 && <span className="rank">{8 - r}</span>}
              {r === 7 && <span className="file">{"abcdefgh"[c]}</span>}
              {piece && (
                <span
                  className={`piece ${piece.color === "w" ? "white-piece" : "black-piece"}`}
                >
                  {symbols[piece.color + piece.type]}
                </span>
              )}
              {legal.some((move) => move.to === square) && (
                <span className="legal-dot" />
              )}
            </button>
          );
        })}
    </div>
  );
}
