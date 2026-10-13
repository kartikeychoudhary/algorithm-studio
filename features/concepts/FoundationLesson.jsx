"use client";
import { useState } from "react";
import {
  foundationLessons,
  foundationSources,
} from "../../lib/data/foundation-lessons.js";
import { SequencePlayer } from "../spring/SpringLesson.jsx";
import FailureLab from "../../components/learning/FailureLab.jsx";
import { initialRace, raceStep } from "../../lib/learning/experiments.js";
export function ConcurrencyLab() {
  const [s, setS] = useState(initialRace),
    [locked, setLocked] = useState(false);
  return (
    <section className="concept-reading">
      <label>
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => {
            setLocked(e.target.checked);
            setS(initialRace);
          }}
        />{" "}
        Protect read + write with one lock
      </label>
      <div className="metric-grid">
        <div>
          <small>Shared counter</small>
          <strong>{s.value}</strong>
        </div>
        {["a", "b"].map((w) => (
          <div key={w}>
            <small>Worker {w.toUpperCase()}</small>
            <strong>
              {s[w].pc === 0
                ? "Read next"
                : s[w].pc === 1
                  ? `Write ${s[w].local + 1} next`
                  : "Finished"}
            </strong>
            <button
              className="button"
              disabled={s[w].pc === 2}
              onClick={() => setS((p) => raceStep(p, w, locked))}
            >
              Step worker {w.toUpperCase()}
            </button>
          </div>
        ))}
      </div>
      <p>
        Expected after two increments: <strong>2</strong>. Lock owner:{" "}
        {s.owner?.toUpperCase() || "none"}.
      </p>
      <ol aria-label="Thread interleaving">
        {s.history.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ol>
      <button className="button" onClick={() => setS(initialRace)}>
        Reset workers
      </button>
      <p>
        Try A read → B read → A write → B write. A lock must protect the entire
        read-modify-write operation. This is a deterministic shared-memory
        model, not actual browser threads.
      </p>
    </section>
  );
}
export function MemoryLab() {
  const [mode, setMode] = useState("heap"),
    [heap, setHeap] = useState([{ id: 1, reachable: true }]),
    [stack, setStack] = useState(["main"]),
    [event, setEvent] = useState(0);
  const phases = [
    ["Call stack: main()", "Run synchronous code.", "main"],
    [
      "Call stack: empty",
      "main returns; the current task finishes.",
      "main, sync",
    ],
    [
      "Microtask: Promise.then",
      "Drain queued microtasks before the next task.",
      "main, sync, promise",
    ],
    [
      "Task: timer callback",
      "The timer task runs once eligible and selected.",
      "main, sync, promise, timer",
    ],
  ];
  return (
    <section className="concept-reading">
      <div className="concept-facets">
        <button className="button" onClick={() => setMode("heap")}>
          Stack & heap
        </button>
        <button className="button" onClick={() => setMode("loop")}>
          Event loop
        </button>
      </div>
      {mode === "heap" ? (
        <>
          <div className="memory-columns">
            <div>
              <h3>Stack frames</h3>
              {stack.map((s, i) => (
                <p className="memory-object" key={i}>
                  {s}
                </p>
              ))}
            </div>
            <div>
              <h3>Heap objects</h3>
              {heap.map((o) => (
                <p
                  className={`memory-object ${o.reachable ? "" : "unreachable"}`}
                  key={o.id}
                >
                  Object #{o.id}{" "}
                  {o.reachable ? "← root reference" : "· unreachable"}
                </p>
              ))}
            </div>
          </div>
          <button
            className="button"
            disabled={heap.length >= 8}
            onClick={() =>
              setHeap((h) => [
                ...h,
                { id: Math.max(0, ...h.map((o) => o.id)) + 1, reachable: true },
              ])
            }
          >
            Allocate object
          </button>
          <button
            className="button"
            onClick={() =>
              setHeap((h) =>
                h.map((o, i) =>
                  i === h.findIndex((x) => x.reachable)
                    ? { ...o, reachable: false }
                    : o,
                ),
              )
            }
          >
            Drop a root reference
          </button>
          <button
            className="button"
            onClick={() => setHeap((h) => h.filter((o) => o.reachable))}
          >
            Collect unreachable objects
          </button>
          <button
            className="button"
            disabled={stack.length >= 6}
            onClick={() => setStack((s) => [...s, `function ${s.length}()`])}
          >
            Call function
          </button>
          <button
            className="button"
            disabled={stack.length === 1}
            onClick={() => setStack((s) => s.slice(0, -1))}
          >
            Return
          </button>
          <p>
            Objects here have direct roots and no cross-references. Real
            collectors traverse the reference graph; becoming unreachable makes
            an object eligible, without guaranteeing immediate collection.
            Popping a frame need not free an object referenced elsewhere.
          </p>
        </>
      ) : (
        <>
          <pre className="case-schema">
            {
              'log("main");\nsetTimeout(() => log("timer"), 0);\nPromise.resolve().then(() => log("promise"));\nlog("sync");'
            }
          </pre>
          <div className="flow-current-card">
            <h3>{phases[event][0]}</h3>
            <p>{phases[event][1]}</p>
            <code>Output: {phases[event][2]}</code>
          </div>
          <button
            className="button primary"
            disabled={event === 3}
            onClick={() => setEvent((e) => e + 1)}
          >
            Next event-loop phase
          </button>
          <button className="button" onClick={() => setEvent(0)}>
            Restart event loop
          </button>
          <p>
            A zero-delay timer is not immediate. Long tasks or continuously
            added microtasks can delay rendering and other tasks.
          </p>
        </>
      )}
    </section>
  );
}
export default function FoundationLesson({ id, tab }) {
  const lesson = foundationLessons[id];
  const [selected, setSelected] = useState(0);
  return (
    <>
      {foundationSources[id] && (
        <p className="learning-source">
          Reference:{" "}
          <a href={foundationSources[id].url} target="_blank" rel="noreferrer">
            {foundationSources[id].label} ↗
          </a>
        </p>
      )}
      {lesson.scenarios.length > 0 && (
        <>
          <div className="concept-facets">
            {lesson.scenarios.map((s, i) => (
              <button
                className={i === selected ? "selected" : ""}
                aria-pressed={i === selected}
                key={s.label}
                onClick={() => setSelected(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <SequencePlayer
            key={selected}
            scenario={lesson.scenarios[selected]}
          />
        </>
      )}
      {id === "concurrency" && <ConcurrencyLab />}
      {id === "memory" && <MemoryLab />}
      {id === "reliability" && <FailureLab />}
      {tab === "learn" && (
        <div className="idea-card">
          <h3>Explain it back</h3>
          <p>
            Identify the state before and after each operation. Name the
            invariant, the failure that violates it, and the cost of preventing
            that failure.
          </p>
        </div>
      )}
    </>
  );
}
