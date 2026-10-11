import { COLS } from "../../lib/data/grid.js";
import { formatValue } from "../../lib/format.js";

export default function GridCanvas({ state, event, onCell }) {
  const path = event.done ? event.path : [];
  return (
    <div
      className="path-grid"
      style={{ "--columns": COLS }}
      aria-label="Editable pathfinding grid"
    >
      {state.cells.map((cost, id) => (
        <button
          key={id}
          onClick={() => onCell(id)}
          className={`path-cell ${cost === -1 ? "wall" : cost === 5 ? "terrain" : ""} ${event.visited.includes(id) ? "visited" : ""} ${event.frontier.includes(id) ? "frontier" : ""} ${path.includes(id) ? "on-path" : ""} ${event.current === id ? "current" : ""} ${event.neighbor === id ? "neighbor" : ""} ${id === state.start ? "source" : ""} ${id === state.goal ? "destination" : ""}`}
          aria-label={`Row ${Math.floor(id / COLS) + 1}, column ${(id % COLS) + 1}: ${id === state.start ? "start" : id === state.goal ? "goal" : cost === -1 ? "wall" : `cost ${cost}`}`}
        >
          {id === state.start
            ? "S"
            : id === state.goal
              ? "G"
              : cost === -1
                ? ""
                : cost === 5
                  ? "5"
                  : Number.isFinite(event.distances[id])
                    ? formatValue(event.distances[id])
                    : ""}
        </button>
      ))}
    </div>
  );
}
