"use client";
import { useMemo } from "react";
import { deepLessons } from "../../lib/data/deep-lessons.js";
import { runSystems } from "../../lib/simulations/index.js";
import { useSharedInput } from "../../hooks/useSharedInput.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import ShareTrace from "../../components/learning/ShareTrace.jsx";
import ExperimentEditor from "./ExperimentEditor.jsx";
import SimulationCanvas from "./SimulationCanvas.jsx";
export default function SystemsLesson({ id, tab }) {
  const lesson = deepLessons[id];
  const { input, setInput, start, shareError } = useSharedInput(
    id,
    lesson.input,
    (p) => {
      runSystems(id, p);
      return p;
    },
  );
  const run = useMemo(() => runSystems(id, input), [id, input]),
    playback = usePlayback(run, start),
    event = run.events[playback.index];
  const apply = (p) => {
    runSystems(id, p);
    setInput(p);
  };
  return (
    <div className="systems-lesson">
      <div className="systems-scope">
        <span className="status-dot" /> INTERACTIVE TEACHING MODEL{" "}
        <p>
          Numeric experiments compute their results from your settings. Protocol
          and framework lessons step through bounded scenarios. These diagrams
          do not run a real server, JVM, operating system, or cloud deployment.
        </p>
      </div>
      {tab === "learn" ? (
        <div className="concept-reading">
          <h2>The mechanism</h2>
          <p>{lesson.idea}</p>
          <h2>Model assumptions</h2>
          <p>{lesson.boundary}</p>
          <h2>Try a contrast</h2>
          <p>
            {lesson.alternative.label}. Predict which state or metric changes,
            then run both examples and explain the difference.
          </p>
          <h2>Worked example</h2>
          <ol>
            {run.events.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <div className="systems-intro-grid">
            <ExperimentEditor
              key={JSON.stringify(input)}
              lesson={lesson}
              input={input}
              onApply={apply}
            />
            <aside className="systems-idea">
              <span className="overline">THE MECHANISM</span>
              <p>{lesson.idea}</p>
              <div className="systems-presets">
                <button
                  className="button"
                  onClick={() =>
                    apply({ ...lesson.input, ...lesson.alternative.patch })
                  }
                >
                  {lesson.alternative.label}
                </button>
                <button
                  className="button"
                  onClick={() => apply({ ...lesson.input })}
                >
                  Reset example
                </button>
              </div>
            </aside>
          </div>
          {shareError && <p role="alert">{shareError}</p>}
          <section className="systems-current" role="status">
            <span className="overline">
              STEP {playback.index + 1} / {playback.total}
            </span>
            <p>{event.message}</p>
            <code>{run.code[event.line]}</code>
          </section>
          <SimulationCanvas event={event} />
          <PlaybackControls playback={playback} />
          {tab === "code" ? (
            <CodePanel code={run.code} event={event} />
          ) : (
            <details className="systems-details">
              <summary>Open the highlighted pseudocode</summary>
              <CodePanel code={run.code} event={event} />
            </details>
          )}
          {playback.index === playback.total - 1 && (
            <details className="systems-details">
              <summary>Inspect the final computed result</summary>
              <pre>{JSON.stringify(run.result, null, 2)}</pre>
            </details>
          )}
          <ShareTrace id={id} input={input} index={playback.index} />
        </>
      )}
      <div className="systems-boundary">
        <h3>Where the model stops</h3>
        <p>{lesson.boundary}</p>
      </div>
      <p className="learning-source">
        Read further:{" "}
        <a href={lesson.source.url} target="_blank" rel="noreferrer">
          {lesson.source.label} ↗
        </a>
      </p>
    </div>
  );
}
