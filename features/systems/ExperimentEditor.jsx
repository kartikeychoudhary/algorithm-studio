import { useState } from "react";
const label = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
export default function ExperimentEditor({ lesson, input, onApply }) {
  const [draft, setDraft] = useState(() =>
      Object.fromEntries(
        Object.entries(input).map(([k, v]) => [
          k,
          Array.isArray(v) ? JSON.stringify(v) : String(v),
        ]),
      ),
    ),
    [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    try {
      if (Object.values(draft).some((value) => !value.trim()))
        throw new Error("Fill in every experiment setting before applying.");
      const parsed = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [
          k,
          Array.isArray(v)
            ? JSON.parse(draft[k])
            : typeof v === "number"
              ? Number(draft[k])
              : draft[k],
        ]),
      );
      onApply(parsed);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="systems-editor" onSubmit={submit}>
      <h2>Experiment settings</h2>
      <div className="systems-fields">
        {Object.entries(input).map(([key, value]) => (
          <label key={key}>
            {label(key)}
            {lesson.options[key] ? (
              <select
                aria-label={label(key)}
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              >
                {lesson.options[key].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-label={label(key)}
                type={typeof value === "number" ? "number" : "text"}
                step={typeof value === "number" ? "any" : undefined}
                value={draft[key]}
                maxLength={240}
                spellCheck={false}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <p className="small-note">
        Arrays use JSON notation. Inputs are bounded to keep each trace
        readable.
      </p>
      <button className="button primary" type="submit">
        Apply experiment
      </button>
      {error && (
        <p role="alert" className="systems-error">
          {error}
        </p>
      )}
    </form>
  );
}
