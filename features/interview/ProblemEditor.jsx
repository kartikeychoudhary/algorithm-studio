"use client";
import { useState } from "react";
import { parseProblem } from "../../lib/algorithms/interview.js";

export default function ProblemEditor({ id, lesson, problem, onApply }) {
  const [text, setText] = useState(JSON.stringify(problem.values)),
    [parameter, setParameter] = useState(String(problem.parameter ?? "")),
    [edges, setEdges] = useState(
      JSON.stringify(
        (problem.edges || []).map(([from, to]) =>
          id === "topo" ? [to, from] : [from, to],
        ),
      ),
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
    setText(JSON.stringify(preset.values));
    setParameter(String(preset.parameter ?? ""));
    setEdges(preset.edges ?? "");
    onApply(
      parseProblem(
        id,
        JSON.stringify(preset.values),
        preset.parameter,
        preset.edges,
      ),
    );
    setError("");
  }
  return (
    <form className="problem-editor" onSubmit={submit} noValidate>
      <div className="editor-fields">
        <label className="values-field">
          {lesson.problem.input}
          <input
            aria-label={lesson.problem.input}
            value={["topo", "union"].includes(id) ? edges : text}
            onChange={(e) =>
              ["topo", "union"].includes(id)
                ? setEdges(e.target.value)
                : setText(e.target.value)
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
            <option value="default">LeetCode example</option>
            {lesson.presets.map((preset, i) => (
              <option key={preset.name} value={i}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <span>Edits apply when you choose Apply & restart.</span>
      </div>
      <p className="small-note editor-hint">
        {["merge", "quick"].includes(id)
          ? "Use 1–16 integers from 0 to 100. Small values keep a visible minimum bar height."
          : id === "tree"
            ? "Level-order array: use null for a missing child, for example [1,null,2,3]."
            : id === "union"
              ? "Each connection is an undirected pair [a,b]. The visualization shows union–find parent pointers."
              : id === "topo"
                ? "Each pair is [course, prerequisite]. The arrow goes from the prerequisite to its course."
                : "Use array notation, for example [1,2,3]. Apply your edits to start a new trace."}
      </p>
      {error && (
        <p className="input-error" id="problem-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
