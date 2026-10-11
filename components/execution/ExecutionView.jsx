"use client";
import { Chess } from "chess.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { Panel, LearningStrip } from "../ui/Panel.jsx";
import TicBoard from "../../features/minimax/TicBoard.jsx";
import ChessBoard from "../../features/minimax/ChessBoard.jsx";
import KnapsackTable from "../../features/knapsack/KnapsackTable.jsx";
import CodePanel from "./CodePanel.jsx";
import VariableWatch from "./VariableWatch.jsx";
import EventExplanation from "./EventExplanation.jsx";
import PlaybackControls from "./PlaybackControls.jsx";

export default function ExecutionView({ run, kind, items = [] }) {
  const playback = usePlayback(run),
    event = run.events[playback.index];
  return (
    <>
      <LearningStrip tag="Execution trace">
        <strong>Watch the algorithm execute.</strong> Step into calls, inspect
        variables, and rewind any decision.
      </LearningStrip>
      <div className="graph-layout execution-layout">
        <Panel
          eyebrow="CURRENT EXECUTION STATE"
          title={
            kind === "knapsack"
              ? "The table as it is built."
              : "Inside the current call."
          }
          action={
            <span className="pill">
              {event.done ? "Complete" : `Step ${playback.index + 1}`}
            </span>
          }
        >
          {kind === "ttt" ? (
            <TicBoard board={event.board} />
          ) : kind === "chess" ? (
            <ChessBoard game={new Chess(event.fen)} />
          ) : (
            <>
              <KnapsackTable
                table={event.table}
                items={items}
                current={{ i: event.i, c: event.w }}
              />
              <div className="trace-selection">
                {event.selected.map((i) => (
                  <span key={i}>{items[i].name}</span>
                ))}
              </div>
            </>
          )}
          <EventExplanation event={event} />
          <VariableWatch variables={event.vars} />
          {kind !== "knapsack" && (
            <div className="call-stack">
              <span className="overline">CALL STACK</span>
              <div>
                {Array.from({ length: (event.vars.ply || 0) + 1 }, (_, i) => (
                  <span
                    key={i}
                    className={i === event.vars.ply ? "current" : ""}
                  >
                    depth {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>
        <section className="trace-side">
          <CodePanel code={run.code} event={event} />
          <p className="small-note">
            {kind === "ttt"
              ? "Tic-tac-toe searches to terminal states and caches exact scores. Depth cutoffs and alpha–beta pruning are used in chess."
              : kind === "chess"
                ? "Chess stops at the selected depth and uses alpha–beta pruning inside each root branch. Scores are from White’s perspective."
                : "Taking an item reads the previous row, so each item is used at most once."}
          </p>
        </section>
      </div>
      <PlaybackControls playback={playback} />
    </>
  );
}
