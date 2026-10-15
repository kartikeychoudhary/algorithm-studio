"use client";
import { useState } from "react";
import Link from "next/link";
import { incidentLessons, incidentOutcome } from "../../lib/data/incidents.js";
import { useProgress } from "../../hooks/useProgress.js";
import { recoveryTrace } from "../../lib/learning/recovery.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import SimulationCanvas from "../systems/SimulationCanvas.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
function Recovery({ run }) {
  const playback = usePlayback(run);
  const event = run.events[playback.index];
  return (
    <div className="incident-recovery">
      <p role="status">{event.message}</p>
      <SimulationCanvas event={event} />
      <PlaybackControls playback={playback} />
    </div>
  );
}
export default function IncidentLesson({ id }) {
  const l = incidentLessons[id],
    { update } = useProgress(),
    [choice, setChoice] = useState(""),
    [result, setResult] = useState(null),
    [notes, setNotes] = useState("");
  return (
    <div className="incident-lab">
      <section className="incident-brief">
        <span className="overline">INVESTIGATION BRIEF</span>
        <h2>What is happening?</h2>
        <p>{l.signal}</p>
        <table>
          <caption>Observed evidence</caption>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Observation</th>
            </tr>
          </thead>
          <tbody>
            {l.evidence.map(([a, b]) => (
              <tr key={a}>
                <th scope="row">{a}</th>
                <td>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <fieldset className="incident-options">
        <legend>Choose the mitigation that addresses the cause</legend>
        {l.choices.map(([key, label]) => (
          <label key={key}>
            <input
              type="radio"
              name={id}
              value={key}
              checked={choice === key}
              onChange={() => {
                setChoice(key);
                setResult(null);
              }}
            />
            {label}
          </label>
        ))}
        <label className="incident-reason">
          Your reasoning (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            placeholder="Which signal supports your diagnosis? What would you verify?"
          />
        </label>
        <button
          className="button primary"
          disabled={!choice}
          onClick={() => {
            const r = incidentOutcome(id, choice);
            setResult({ ...r, run: recoveryTrace(id, choice) });
            update(id, { challengePassed: r.correct, reviewedAt: Date.now() });
          }}
        >
          Run recovery scenario
        </button>
      </fieldset>
      {result && (
        <section className="incident-result" aria-live="polite">
          <span className="overline">
            {result.correct ? "RECOVERY VERIFIED" : "INVESTIGATE FURTHER"}
          </span>
          <h2>
            {result.correct
              ? "This addresses the modeled cause."
              : "This does not fully resolve the incident."}
          </h2>
          <Recovery key={choice} run={result.run} />
          <div className="incident-comparison">
            <div>
              <small>Before · {l.metric}</small>
              <strong>{l.baseline}</strong>
            </div>
            <span aria-hidden="true">→</span>
            <div>
              <small>After · {l.metric}</small>
              <strong>{result.value}</strong>
            </div>
          </div>
          <p>
            {result.correct
              ? l.why
              : "Compare capacity, operation identity, and the failure window in the evidence. Changing a symptom does not necessarily remove the underlying cause."}
          </p>
          {id === "incident-payment" && choice === "stop" && (
            <p>
              Stopping avoids another attempt but leaves the payment outcome
              unresolved. Reconciliation is still required.
            </p>
          )}
          <details open={result.correct}>
            <summary>Explanation and verification checklist</summary>
            <p>{l.why}</p>
            <h3>Verify recovery</h3>
            <p>{l.verify}</p>
            <h3>Follow-up work</h3>
            <p>{l.followup}</p>
          </details>
        </section>
      )}
      <div className="systems-boundary">
        <h3>Scenario assumptions</h3>
        <p>{l.boundary}</p>
        <p>
          These deterministic scenarios are fictional. Notes stay in this open
          lesson; no production system is contacted.
        </p>
      </div>
      <p>
        Review the concepts:{" "}
        {l.related.map((related, i) => (
          <span key={related}>
            {i ? " · " : ""}
            <Link href={`/lessons/${related}`}>
              {related.replaceAll("-", " ")}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
