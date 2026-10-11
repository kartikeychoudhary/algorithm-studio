"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useLessonState } from "../../components/layout/StudioProvider.jsx";
import { Panel, LearningStrip } from "../../components/ui/Panel.jsx";
import { analyzeTicTacToe, winner } from "../../lib/algorithms/tic-tac-toe.js";
import { traceMinimax } from "../../lib/algorithms/traces.js";
import { signed } from "../../lib/format.js";
import ExecutionView from "../../components/execution/ExecutionView.jsx";
import TicBoard from "./TicBoard.jsx";

const example = ["X", "O", null, null, "X", null, "O", null, null];
const initial = {
  board: example,
  turn: "X",
  history: [],
  preset: "example",
  reveal: 1,
};

export default function TicTacToeLesson({ tab }) {
  const [state, setState] = useLessonState("ttt", initial);
  const analysis = useMemo(
    () => analyzeTicTacToe(state.board, state.turn),
    [state.board, state.turn],
  );
  const trace = useMemo(
    () =>
      tab === "code"
        ? traceMinimax({ board: state.board, turn: state.turn })
        : null,
    [tab, state.board, state.turn],
  );
  const result = winner(state.board),
    revealed = Math.min(state.reveal, analysis.moves.length);
  function reset(preset = state.preset) {
    setState({
      ...initial,
      preset,
      board: preset === "empty" ? Array(9).fill(null) : example.slice(),
    });
  }
  function play(index) {
    if (state.board[index] || result) return;
    const board = state.board.slice();
    board[index] = state.turn;
    setState({
      ...state,
      board,
      turn: state.turn === "X" ? "O" : "X",
      reveal: 1,
      history: [...state.history, { board: state.board, turn: state.turn }],
    });
  }
  function undo() {
    const previous = state.history.at(-1);
    if (previous)
      setState({
        ...state,
        ...previous,
        reveal: 1,
        history: state.history.slice(0, -1),
      });
  }
  if (tab === "code") return <ExecutionView run={trace} kind="ttt" />;
  return (
    <>
      <LearningStrip tag="Perfect information">
        <strong>Two players. Two opposite goals.</strong> X maximizes the score.
        O minimizes it. Both look all the way to the end.
      </LearningStrip>
      <div className="lab-grid">
        <Panel
          className="board-panel"
          eyebrow="THE GAME"
          title="Your move, your experiment."
          action={
            <button
              className="icon-button"
              onClick={() => reset()}
              aria-label="Reset board"
            >
              ↺
            </button>
          }
        >
          <div className="player-legend">
            <span>
              <b className="x-mark">X</b>Maximizer <em>+1</em>
            </span>
            <span>
              <b className="o-mark">O</b>Minimizer <em>−1</em>
            </span>
          </div>
          <TicBoard board={state.board} onMove={play} terminal={result} />
          <div className="turn-status" role="status">
            {result
              ? result === "draw"
                ? "A draw. Every square tells a story."
                : `${result} wins! Reset to try another path.`
              : `${state.turn} to move · Choose the ${state.turn === "X" ? "highest" : "lowest"} score`}
          </div>
          <div className="board-actions">
            <button
              className="button primary"
              disabled={!!result}
              onClick={() => {
                const move = analysis.moves.find(
                  (m) => m.score === analysis.score,
                );
                if (move) play(move.index);
              }}
            >
              ▶ Play best move
            </button>
            <button
              className="button"
              disabled={!state.history.length}
              onClick={undo}
            >
              Undo
            </button>
          </div>
          <label className="select-label">
            Starting position
            <select
              value={state.preset}
              onChange={(e) => reset(e.target.value)}
            >
              <option value="example">A winning opportunity</option>
              <option value="empty">An empty board</option>
            </select>
          </label>
          <p className="small-note">
            Click any empty square to play either side. Scores assume perfect
            play from this position.
          </p>
        </Panel>
        <Panel
          className="tree-panel"
          eyebrow="INSIDE THE ALGORITHM"
          title="Every possibility has a score."
        >
          <div className="tree-root">
            <div className="root-node">
              <TicBoard mini board={state.board} />
              <div>
                <strong>Current position</strong>
                <span>
                  {result
                    ? "Terminal position"
                    : `${state.turn === "X" ? "MAX" : "MIN"} · ${state.turn}'s turn`}
                </span>
              </div>
              <b className="score-badge">{signed(analysis.score)}</b>
            </div>
          </div>
          <div className="tree-connector">
            <span>Explore a move → opponent responds → result returns</span>
          </div>
          <div className="move-grid">
            {analysis.moves.map((move, i) => (
              <button
                key={move.index}
                onClick={() => play(move.index)}
                className={`move-card ${i < revealed && move.score === analysis.score ? "best-move" : ""} ${i === revealed - 1 ? "current-move" : ""}`}
                aria-label={`Explore move ${move.index + 1}`}
              >
                <div className="move-card-top">
                  <span>Square {move.index + 1}</span>
                  <b>{i < revealed ? signed(move.score) : "?"}</b>
                </div>
                <TicBoard mini board={move.board} />
                <span className="move-result">
                  {i >= revealed
                    ? "Awaiting evaluation"
                    : move.score === 1
                      ? "X can force a win"
                      : move.score === -1
                        ? "O can force a win"
                        : "Best play → draw"}
                </span>
                {i < revealed && move.score === analysis.score && (
                  <span className="best-label">BEST CHOICE</span>
                )}
              </button>
            ))}
            {result && (
              <p className="terminal-message">
                This is a leaf of the tree. Its score returns to the parent.
              </p>
            )}
          </div>
          <div className="tree-key">
            <span>Best move for {state.turn}</span>
            <span>Scores are from X’s perspective</span>
          </div>
          <div className="step-bar">
            <button
              className="button"
              disabled={revealed === analysis.moves.length}
              onClick={() => setState({ ...state, reveal: state.reveal + 1 })}
            >
              Next evaluation
            </button>
            <button
              className="text-button"
              disabled={revealed === analysis.moves.length}
              onClick={() => setState({ ...state, reveal: 9 })}
            >
              Reveal all
            </button>
            <span>
              {revealed} / {analysis.moves.length} moves
            </span>
          </div>
          <div className="explanation">
            <p>
              {result
                ? `Terminal score: ${signed(analysis.score)}.`
                : revealed === analysis.moves.length
                  ? `${state.turn} chooses the ${state.turn === "X" ? "maximum" : "minimum"} score, ${signed(analysis.score)}. Click a move card to follow that branch.`
                  : `Square ${analysis.moves[revealed - 1]?.index + 1} returns ${signed(analysis.moves[revealed - 1]?.score ?? 0)} after searching its continuations.`}
            </p>
          </div>
        </Panel>
      </div>
      <div className="bottom-cards">
        <div>
          <span>
            <strong>{analysis.nodes.toLocaleString()}</strong> search calls
            <span className="subtext">Repeated positions are cached</span>
          </span>
        </div>
        <div>
          <span>
            <strong>No guesswork</strong>
            <span className="subtext">
              Search continues to a win, loss, or draw
            </span>
          </span>
        </div>
        <Link className="button" href="/lessons/chess">
          The same idea. A bigger board. →
        </Link>
      </div>
    </>
  );
}
