"use client";
import { useReducer } from "react";
import { initialReplicas, replicaAction } from "../../lib/learning/models.js";
import { Panel } from "../../components/ui/Panel.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
export default function PartitionLab() {
  const [state, dispatch] = useReducer(
    (s, a) => (a === "reset" ? initialReplicas : replicaAction(s, a)),
    initialReplicas,
  );
  return (
    <div className="graph-layout learning-layout">
      <Panel
        eyebrow="NETWORK PARTITION LAB"
        title="Two replicas, one broken link"
      >
        <div className="concept-controls">
          <label>
            During a partition
            <select
              aria-label="Partition policy"
              value={state.policy}
              onChange={(e) => dispatch(e.target.value)}
            >
              <option value="cp">Prioritize consistency</option>
              <option value="ap">Prioritize availability</option>
            </select>
          </label>
          <button
            className="button"
            onClick={() => dispatch(state.partition ? "heal" : "split")}
          >
            {state.partition ? "Heal network" : "Break network"}
          </button>
        </div>
        <div
          className={`replica-network ${state.partition ? "partitioned" : ""}`}
        >
          <div>
            <span>Replica A · fixed writer</span>
            <strong>v{state.a}</strong>
          </div>
          <span className="replication-link">
            {state.partition ? "× partition" : "⇄ synced"}
          </span>
          <div>
            <span>Replica B · reader</span>
            <strong>v{state.b}</strong>
          </div>
        </div>
        <div className="concept-actions">
          <button className="button primary" onClick={() => dispatch("write")}>
            Write next version on A
          </button>
          <button className="button" onClick={() => dispatch("read")}>
            Read from B
          </button>
          <button className="button" onClick={() => dispatch("reset")}>
            Reset network
          </button>
        </div>
        <div className="reader-snapshot">
          <span className="overline">LAST READ RESPONSE</span>
          <strong>{state.reply}</strong>
        </div>
        <p className="concept-feedback" role="status">
          {state.message}
        </p>
      </Panel>
      <div>
        <CodePanel
          code={[
            "write A; replicate to B when connected",
            "partition: messages cannot cross the link",
            "if isolated and CP: reject read",
            "else: reply with B’s local version",
          ]}
          event={{ line: state.line }}
        />
        <div className="idea-card">
          <span className="overline">TRY THIS</span>
          <p>
            Break the network, write on A, then read B. Switch the policy and
            read again: rejecting a read and returning an old value are
            different tradeoffs.
          </p>
          <p>
            Heal the network to synchronize the replicas. This fixed-writer
            model does not implement elections, quorum protocols, or conflict
            resolution.
          </p>
          <p>
            <strong>Not “pick any two.”</strong> The C/A tradeoff is forced
            during a partition. CAP consistency means linearizability; ACID
            consistency means preserving application invariants.
          </p>
        </div>
      </div>
    </div>
  );
}
