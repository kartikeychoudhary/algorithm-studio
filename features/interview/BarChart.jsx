export default function BarChart({ event, maximum }) {
  return (
    <div
      className="array-visual sorting-bars"
      role="img"
      aria-label="Sorting bar chart: height represents value"
    >
      {event.values.map((value, i) => (
        <div
          key={i}
          className={`sort-column ${event.range && (i < event.range[0] || i > event.range[1]) ? "outside-range" : ""}`}
        >
          <span className="bar-value">{value}</span>
          <div
            className={`sort-bar ${event.selected?.includes(i) ? "resolved" : ""} ${event.active?.includes(i) ? "examining" : ""}`}
            style={{ height: `${24 + (value / Math.max(1, maximum)) * 176}px` }}
            title={`Index ${i}: ${value}`}
          />
          <span className="array-index">{i}</span>
        </div>
      ))}
    </div>
  );
}
