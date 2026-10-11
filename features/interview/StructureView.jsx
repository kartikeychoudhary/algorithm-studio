import { useId } from "react";

export default function StructureView({ event, kind }) {
  const marker = useId(),
    values = kind === "heap" ? event.heap : event.values,
    n = values.length;
  const tree = kind === "tree" || kind === "heap",
    list = kind === "linked";
  const width = list ? Math.max(720, n * 100) : 720;
  const height = list
    ? 220
    : tree
      ? Math.max(260, Math.floor(Math.log2(Math.max(1, n))) * 78 + 105)
      : 340;
  const nodes = values.map((value, i) => {
    if (tree) {
      const depth = Math.floor(Math.log2(i + 1)),
        offset = i - (2 ** depth - 1);
      return {
        x: (720 * (offset + 0.5)) / 2 ** depth,
        y: 42 + depth * 78,
        value,
      };
    }
    if (list)
      return { x: 40 + i * ((width - 80) / Math.max(1, n - 1)), y: 95, value };
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: 360 + 245 * Math.cos(angle),
      y: 165 + 120 * Math.sin(angle),
      value,
    };
  });
  const edges = tree
    ? values.flatMap((_, i) => (i ? [[Math.floor((i - 1) / 2), i]] : []))
    : list
      ? event.next.flatMap((to, from) => (to === null ? [] : [[from, to]]))
      : event.edges;
  return (
    <div className="structure-scroll">
      <svg
        className="structure-view"
        style={list ? { minWidth: width } : undefined}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          list
            ? "Linked list next pointers"
            : tree
              ? `${kind === "heap" ? "Min-heap" : "Binary tree"} diagram`
              : "Course prerequisite graph"
        }
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {edges.map(([from, to], i) => {
          const a = nodes[from],
            b = nodes[to],
            length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
            dx = (b.x - a.x) / length,
            dy = (b.y - a.y) / length;
          const inspecting = event.edge?.[0] === from && event.edge?.[1] === to;
          const sx = a.x + dx * 23,
            sy = a.y + dy * 23,
            ex = b.x - dx * 29,
            ey = b.y - dy * 29;
          const curve = list || from === to;
          const d =
            from === to
              ? `M ${a.x - 14} ${a.y - 17} C ${a.x - 65} ${a.y - 75}, ${a.x + 65} ${a.y - 75}, ${a.x + 14} ${a.y - 17}`
              : curve
                ? `M ${sx} ${sy} Q ${(sx + ex) / 2} ${sy + (to > from ? -40 : 55)} ${ex} ${ey}`
                : `M ${sx} ${sy} L ${ex} ${ey}`;
          return (
            <path
              key={i}
              d={d}
              className={inspecting ? "edge-active" : ""}
              markerEnd={tree ? undefined : `url(#${marker})`}
            />
          );
        })}
        {nodes.map((node, i) => (
          <g
            key={i}
            className={`${event.selected?.includes(i) && kind !== "heap" ? "node-resolved" : ""} ${event.active?.includes(i) && kind !== "heap" ? "node-active" : ""}`}
          >
            <circle cx={node.x} cy={node.y} r="23" />
            <text x={node.x} y={node.y + 5}>
              {node.value}
            </text>
            <text className="node-caption" x={node.x} y={node.y + 43}>
              {list
                ? `#${i} → ${event.next[i] ?? "null"}`
                : event.indegree
                  ? `in: ${event.indegree[i]}`
                  : kind === "heap" && i === 0
                    ? "minimum"
                    : `#${i}`}
            </text>
            {list && (
              <text className="node-pointer" x={node.x} y={node.y - 37}>
                {Object.entries(event.vars)
                  .filter(
                    ([name, value]) =>
                      ["prev", "current", "following"].includes(name) &&
                      value === i,
                  )
                  .map(([name]) => name)
                  .join(" / ")}
              </text>
            )}
          </g>
        ))}
      </svg>
      {!n && <p className="small-note">The heap is empty.</p>}
    </div>
  );
}
