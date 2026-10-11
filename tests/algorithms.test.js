import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { analyzeTicTacToe, winner } from "../lib/algorithms/tic-tac-toe.js";
import { analyzeChess, CHESS_POSITIONS } from "../lib/algorithms/chess.js";
import { solveKnapsack } from "../lib/algorithms/knapsack.js";

test("tic-tac-toe: empty board is a forced draw and winning move is recognized", () => {
  assert.equal(analyzeTicTacToe(Array(9).fill(null)).score, 0);
  const a = analyzeTicTacToe([
    "X",
    "O",
    null,
    null,
    "X",
    null,
    "O",
    null,
    null,
  ]);
  assert.equal(a.moves.find((m) => m.index === 8).score, 1);
  assert.equal(winner(["X", "X", "X", "O", null, "O", null, null, null]), "X");
});
test("tic-tac-toe: minimizer blocks a forced loss", () => {
  const a = analyzeTicTacToe(
    ["X", "X", null, null, "O", null, null, null, null],
    "O",
  );
  const best = a.moves.filter((m) => m.score === a.score);
  assert.deepEqual(
    best.map((m) => m.index),
    [2],
  );
});
test("tic-tac-toe: optimal play never loses against any opponent sequence", () => {
  for (const ai of ["X", "O"]) {
    function visit(board, turn) {
      const result = winner(board);
      if (result) {
        assert.notEqual(result, ai === "X" ? "O" : "X");
        return;
      }
      const a = analyzeTicTacToe(board, turn);
      const choices =
        turn === ai ? [a.moves.find((m) => m.score === a.score)] : a.moves;
      for (const m of choices) visit(m.board, turn === "X" ? "O" : "X");
    }
    visit(Array(9).fill(null), "X");
  }
});
test("chess: deeper search detects the poisoned capture", () => {
  const fen = CHESS_POSITIONS[0].fen;
  const shallow = analyzeChess(fen, 1),
    deeper = analyzeChess(fen, 2);
  assert.equal(shallow.moves[0].san, "Qxd8+");
  assert.equal(shallow.moves[0].score, 9);
  assert.equal(deeper.moves.find((m) => m.san === "Qxd8+").score, 0);
  assert.notEqual(deeper.moves[0].san, "Qxd8+");
  assert.equal(new Chess(fen).fen(), fen);
});
test("chess: checkmate outranks material and principal variations are legal", () => {
  const a = analyzeChess(CHESS_POSITIONS[1].fen, 2);
  assert.ok(a.moves[0].score > 900);
  const game = new Chess(CHESS_POSITIONS[1].fen);
  game.move(a.moves[0].san);
  assert.ok(game.isCheckmate());
  for (const position of CHESS_POSITIONS) {
    for (const m of analyzeChess(position.fen, 3).moves) {
      const g = new Chess(position.fen);
      for (const san of m.line) assert.ok(g.move(san));
    }
  }
});
test("chess: a drawn terminal position has no playable candidates", () => {
  const a = analyzeChess("4k3/8/8/8/8/8/8/4K3 w - - 0 1", 2);
  assert.equal(a.score, 0);
  assert.deepEqual(a.moves, []);
});
test("knapsack: known solution and greedy counterexample", () => {
  const items = [
    { weight: 4, value: 8 },
    { weight: 3, value: 6 },
    { weight: 2, value: 5 },
    { weight: 1, value: 2 },
  ];
  const a = solveKnapsack(items, 7);
  assert.equal(a.value, 15);
  assert.deepEqual(a.selected, [0, 2, 3]);
  assert.equal(a.weight, 7);
  assert.equal(solveKnapsack(items, 5).value, 11);
});
test("knapsack: matches exhaustive subsets including ties, empty and too-heavy inputs", () => {
  const sets = [
    [],
    [{ weight: 2, value: 5 }],
    [
      { weight: 1, value: 2 },
      { weight: 1, value: 2 },
    ],
    [
      { weight: 3, value: 4 },
      { weight: 2, value: 7 },
      { weight: 5, value: 10 },
      { weight: 1, value: 1 },
    ],
  ];
  for (const items of sets)
    for (let cap = 0; cap <= 12; cap++) {
      let expected = 0;
      for (let mask = 0; mask < 1 << items.length; mask++) {
        let w = 0,
          v = 0;
        items.forEach((it, i) => {
          if (mask & (1 << i)) {
            w += it.weight;
            v += it.value;
          }
        });
        if (w <= cap) expected = Math.max(expected, v);
      }
      const a = solveKnapsack(items, cap);
      assert.equal(a.value, expected);
      assert.ok(a.weight <= cap);
      assert.equal(
        a.selected.reduce((s, i) => s + items[i].value, 0),
        expected,
      );
    }
});
