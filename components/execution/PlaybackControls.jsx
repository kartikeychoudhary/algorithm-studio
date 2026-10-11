export default function PlaybackControls({ playback: p }) {
  const done = p.index === p.total - 1;
  return (
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
      <button className="button primary" onClick={p.toggle} disabled={done}>
        {p.playing ? "Ⅱ Pause" : "▶ Play"}
      </button>
      <button className="button" onClick={p.step} disabled={done}>
        Step →
      </button>
      <button className="button" onClick={p.finish} disabled={done}>
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
  );
}
