"use client";
import { useMemo, useState } from "react";
import { checkpoint } from "../../lib/data/llm-checkpoint.js";
import { vocabulary, trainStep } from "../../lib/learning/llm-model.js";
import { Matrix, fmt } from "./ModelViews.jsx";
export default function TrainingLab({ feature }) {
  const [head, setHead] = useState(checkpoint),
    [target, setTarget] = useState(8),
    [rate, setRate] = useState(0.05),
    [history, setHistory] = useState([]);
  const update = useMemo(
    () => trainStep(feature, target, head, rate),
    [feature, target, head, rate],
  );
  const reset = () => {
    setHead(checkpoint);
    setHistory([]);
  };
  return (
    <section className="llm-training">
      <h2>Teach this prefix a target</h2>
      <p>
        The input prefix above stays fixed. These updates affect only this local
        exercise; the prediction lessons retain their original checkpoint.
      </p>
      <div className="llm-controls">
        <label>
          Target next token
          <select
            aria-label="Training target"
            value={target}
            onChange={(e) => {
              setTarget(Number(e.target.value));
              reset();
            }}
          >
            {vocabulary.map((token, id) => (
              <option key={token} value={id}>
                {token}
              </option>
            ))}
          </select>
        </label>
        <label>
          Learning rate η
          <select
            aria-label="Learning rate"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          >
            {[0.001, 0.01, 0.05, 0.1].map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          disabled={history.length >= 100}
          onClick={() => {
            setHistory([
              ...history,
              { before: update.loss, after: update.afterLoss },
            ]);
            setHead(update.head);
          }}
        >
          Train one step
        </button>
        <button className="button" onClick={reset}>
          Reset weights
        </button>
      </div>
      <div className="llm-metrics" role="status">
        <div>
          <small>Updates</small>
          <strong>{history.length} / 100</strong>
        </div>
        <div>
          <small>P(target)</small>
          <strong>{(update.probabilities[target] * 100).toFixed(2)}%</strong>
        </div>
        <div>
          <small>Loss · nats</small>
          <strong>{update.loss.toFixed(4)}</strong>
        </div>
      </div>
      <div className="llm-equation">
        <strong>Next update preview · target {vocabulary[target]}</strong>
        <code>
          L = −ln({update.probabilities[target].toFixed(6)}) ={" "}
          {update.loss.toFixed(6)}
        </code>
        <code>∂L/∂z[target] = p − 1 = {fmt(update.gradient[target])}</code>
        <code>
          ∂L/∂W[target,0] = {fmt(update.gradient[target])} × {fmt(feature[0])} ={" "}
          {fmt(update.gradient[target] * feature[0])}
        </code>
        <code>
          W′[target,0] = {fmt(head.w[target][0])} − {rate} ×{" "}
          {fmt(update.gradient[target] * feature[0])} ={" "}
          {fmt(update.head.w[target][0])}
        </code>
        <code>
          b′[target] = {fmt(head.b[target])} − {rate} ×{" "}
          {fmt(update.gradient[target])} = {fmt(update.head.b[target])}
        </code>
        <code>
          After this update: loss {update.afterLoss.toFixed(4)}, P(target){" "}
          {(update.after[target] * 100).toFixed(2)}%
        </code>
      </div>
      {history.length > 0 && (
        <div className="llm-loss">
          <h3>Loss on this one example</h3>
          <svg
            viewBox="0 0 660 150"
            role="img"
            aria-label={`Loss decreased from ${history[0].before.toFixed(4)} to ${history.at(-1).after.toFixed(4)}`}
          >
            <line x1="20" y1="130" x2="640" y2="130" />
            <polyline
              points={[history[0].before, ...history.map((h) => h.after)]
                .map(
                  (v, i) =>
                    `${20 + (i * 620) / history.length},${130 - (v / Math.max(history[0].before, 1e-8)) * 110}`,
                )
                .join(" ")}
            />
            <text x="20" y="15">
              {history[0].before.toFixed(3)}
            </text>
            <text x="570" y="148">
              {history.at(-1).after.toFixed(3)}
            </text>
          </svg>
        </div>
      )}
      <Matrix
        title="Output-logit gradients · all candidates"
        rows={update.gradient.map((g, id) => [
          update.probabilities[id],
          id === target ? 1 : 0,
          g,
        ])}
        labels={vocabulary}
      />
      <p className="small-note">
        Columns: d0 = p, d1 = one-hot target y, d2 = p − y. Every candidate’s
        output row changes, not only the target’s row. The chart measures this
        example only.
      </p>
    </section>
  );
}
