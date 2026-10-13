import { useState } from "react";
import Prediction from "./Prediction.jsx";
export default function PlaybackControls({ playback: p }) {
  const [predict, setPredict] = useState(false);
  const done = p.index === p.total - 1;
  return (
    <>
      {p.run?.events.some((e) => e?.message) && (
        <Prediction playback={p} enabled={predict} setEnabled={setPredict} />
      )}
      <div className="trace-controls">
        <button
          className="button"
          onClick={p.restart}
          aria-label="Restart execution"
        >
          ↺
        </button>
        <button className="button" onClick={p.back} disabled={!p.index}>
          ← Back
        </button>
        <button
          className="button primary"
          onClick={p.toggle}
          disabled={done || predict}
        >
          {p.playing ? "Ⅱ Pause" : "▶ Play"}
        </button>
        <button className="button" onClick={p.step} disabled={done || predict}>
          Step →
        </button>
        <button
          className="button"
          onClick={p.finish}
          disabled={done || predict}
        >
          Finish
        </button>
        <label>
          Speed
          <select
            aria-label="Playback speed"
            value={p.speed}
            onChange={(e) => p.changeSpeed(e.target.value)}
          >
            <option value={850}>Slow</option>
            <option value={450}>Normal</option>
            <option value={100}>Fast</option>
          </select>
        </label>
        <span>
          {p.index + 1} / {p.total}
        </span>
      </div>
    </>
  );
}
