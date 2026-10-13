"use client";
import { useMemo, useState } from "react";
import {
  springLessons,
  springAnnotations,
  annotationScenario,
} from "../../lib/data/spring-lessons.js";
import { walkthrough } from "../../lib/learning/models.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import SequenceDiagram from "../../components/learning/SequenceDiagram.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
export function SequencePlayer({ scenario }) {
  const run = useMemo(() => walkthrough(scenario), [scenario]);
  const p = usePlayback(run),
    event = run.events[p.index];
  return (
    <>
      <div className="flow-current-card" role="status">
        <span className="overline">
          STEP {p.index + 1} / {p.total}
        </span>
        <h2>
          {scenario.nodes[event.from]} → {scenario.nodes[event.to]}
        </h2>
        <p>{event.message}</p>
        <code>{run.code[event.line]}</code>
      </div>
      <p className="small-note">
        Read top to bottom. Scroll horizontally to follow all participants.
        Highlighted arrows show the current handoff.
      </p>
      <SequenceDiagram scenario={scenario} event={event} index={p.index} />
      <details className="sequence-details">
        <summary>Full flow and highlighted pseudocode</summary>
        <CodePanel code={run.code} event={event} />
      </details>
      <PlaybackControls playback={p} />
    </>
  );
}
export default function SpringLesson({ id, tab }) {
  const lesson = springLessons[id];
  const [selected, setSelected] = useState(0),
    [query, setQuery] = useState("");
  const a = springAnnotations[selected];
  const scenario = useMemo(
    () =>
      id === "spring-annotations"
        ? annotationScenario(a)
        : lesson.scenarios[selected],
    [id, selected, a, lesson],
  );
  return (
    <>
      <p className="spring-scope">
        Teaching model · Spring Boot + Spring Framework · Servlet MVC unless
        stated otherwise. Diagrams describe configured framework behavior; no
        Java application runs in this browser.
      </p>
      {id === "spring-annotations" ? (
        <div className="annotation-layout">
          <section>
            <input
              aria-label="Search annotations"
              placeholder="Search annotations or responsibilities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="annotation-list">
              {springAnnotations
                .map((item, i) => ({ item, i }))
                .filter(({ item }) =>
                  `${item.name} ${item.group} ${item.effect}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map(({ item, i }) => (
                  <button
                    className={i === selected ? "selected" : ""}
                    aria-pressed={i === selected}
                    key={item.name}
                    onClick={() => setSelected(i)}
                  >
                    <strong>{item.name}</strong>
                    <small>{item.group}</small>
                  </button>
                ))}
            </div>
          </section>
          <section className="concept-reading">
            <h2>{a.name}</h2>
            <p>{a.effect}</p>
            <pre className="case-schema">{a.example}</pre>
            <h3>Watch the boundary</h3>
            <p>{a.caveat}</p>
          </section>
        </div>
      ) : (
        <div className="concept-facets">
          {lesson.scenarios.map((s, i) => (
            <button
              key={s.label}
              aria-pressed={selected === i}
              className={selected === i ? "selected" : ""}
              onClick={() => setSelected(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      {tab === "learn" ? (
        <div className="concept-reading">
          <h2>Explain the flow</h2>
          <p>{scenario.idea}</p>
          <ol>
            {scenario.steps.map((s, i) => (
              <li key={i}>{s[2]}</li>
            ))}
          </ol>
        </div>
      ) : (
        <SequencePlayer key={`${id}-${selected}`} scenario={scenario} />
      )}
      <div className="idea-card">
        <h3>Important boundaries</h3>
        <ul>
          {lesson.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
      <p className="learning-source">
        Official references:{" "}
        {lesson.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
            {s.label} ↗{" "}
          </a>
        ))}
      </p>
    </>
  );
}
