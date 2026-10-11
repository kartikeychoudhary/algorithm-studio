import { useId } from "react";
import { formatValue } from "../../lib/format.js";

export default function NetworkGraph({
  nodes,
  edges,
  event,
  start,
  goal,
  directed,
}) {
  const marker = useId();
  const path = event.done ? event.path : [];
  return (
    <svg
      className="route-graph"
      viewBox="0 0 660 360"
      role="img"
      aria-label={
        directed ? "Directed airport network" : "Weighted undirected graph"
      }
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10z" fill="context-stroke" />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const a = nodes[edge.from],
          b = nodes[edge.to],
          dx = b.x - a.x,
          dy = b.y - a.y,
          length = Math.hypot(dx, dy);
        const onPath = path.some(
          (node, j) =>
            j > 0 &&
            ((path[j - 1] === edge.from && node === edge.to) ||
              (!directed && path[j - 1] === edge.to && node === edge.from)),
        );
        const active = directed
          ? event.edge?.from === edge.from && event.edge?.to === edge.to
          : (event.current === edge.from && event.neighbor === edge.to) ||
            (event.current === edge.to && event.neighbor === edge.from);
        return (
          <g
            key={i}
            className={`route-edge ${edge.enabled === false ? "off" : ""} ${onPath ? "on-path" : ""} ${active ? "inspecting" : ""}`}
          >
            <line
              x1={a.x + (dx / length) * 27}
              y1={a.y + (dy / length) * 27}
              x2={b.x - (dx / length) * 30}
              y2={b.y - (dy / length) * 30}
              markerEnd={directed ? `url(#${marker})` : undefined}
            />
            <rect
              x={(a.x + b.x) / 2 - 20}
              y={(a.y + b.y) / 2 - 11}
              width="40"
              height="22"
              rx="6"
            />
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 4}>
              {edge.weight}
            </text>
          </g>
        );
      })}
      {nodes.map((node, i) => (
        <g
          key={i}
          className={`route-node ${(event.visited || []).includes(i) ? "visited" : ""} ${(event.frontier || []).includes(i) ? "frontier" : ""} ${path.includes(i) ? "on-path" : ""} ${event.current === i ? "current" : ""} ${i === start ? "source" : ""} ${i === goal ? "destination" : ""}`}
        >
          <circle cx={node.x} cy={node.y} r="26" />
          <text x={node.x} y={node.y + 5}>
            {node.label}
          </text>
          <text className="node-distance" x={node.x} y={node.y + 46}>
            {i === start ? "START · " : i === goal ? "GOAL · " : ""}
            {formatValue(event.distances[i])}
          </text>
        </g>
      ))}
    </svg>
  );
}
