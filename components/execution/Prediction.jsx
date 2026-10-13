"use client";
import { useEffect, useState } from "react";
export default function Prediction({ playback: p, enabled, setEnabled }) {
  const [choice, setChoice] = useState(""),
    [checked, setChecked] = useState(false);
  useEffect(() => {
    setChoice("");
    setChecked(false);
  }, [p.index, p.run]);
  const next = p.run?.events[p.index + 1];
  const alternatives = [
    ...new Set([
      next?.message,
      ...(p.run?.events || [])
        .filter((e) => e?.message && e.message !== next?.message)
        .map((e) => e.message),
    ]),
  ]
    .filter(Boolean)
    .slice(0, 3)
    .sort((a, b) => a.localeCompare(b));
  return (
    <section className="prediction-card">
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            p.playing && p.toggle();
            setEnabled(e.target.checked);
          }}
        />{" "}
        Predict before revealing
      </label>
      {enabled &&
        (next ? (
          <>
            <h3>What happens next?</h3>
            <div className="prediction-options">
              {alternatives.map((a) => (
                <label key={a}>
                  <input
                    type="radio"
                    name="prediction"
                    value={a}
                    checked={choice === a}
                    onChange={() => {
                      setChoice(a);
                      setChecked(false);
                    }}
                  />
                  {a}
                </label>
              ))}
            </div>
            <button
              className="button"
              disabled={!choice}
              onClick={() => setChecked(true)}
            >
              Check prediction
            </button>
            {checked && (
              <p role="status">
                {choice === next.message
                  ? "Correct. Explain which invariant supports this decision."
                  : "Not yet. Revisit the current state and try another choice."}
              </p>
            )}
            <button
              className="button primary"
              disabled={!checked || choice !== next.message}
              onClick={p.step}
            >
              Reveal next step →
            </button>
          </>
        ) : (
          <p>You have reached the final step.</p>
        ))}
    </section>
  );
}
