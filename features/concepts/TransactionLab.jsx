"use client";
import { useMemo, useState } from "react";
import { transactionTrace } from "../../lib/learning/models.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import { Panel } from "../../components/ui/Panel.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import EventExplanation from "../../components/execution/EventExplanation.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
export default function TransactionLab() {
  const [amount, setAmount] = useState(30),
    [mode, setMode] = useState("success");
  const run = useMemo(() => transactionTrace(amount, mode), [amount, mode]);
  const playback = usePlayback(run),
    event = run.events[playback.index];
  return (
    <>
      <div className="graph-layout learning-layout">
        <Panel eyebrow="TRANSFER LAB" title="Two accounts. One transaction.">
          <div className="concept-controls">
            <label>
              Transfer amount
              <input
                type="number"
                min="1"
                max="150"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <label>
              Scenario
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="success">Successful commit</option>
                <option value="rollback">Failure after debit</option>
                <option value="recovery">Restart after commit</option>
              </select>
            </label>
          </div>
          <div className="account-pair">
            {event.working.map((balance, i) => (
              <div className="account-card" key={i}>
                <span>Account {i === 0 ? "A" : "B"}</span>
                <strong>{balance}</strong>
                <small>Transaction’s working balance</small>
                <div className="balance-meter">
                  <i
                    style={{ width: `${(Math.max(0, balance) / 150) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="reader-snapshot">
            <span className="overline">
              CONCURRENT READER · COMMITTED VALUES
            </span>
            <strong>
              A: {event.committed[0]} · B: {event.committed[1]}
            </strong>
            <span>
              Combined committed balance:{" "}
              {event.committed.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <div className="journal">
            <span className="overline">DURABLE COMMIT RECORD</span>
            <p>{event.journal}</p>
          </div>
          <EventExplanation event={event} />
        </Panel>
        <div>
          <CodePanel code={run.code} event={event} />
          <div className="idea-card">
            <span className="overline">TRY THIS</span>
            <p>
              Choose “Failure after debit” and step forward. The working copy
              changes, but the reader never sees half a transfer.
            </p>
            <p>
              Try amount 120 to violate the balance rule. Then try “Restart
              after commit” to recover an acknowledged change.
            </p>
            <p className="small-note">
              An in-memory teaching model of durable storage, not a real
              database. Isolation levels can provide different guarantees.
            </p>
          </div>
        </div>
      </div>
      <PlaybackControls playback={playback} />
    </>
  );
}
