"use client";
import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { useLessonState } from "../../components/layout/StudioProvider.jsx";
import { Panel, LearningStrip } from "../../components/ui/Panel.jsx";
import { analyzeChess, CHESS_POSITIONS } from "../../lib/algorithms/chess.js";
import { traceMinimax } from "../../lib/algorithms/traces.js";
import { signed } from "../../lib/format.js";
import ExecutionView from "../../components/execution/ExecutionView.jsx";
import ChessBoard from "./ChessBoard.jsx";

const initial = { position: 0, depth: 2, moves: [] };
const scoreLabel = (score) =>
  Math.abs(score) > 900
    ? score > 0
      ? "White mates"
      : "Black mates"
    : signed(score);

export default function ChessLesson({ tab }) {
  const [state, setState] = useLessonState("chess", initial);
  const [selected, setSelected] = useState(null),
    [candidateIndex, setCandidateIndex] = useState(0);
  const game = useMemo(() => {
    const next = new Chess(CHESS_POSITIONS[state.position].fen);
    state.moves.forEach((move) => next.move(move));
    return next;
  }, [state.position, state.moves]);
  const analysis = useMemo(
    () => analyzeChess(game.fen(), state.depth),
    [game, state.depth],
  );
  const trace = useMemo(
    () =>
      tab === "code"
        ? traceMinimax({ fen: game.fen(), depth: state.depth })
        : null,
    [tab, game, state.depth],
  );
  const candidate = analysis.moves[candidateIndex] || analysis.moves[0];
  function play(move) {
    setState({ ...state, moves: [...state.moves, move.san] });
    setSelected(null);
    setCandidateIndex(0);
  }
  function reset(position = state.position) {
    setState({ ...state, position, moves: [] });
    setSelected(null);
    setCandidateIndex(0);
  }
  function choose(square) {
    const move = selected
      ? game
          .moves({ square: selected, verbose: true })
          .find((m) => m.to === square)
      : null;
    if (move) play(move);
    else
      setSelected(
        game.get(square)?.color === game.turn() && selected !== square
          ? square
          : null,
      );
  }
  if (tab === "code") return <ExecutionView run={trace} kind="chess" />;
  const end = game.isCheckmate()
    ? "Checkmate"
    : game.isDraw()
      ? "Draw"
      : `${game.turn() === "w" ? "White" : "Black"} to move${game.isCheck() ? " · in check" : ""}`;
  return (
    <>
      <LearningStrip tag="Depth-limited search">
        <strong>The same minimax. A shorter horizon.</strong> Stop at a chosen
        depth and evaluate material.
      </LearningStrip>
      <div className="lab-grid chess-layout">
        <Panel
          eyebrow="THE POSITION"
          title={CHESS_POSITIONS[state.position].name}
          action={
            <button
              className="icon-button"
              onClick={() => reset()}
              aria-label="Reset chess position"
            >
              ↺
            </button>
          }
        >
          <label className="select-label">
            Example
            <select
              value={state.position}
              onChange={(e) => reset(Number(e.target.value))}
            >
              {CHESS_POSITIONS.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <ChessBoard
            game={game}
            selected={selected}
            candidate={candidate}
            onSquare={choose}
          />
          <div className="turn-status" role="status">
            {end}
          </div>
          <div className="board-actions">
            <button
              className="button primary"
              disabled={!candidate}
              onClick={() => play(candidate)}
            >
              ▶ Play {candidate?.san || "move"}
            </button>
            <button
              className="button"
              disabled={!state.moves.length}
              onClick={() => {
                setState({ ...state, moves: state.moves.slice(0, -1) });
                setCandidateIndex(0);
                setSelected(null);
              }}
            >
              Undo
            </button>
          </div>
          <p className="small-note">
            Select a piece, then a highlighted square to play. Purple outlines
            show the candidate move.
          </p>
        </Panel>
        <Panel
          eyebrow="LOOK AHEAD"
          title="Is the obvious move the best?"
          action={
            <span className="pill">
              {analysis.nodes.toLocaleString()} nodes
            </span>
          }
        >
          <p className="panel-copy">
            {CHESS_POSITIONS[state.position].description}
          </p>
          <div className="depth-control">
            <div>
              <strong>Search depth</strong>
              <span>One ply = one player’s move</span>
            </div>
            <div className="segmented">
              {[1, 2, 3].map((depth) => (
                <button
                  key={depth}
                  className={state.depth === depth ? "active" : ""}
                  aria-pressed={state.depth === depth}
                  onClick={() => {
                    setState({ ...state, depth });
                    setCandidateIndex(0);
                  }}
                >
                  {depth} {depth === 1 ? "ply" : "plies"}
                </button>
              ))}
            </div>
          </div>
          <div className="candidate-heading">
            <span>Candidate move</span>
            <span>Score for White</span>
          </div>
          <div className="chess-candidates">
            {analysis.moves.map((move, i) => (
              <button
                key={move.san}
                className={`chess-candidate ${candidate === move ? "active" : ""}`}
                onClick={() => setCandidateIndex(i)}
              >
                <span className="candidate-rank">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <strong>{move.san}</strong>
                <span>{move.captured ? "Capture" : "Legal move"}</span>
                <b>{scoreLabel(move.score)}</b>
                {move.score === analysis.score ? (
                  <span className="best-tag">BEST</span>
                ) : (
                  <span className="tag-spacer" />
                )}
              </button>
            ))}
            {!candidate && (
              <p className="terminal-message">
                {end}. This position is terminal.
              </p>
            )}
          </div>
          <div className="principal-line">
            <span className="overline">
              BEST CONTINUATION FOR SELECTED MOVE
            </span>
            <div>
              {candidate?.line.map((move, i) => (
                <span className="line-move" key={i}>
                  <small>
                    {(game.turn() === "w") === (i % 2 === 0)
                      ? "WHITE"
                      : "BLACK"}
                  </small>
                  <strong>{move}</strong>
                </span>
              )) || "No continuation"}
            </div>
            <p>Each side chooses its best reply within the search horizon.</p>
          </div>
          <div className="explanation">
            <p>{CHESS_POSITIONS[state.position].hint}</p>
          </div>
        </Panel>
      </div>
      <div className="material-legend">
        <strong>The evaluation function</strong>
        <span>
          Pawn <b>1</b>
        </span>
        <span>
          Knight <b>3</b>
        </span>
        <span>
          Bishop <b>3</b>
        </span>
        <span>
          Rook <b>5</b>
        </span>
        <span>
          Queen <b>9</b>
        </span>
      </div>
      <p className="small-note outside-note">
        White material − Black material. Draw = 0; checkmate takes priority.
        This teaching engine uses alpha–beta pruning, but no positional or
        quiescence search.
      </p>
    </>
  );
}
