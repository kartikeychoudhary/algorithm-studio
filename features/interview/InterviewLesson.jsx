"use client";
import { useMemo } from "react";
import { interviewLessons } from "../../lib/data/interview-lessons.js";
import { parseProblem, runInterview } from "../../lib/algorithms/interview.js";
import { useLessonState } from "../../components/layout/StudioProvider.jsx";
import { usePlayback } from "../../hooks/usePlayback.js";
import { Panel, LearningStrip } from "../../components/ui/Panel.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import EventExplanation from "../../components/execution/EventExplanation.jsx";
import VariableWatch from "../../components/execution/VariableWatch.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import ArrayView from "./ArrayView.jsx";
import StructureView from "./StructureView.jsx";
import StatePanels from "./StatePanels.jsx";
import ProblemEditor from "./ProblemEditor.jsx";

export default function InterviewLesson({ id }) {
  const lesson = interviewLessons[id];
  const initial = useMemo(
    () =>
      parseProblem(
        id,
        lesson.values.join(","),
        lesson.parameter?.value,
        lesson.edges,
      ),
    [id, lesson],
  );
  const [problem, setProblem] = useLessonState(id, initial);
  const run = useMemo(() => runInterview(id, problem), [id, problem]);
  const playback = usePlayback(run),
    event = run.events[playback.index];
  return (
    <>
      <LearningStrip tag={`${lesson.space} space`}>
        {lesson.invariant}
      </LearningStrip>
      <ProblemEditor
        id={id}
        lesson={lesson}
        problem={problem}
        onApply={setProblem}
      />
      <div className="graph-layout interview-layout">
        <Panel
          eyebrow="MAKE THE PATTERN VISIBLE"
          title={lesson.label}
          action={
            <span className={`pill ${event.done ? "complete-pill" : ""}`}>
              {event.done ? "Complete" : "Exploring"}
            </span>
          }
        >
          {["linked", "tree", "topo"].includes(id) ? (
            <StructureView event={event} kind={id} />
          ) : (
            <ArrayView event={event} />
          )}
          {id === "heap" && <StructureView event={event} kind="heap" />}
          <div className="graph-legend">
            <span>
              <i className="legend-current" />
              Inspecting
            </span>
            <span>
              <i className="legend-path" />
              Selected / visited
            </span>
            <span>Indices start at 0</span>
          </div>
          <StatePanels event={event} />
          <EventExplanation event={event} />
          <p className="small-note">{lesson.note}</p>
        </Panel>
        <section className="trace-side">
          <CodePanel code={run.code} event={event} />
          <VariableWatch variables={event.vars} />
          <div className="interview-tip">
            <span className="overline">RECOGNIZE THE PATTERN</span>
            <p>{lesson.recognize}</p>
            <span className="overline">COMMON INTERVIEW TRAP</span>
            <p>{lesson.pitfall}</p>
          </div>
        </section>
      </div>
      <PlaybackControls playback={playback} />
    </>
  );
}
