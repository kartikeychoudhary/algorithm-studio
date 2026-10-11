"use client";
import { useState } from "react";
import { parseProblem } from "../../lib/algorithms/interview.js";

export default function ProblemEditor({ id, lesson, problem, onApply }) {
  const [text, setText] = useState(problem.values.join(", ")),
    [parameter, setParameter] = useState(String(problem.parameter ?? "")),
    [edges, setEdges] = useState(
      (problem.edges || []).map((e) => e.join(">")).join(", "),
    ),
    [error, setError] = useState("");
  function submit(event) {
    event.preventDefault();
    try {
      const parsed = parseProblem(
        id,
        text,
        parameter.trim() ? Number(parameter) : NaN,
        edges,
      );
      onApply(parsed);
      setError("");
    } catch (error) {
      setError(error.message);
    }
  }
  function preset(index) {
    const preset =
      index === "default"
        ? {
            values: lesson.values,
            parameter: lesson.parameter?.value,
            edges: lesson.edges,
          }
        : lesson.presets[Number(index)];
    setText(preset.values.join(", "));
    setParameter(String(preset.parameter ?? ""));
    setEdges(preset.edges ?? "");
    onApply(
      parseProblem(id, preset.values.join(","), preset.parameter, preset.edges),
    );
    setError("");
  }
  return (
    <form className="problem-editor" onSubmit={submit} noValidate>
      <div className="editor-fields">
        <label className="values-field">
          {id === "topo" ? "Prerequisites · from>to" : "Input values"}
          <input
            aria-label={id === "topo" ? "Prerequisites" : "Input values"}
            value={id === "topo" ? edges : text}
            onChange={(e) =>
              id === "topo" ? setEdges(e.target.value) : setText(e.target.value)
            }
            aria-invalid={!!error}
            aria-describedby={error ? "problem-error" : undefined}
            spellCheck={false}
          />
        </label>
        {lesson.parameter && (
          <label>
            {lesson.parameter.label}
            <input
              type="number"
              value={parameter}
              min={lesson.parameter.min}
              max={lesson.parameter.max}
              onChange={(e) => setParameter(e.target.value)}
            />
          </label>
        )}
        <button className="button primary" type="submit">
          Apply & restart
        </button>
      </div>
      <div className="editor-presets">
        <label>
          Try an example
          <select
            aria-label="Example preset"
            value=""
            onChange={(e) => preset(e.target.value)}
          >
            <option value="" disabled>
              Choose a scenario…
            </option>
            <option value="default">Default example</option>
            {lesson.presets.map((preset, i) => (
              <option key={preset.name} value={i}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <span>Edits apply when you choose Apply & restart.</span>
      </div>
      {error && (
        <p className="input-error" id="problem-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
