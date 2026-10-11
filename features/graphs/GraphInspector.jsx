import CodePanel from "../../components/execution/CodePanel.jsx";
import VariableWatch from "../../components/execution/VariableWatch.jsx";
import EventExplanation from "../../components/execution/EventExplanation.jsx";
import { GRAPH_CODE } from "../../lib/algorithms/graphs.js";
import { formatValue as fmt } from "../../lib/format.js";
export default function GraphInspector({ algorithm, run, event, playback }) {
  const flights = algorithm === "flights",
    weighted = ["dijkstra", "astar"].includes(algorithm);
  const label = (id) => (id == null ? "—" : run.nodes[id].label);
  const variables = flights
    ? {
        round: event.round,
        from: label(event.edge?.from),
        to: label(event.edge?.to),
        candidate: event.candidate,
      }
    : {
        current: label(event.current),
        neighbor: label(event.neighbor),
        g: event.current == null ? null : event.distances[event.current],
        ...(algorithm === "astar"
          ? {
              h: event.h,
              f:
                event.current == null
                  ? null
                  : event.distances[event.current] + event.h,
            }
          : {}),
        candidate: event.candidate,
      };
  return (
    <section className="trace-side">
      <div className="panel-heading">
        <div>
          <span className="overline">FOLLOW THE EXECUTION</span>
          <h2>
            {flights
              ? "One extra flight per round."
              : "See the code become a path."}
          </h2>
        </div>
        <span className="pill">
          {playback.index + 1} / {run.events.length}
        </span>
      </div>
      <CodePanel code={GRAPH_CODE[algorithm]} event={event} />
      <EventExplanation event={event} />
      <VariableWatch variables={variables} />
      {flights ? (
        <div className="distance-table">
          <table>
            <thead>
              <tr>
                <th>Airport</th>
                <th>Previous</th>
                <th>Next</th>
              </tr>
            </thead>
            <tbody>
              {run.nodes.map((node, i) => (
                <tr key={i}>
                  <th>{node.label}</th>
                  <td>{fmt(event.distances[i])}</td>
                  <td
                    className={
                      event.next[i] < event.distances[i] ? "improved" : ""
                    }
                  >
                    {fmt(event.next[i])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="frontier-box">
          <span className="overline">
            {algorithm === "dfs"
              ? "STACK · NEXT POP FIRST"
              : algorithm === "bfs"
                ? "QUEUE · NEXT OUT FIRST"
                : "PRIORITY QUEUE · LOWEST FIRST"}
          </span>
          <div>
            {event.frontier.length ? (
              event.frontier.map((id) => (
                <span key={id}>
                  {label(id)}
                  {weighted && <small>g={fmt(event.distances[id])}</small>}
                </span>
              ))
            ) : (
              <em>Empty</em>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
