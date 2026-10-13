"use client";
import { useMemo, useState } from "react";
import { labLessons } from "../../lib/data/lab-lessons.js";
import { runLab, validateLab } from "../../lib/algorithms/lab-algorithms.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { useSharedInput } from "../../hooks/useSharedInput.js";
import CodePanel from "../../components/execution/CodePanel.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import VariableWatch from "../../components/execution/VariableWatch.jsx";
import EventExplanation from "../../components/execution/EventExplanation.jsx";
import ShareTrace from "../../components/learning/ShareTrace.jsx";

export default function LabLesson({ id, tab }) {
  const lesson = labLessons[id];
  const { input, setInput, start, shareError } = useSharedInput(
    id,
    lesson.input,
    (p) => {
      const parsed = validateLab(id, p);
      runLab(id, parsed);
      return parsed;
    },
  );
  const [draft, setDraft] = useState(null),
    [error, setError] = useState("");
  const run = useMemo(() => runLab(id, input), [id, input]);
  const playback = usePlayback(run, start),
    e = run.events[playback.index];
  function apply() {
    try {
      const p = validateLab(id, draft ?? input);
      runLab(id, p);
      setInput(p);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  if (tab === "learn")
    return (
      <div className="concept-reading">
        <h2>The invariant</h2>
        <p>{lesson.invariant}</p>
        <h3>Watch the boundary</h3>
        <p>{lesson.pitfall}</p>
        <p>
          Change one input at a time, predict the next decision, and explain why
          the result stays valid. Stored trace snapshots add memory beyond the
          algorithm itself.
        </p>
      </div>
    );
  return (
    <>
      <div className="learning-strip">{lesson.invariant}</div>
      <div className="graph-layout learning-layout">
        <section className="panel lab-panel">
          <label className="lab-input">
            LeetCode-style named inputs
            <textarea
              aria-label="Algorithm input JSON"
              rows={5}
              value={draft ?? JSON.stringify(input)}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
            />
          </label>
          <button className="button primary" onClick={apply}>
            Apply & restart
          </button>
          <button
            className="button"
            onClick={() => {
              setInput(lesson.input);
              setDraft(null);
              setError("");
            }}
          >
            Reset example
          </button>
          {(error || shareError) && <p role="alert">{error || shareError}</p>}
          <LabVisual event={e} id={id} />
          <EventExplanation event={e} />
          <div className="judge-output">
            <span className="overline">OUTPUT</span>
            <code>
              {e.done
                ? JSON.stringify(e.result)
                : "Step through to reveal the answer."}
            </code>
          </div>
          <p className="small-note">{lesson.pitfall}</p>
        </section>
        <div>
          <CodePanel code={run.code} event={e} />
          <VariableWatch variables={e.vars} />
          <ShareTrace id={id} input={input} index={playback.index} />
        </div>
      </div>
      <PlaybackControls playback={playback} />
    </>
  );
}
export function LabVisual({ event: e, id }) {
  if (e.matrix)
    return (
      <div className={`matrix-scroll ${id === "sudoku" ? "sudoku-grid" : ""}`}>
        <table className="lab-matrix" aria-label={`${id} visual grid`}>
          <tbody>
            {e.colLabels && (
              <tr>
                <th />
                <>
                  {e.colLabels.map((c, i) => (
                    <th key={i}>{c}</th>
                  ))}
                </>
              </tr>
            )}
            {e.matrix.map((row, r) => (
              <tr key={r}>
                {e.rowLabels && <th>{e.rowLabels[r]}</th>}
                {row.map((v, c) => (
                  <td
                    key={c}
                    className={
                      e.cell?.[0] === r && e.cell?.[1] === c
                        ? "cell-current"
                        : ""
                    }
                  >
                    {v === 0 && id === "sudoku" ? "·" : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if (e.nodes) {
    const children = (parent) =>
      e.nodes.flatMap((n, i) =>
        n.parent === parent
          ? [
              <li key={i}>
                <span className={e.active.includes(i) ? "trie-active" : ""}>
                  {n.text}
                  {n.terminal ? " ●" : ""}
                </span>
                {e.nodes.some((x) => x.parent === i) && <ul>{children(i)}</ul>}
              </li>,
            ]
          : [],
      );
    return (
      <div
        className="trie-scroll"
        role="img"
        aria-label="Trie nodes; a dot marks a complete word"
      >
        <ul className="trie-tree">{children(-1)}</ul>
      </div>
    );
  }
  if (e.intervals)
    return (
      <div
        className="interval-lab"
        role="img"
        aria-label="Input and merged intervals on a zero to thirty timeline"
      >
        {[
          ["SORTED INPUT", e.intervals],
          ["MERGED", e.merged],
        ].map(([title, rows]) => (
          <section key={title}>
            <p className="overline">{title} · 0 → 30</p>
            {rows.map(([a, b], i) => (
              <div className="interval-track" key={i}>
                <span
                  style={{
                    left: `${(a / 30) * 90}%`,
                    width: `${Math.max(2, ((b - a) / 30) * 90)}%`,
                  }}
                >
                  {a}–{b}
                </span>
              </div>
            ))}
          </section>
        ))}
      </div>
    );
  if (e.counts)
    return (
      <div
        className="frequency-bars"
        role="img"
        aria-label="Frequency by value"
      >
        {Object.entries(e.counts).map(([v, c]) => (
          <div key={v}>
            <span>{v}</span>
            <i style={{ width: `${c * 12}px` }} />
            <strong>{c}</strong>
          </div>
        ))}
        <p>Chosen: {e.output.join(", ") || "—"}</p>
      </div>
    );
  return (
    <div className="lab-array">
      {e.values?.map((v, i) => (
        <div className={e.active.includes(i) ? "cell-current" : ""} key={i}>
          <strong>{v}</strong>
          <small>{i}</small>
        </div>
      ))}
    </div>
  );
}
