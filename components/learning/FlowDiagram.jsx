import { useId } from "react";
export default function FlowDiagram({ scenario, event }) {
  const marker = useId();
  const positions =
    scenario.nodes.length <= 3
      ? [
          [250, 65],
          [250, 200],
          [250, 335],
        ]
      : [
          [125, 65],
          [375, 65],
          [125, 245],
          [375, 245],
          [125, 425],
        ];
  const height =
    scenario.nodes.length <= 3 ? 400 : scenario.nodes.length === 4 ? 310 : 490;
  const activeEdge = [event.from, event.to];
  const links = [...scenario.edges];
  if (!links.some(([a, b]) => a === activeEdge[0] && b === activeEdge[1]))
    links.push(activeEdge);
  return (
    <div className="flow-scroll">
      <svg
        viewBox={`0 0 500 ${height}`}
        className="flow-diagram"
        role="img"
        aria-label={`${scenario.label || "Scenario"} interaction diagram`}
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
            <path d="M0 0 L10 5 L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        {links.map(([from, to], i) => {
          const a = positions[from],
            b = positions[to],
            dx = b[0] - a[0],
            dy = b[1] - a[1],
            scale = Math.max(Math.abs(dx) / 100, Math.abs(dy) / 43),
            ox = dx / scale,
            oy = dy / scale;
          return (
            <path
              key={i}
              className={`flow-wire ${from === event.from && to === event.to ? "flow-current" : ""}`}
              d={
                dx === 0 && Math.abs(dy) > 200
                  ? `M${a[0] + 100} ${a[1]} C490 ${a[1]} 490 ${b[1]} ${b[0] + 100} ${b[1]}`
                  : `M${a[0] + ox} ${a[1] + oy} L${b[0] - ox} ${b[1] - oy}`
              }
              markerEnd={`url(#${marker})`}
            />
          );
        })}
        {scenario.nodes.map((node, i) => {
          const [x, y] = positions[i];
          return (
            <g
              key={i}
              className={
                i === event.to
                  ? "flow-node receiving"
                  : i === event.from
                    ? "flow-node sending"
                    : "flow-node"
              }
            >
              <title>
                {node}: {event.states[i]}
              </title>
              <rect x={x - 100} y={y - 42} width="200" height="84" rx="12" />
              <text x={x} y={y - 13} className="flow-role">
                {node}
              </text>
              <text x={x} y={y + 15} className="flow-value">
                {event.states[i].length > 27
                  ? `${event.states[i].slice(0, 25)}…`
                  : event.states[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
