export default function ArrayView({ event }) {
  const { values, active = [], selected = [], range, pointers = {} } = event;
  return (
    <div className="array-visual" aria-label="Array visualization">
      {values.map((value, i) => {
        const outside = range && (i < range[0] || i > range[1]);
        return (
          <div key={i} className={`array-column ${outside ? "outside" : ""}`}>
            <span className="array-pointers">
              {Object.entries(pointers)
                .filter(([, index]) => index === i)
                .map(([name]) => (
                  <b key={name}>{name}</b>
                ))}
            </span>
            <div
              className={`array-value ${selected.includes(i) ? "resolved" : ""} ${active.includes(i) ? "examining" : ""}`}
            >
              <strong>{value}</strong>
            </div>
            <span className="array-index">{i}</span>
          </div>
        );
      })}
    </div>
  );
}
