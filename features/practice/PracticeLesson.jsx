"use client";
import { useMemo, useState } from "react";
import { compareSearch, debugSearch } from "../../lib/learning/experiments.js";
export { default as Roadmap } from "../guides/StudyGuides.jsx";
import Roadmap from "../guides/StudyGuides.jsx";
export function CompareLab() {
  const [n, setN] = useState(32),
    [target, setTarget] = useState(32),
    [step, setStep] = useState(0);
  const values = useMemo(() => Array.from({ length: n }, (_, i) => i + 1), [n]);
  const run = useMemo(() => compareSearch(values, target), [values, target]);
  const max = Math.max(run.linear.length, run.binary.length);
  return (
    <section className="concept-reading">
      <div className="experiment-controls">
        <label>
          Array size
          <input
            aria-label="Comparison array size"
            type="range"
            min="4"
            max="128"
            value={n}
            onChange={(e) => {
              setN(+e.target.value);
              setStep(0);
            }}
          />
          {n}
        </label>
        <label>
          Target
          <input
            aria-label="Comparison target"
            type="number"
            min="0"
            max="129"
            value={target}
            onChange={(e) => {
              setTarget(
                Math.max(0, Math.min(129, Math.floor(+e.target.value))),
              );
              setStep(0);
            }}
          />
        </label>
      </div>
      <p>
        Input: sorted consecutive values 1 through {n}. Both methods receive the
        same data; sorting cost is excluded because this input is already
        sorted.
      </p>
      <div className="comparison-grid">
        {[
          ["Linear scan", run.linear, run.answer, 1],
          ["Binary search", run.binary, run.bAnswer, 3],
        ].map(([name, trace, result, slots]) => {
          const visible = Math.min(step, trace.length),
            current = trace[Math.max(0, visible - 1)];
          return (
            <article className="idea-card" key={name}>
              <h2>{name}</h2>
              <div className="comparison-track">
                <span
                  style={{ width: `${(visible / Math.max(1, max)) * 100}%` }}
                />
              </div>
              <p>
                Comparisons: <strong>{visible}</strong> / {trace.length}
              </p>
              <p>
                Modeled index variables: <strong>{slots}</strong> · O(1)
                auxiliary space
              </p>
              {visible > 0 && (
                <>
                  <p>
                    Inspect index {current.index} → value {current.value}
                  </p>
                  {current.lo !== undefined && (
                    <p>
                      Bounds: {current.lo}…{current.hi}
                    </p>
                  )}
                </>
              )}
              <p>
                Result: {step >= trace.length ? result : "not yet revealed"}
              </p>
            </article>
          );
        })}
      </div>
      <button
        className="button primary"
        disabled={step >= max}
        onClick={() => setStep((s) => s + 1)}
      >
        Step both approaches
      </button>
      <button className="button" onClick={() => setStep(max)}>
        Finish comparison
      </button>
      <button className="button" onClick={() => setStep(0)}>
        Restart comparison
      </button>
      <p className="small-note">
        Counts are actual value comparisons for these implementations. Memory is
        a simple count of index variables, not measured JavaScript bytes; stored
        visualization traces are excluded. Linear scan is O(n), binary search is
        O(log n) on sorted random-access data.
      </p>
    </section>
  );
}
export function DebugLab() {
  const [fix, setFix] = useState(false),
    [ran, setRan] = useState(false),
    [selected, setSelected] = useState(0);
  const cases = [
    { values: [5], target: 5 },
    { values: [1, 3, 5, 7, 9], target: 9 },
    { values: [1, 3, 5], target: 4 },
  ];
  const results = cases.map((p) => debugSearch(p.values, p.target, fix));
  return (
    <section className="concept-reading">
      <h2>The disappearing last candidate</h2>
      <p>
        This binary search sometimes reports “not found” even though the target
        exists. Edit its loop boundary, then test it.
      </p>
      <pre className="case-schema">{`lo = 0; hi = n - 1\nwhile ${fix ? "lo <= hi" : "lo < hi"}:\n  mid = floor((lo + hi) / 2)\n  if nums[mid] == target: return mid\n  if nums[mid] < target: lo = mid + 1\n  else: hi = mid - 1\nreturn -1`}</pre>
      <label>
        Loop condition
        <select
          aria-label="Binary search loop condition"
          value={fix ? "inclusive" : "strict"}
          onChange={(e) => {
            setFix(e.target.value === "inclusive");
            setRan(false);
          }}
        >
          <option value="strict">lo &lt; hi</option>
          <option value="inclusive">lo &lt;= hi</option>
        </select>
      </label>
      <button className="button primary" onClick={() => setRan(true)}>
        Run boundary tests
      </button>
      {ran && (
        <>
          <div role="status">
            {results.every(
              (r, i) => r.result === cases[i].values.indexOf(cases[i].target),
            )
              ? "All boundary tests pass."
              : "A boundary test fails. Is the final single candidate still inspected?"}
          </div>
          {cases.map((p, i) => (
            <button className="button" key={i} onClick={() => setSelected(i)}>
              Case {i + 1}:{" "}
              {results[i].result === p.values.indexOf(p.target)
                ? "Pass"
                : "Fail"}
            </button>
          ))}
          <p>
            nums={JSON.stringify(cases[selected].values)}, target=
            {cases[selected].target}
          </p>
          <p>
            Expected {cases[selected].values.indexOf(cases[selected].target)},
            returned {results[selected].result}.
          </p>
          <div className="lab-array">
            {cases[selected].values.map((v, i) => (
              <div
                key={i}
                className={v === cases[selected].target ? "cell-current" : ""}
              >
                <strong>{v}</strong>
                <small>{i}</small>
              </div>
            ))}
          </div>
          <ol>
            {results[selected].steps.map((s, i) => (
              <li key={i}>
                lo={s.lo}, hi={s.hi}, mid={s.mid}
              </li>
            ))}
          </ol>
          {!results[selected].steps.length && <p>The loop never executes.</p>}
          <p>
            The search interval is inclusive, so lo == hi still contains one
            possible answer. The termination condition must match the interval
            invariant.
          </p>
        </>
      )}
    </section>
  );
}
export default function PracticeLesson({ id }) {
  return id === "roadmap" ? (
    <Roadmap />
  ) : id === "compare" ? (
    <CompareLab />
  ) : (
    <DebugLab />
  );
}
