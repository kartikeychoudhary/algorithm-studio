import { formatValue } from "../../lib/format.js";
function Chips({ title, values }) {
  return (
    <div className="state-shelf">
      <span className="overline">{title}</span>
      <div className="value-chips">
        {values.length ? (
          values.map((value, i) => <span key={i}>{formatValue(value)}</span>)
        ) : (
          <em>Empty</em>
        )}
      </div>
    </div>
  );
}
export default function StatePanels({ event }) {
  return (
    <>
      {event.buffer && <Chips title="MERGE BUFFER" values={event.buffer} />}
      {event.stack && (
        <Chips title="STACK / PATH · TOP AT RIGHT" values={event.stack} />
      )}
      {event.queue && (
        <Chips title="READY QUEUE · NEXT AT LEFT" values={event.queue} />
      )}
      {event.entries && (
        <div className="state-shelf">
          <span className="overline">
            {event.entriesTitle || "SEEN MAP · VALUE → ORIGINAL INDEX"}
          </span>
          <div className="value-chips">
            {event.entries.length ? (
              event.entries.map(([key, value]) => (
                <span key={key}>
                  {key} <b>→</b> {value}
                </span>
              ))
            ) : (
              <em>No values stored yet</em>
            )}
          </div>
        </div>
      )}
      {event.output && <Chips title="OUTPUT" values={event.output} />}
      {event.dp && (
        <div className="state-shelf">
          <span className="overline">
            {event.dpTitle || "MINIMUM COINS BY AMOUNT"}
          </span>
          <div className="coin-table">
            {event.dp.map((value, i) => (
              <div
                key={i}
                className={`${event.dpCurrent === i ? "current" : ""} ${event.dependency === i ? "dependency" : ""}`}
              >
                <small>{i}</small>
                <strong>{formatValue(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      {event.subsets && (
        <div className="state-shelf">
          <span className="overline">
            SUBSETS FOUND · {event.subsets.length}
          </span>
          <div className="subset-results">
            {event.subsets.map((subset, i) => (
              <span key={i}>[{subset.join(", ")}]</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
