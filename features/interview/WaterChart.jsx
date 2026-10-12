export default function WaterChart({ event }) {
  const scale = 160 / Math.max(1, ...event.values);
  return (
    <div
      className="water-chart"
      role="img"
      aria-label={`Elevation bars with ${event.water.reduce((a, b) => a + b, 0)} units of resolved water`}
    >
      {event.values.map((v, i) => (
        <div
          className={`water-column ${event.active.includes(i) ? "active" : ""}`}
          key={i}
        >
          <div className="water-stack">
            <span
              className="water-fill"
              style={{ height: event.water[i] * scale }}
              title={`${event.water[i]} water units`}
            />
            <span
              className="water-ground"
              style={{ height: Math.max(2, v * scale) }}
            />
          </div>
          <strong>{v}</strong>
          <small>{i}</small>
        </div>
      ))}
    </div>
  );
}
