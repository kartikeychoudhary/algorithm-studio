"use client";
import { useMemo } from "react";
import { walkthrough } from "../../lib/learning/models.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import FlowDiagram from "../../components/learning/FlowDiagram.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import EventExplanation from "../../components/execution/EventExplanation.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import { Panel } from "../../components/ui/Panel.jsx";
export default function Walkthrough({ scenario }) {
  const run = useMemo(() => walkthrough(scenario), [scenario]);
  const playback = usePlayback(run);
  const event = run.events[playback.index];
  return (
    <>
      <div className="graph-layout learning-layout">
        <Panel
          eyebrow="FOLLOW THE COLLABORATION"
          title="A concrete example"
          action={
            <span className="pill">
              {playback.index + 1} / {run.events.length}
            </span>
          }
        >
          <FlowDiagram scenario={scenario} event={event} />
          <div className="flow-legend">
            <span>→ Active call / response</span>
            <span>Highlighted box receives the current step</span>
          </div>
          <EventExplanation event={event} />
          <div className="scenario-state">
            <span className="overline">CURRENT RESULT</span>
            <p>
              {scenario.nodes[event.to]}: {event.states[event.to]}
            </p>
          </div>
        </Panel>
        <div>
          <CodePanel code={run.code} event={event} />
          <div className="idea-card">
            <span className="overline">PICTURE IT</span>
            <p>{scenario.analogy}</p>
            <span className="overline">THE IDEA</span>
            <p>{scenario.idea}</p>
          </div>
        </div>
      </div>
      <PlaybackControls playback={playback} />
    </>
  );
}
