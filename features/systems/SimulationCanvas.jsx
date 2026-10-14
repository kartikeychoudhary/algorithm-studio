import { useId } from "react";
const f = (n) => Number(n).toFixed(2);
export function SystemGraph({ nodes, links, layout }) {
  const marker = useId();
  if (!nodes.length) return null;
  let positions,
    width = 760,
    height;
  if (layout === "tree") {
    const levels = Array(nodes.length).fill(0),
      queue = [0],
      seen = new Set();
    while (queue.length) {
      const i = queue.shift();
      if (seen.has(i)) continue;
      seen.add(i);
      for (const [a, b] of links)
        if (a === i) {
          levels[b] = levels[a] + 1;
          queue.push(b);
        }
    }
    const groups = Array.from({ length: Math.max(...levels) + 1 }, (_, level) =>
      nodes.map((_, i) => i).filter((i) => levels[i] === level),
    );
    width = Math.max(760, ...groups.map((g) => g.length * 240));
    height = groups.length * 135 + 20;
    positions = nodes.map((_, i) => {
      const group = groups[levels[i]];
      return [
        ((group.indexOf(i) + 0.5) * width) / group.length,
        65 + levels[i] * 135,
      ];
    });
  } else {
    const columns = nodes.length <= 2 ? 2 : nodes.length <= 9 ? 3 : 4;
    width = columns * 250 + 10;
    height = Math.ceil(nodes.length / columns) * 145 + 20;
    positions = nodes.map((_, i) => [
      130 + (i % columns) * 250,
      70 + Math.floor(i / columns) * 145,
    ]);
  }
  return (
    <div
      className="systems-graph-scroll"
      tabIndex={0}
      aria-label="System state diagram"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: Math.min(width, 640) }}
        role="img"
        aria-label="Participants and current relationships"
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
            <path d="M0 0 L10 5 L0 10Z" fill="currentColor" />
          </marker>
        </defs>
        {links.map(([a, b], i) => {
          if (!positions[a] || !positions[b]) return null;
          const [x, y] = positions[a],
            [u, v] = positions[b];
          const dx = u - x,
            dy = v - y,
            scale = Math.max(Math.abs(dx) / 100, Math.abs(dy) / 38, 1),
            ox = dx / scale,
            oy = dy / scale;
          return (
            <path
              key={i}
              className="systems-wire"
              d={
                a === b
                  ? `M${x + 60} ${y - 36} C${x + 155} ${y - 100} ${x + 155} ${y + 100} ${x + 60} ${y + 36}`
                  : `M${f(x + ox)} ${f(y + oy)} L${f(u - ox)} ${f(v - oy)}`
              }
              markerEnd={`url(#${marker})`}
            />
          );
        })}
        {nodes.map((n, i) => {
          const [x, y] = positions[i];
          return (
            <g key={i} className={`systems-node ${n.status || ""}`}>
              <title>{`${n.label}: ${n.value}`}</title>
              <rect
                x={f(x - 100)}
                y={f(y - 38)}
                width="200"
                height="76"
                rx="12"
              />
              <text x={f(x)} y={f(y - 10)}>
                {n.label.length > 26 ? n.label.slice(0, 24) + "…" : n.label}
              </text>
              <text x={f(x)} y={f(y + 17)} className="systems-node-value">
                {n.value.length > 29 ? n.value.slice(0, 27) + "…" : n.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function Ring({ points }) {
  const owners = [...new Set(points.map((p) => p.name))].sort();
  return (
    <div className="systems-ring-layout">
      <svg
        className="systems-ring"
        viewBox="0 0 500 420"
        role="img"
        aria-label="Consistent hash ring with virtual node positions"
      >
        <circle cx="250" cy="210" r="145" className="systems-ring-track" />
        <text x="250" y="205" textAnchor="middle">
          Clockwise ownership
        </text>
        <text x="250" y="228" textAnchor="middle">
          0 … 999
        </text>
        <path className="ring-direction" d="M250 49 L258 57 L247 62" />
        {points.map((n, i) => {
          const angle = (n.point / 1000) * Math.PI * 2 - Math.PI / 2;
          return (
            <g key={i}>
              <title>{`${n.name} at ${n.point}`}</title>
              <circle
                cx={f(250 + 145 * Math.cos(angle))}
                cy={f(210 + 145 * Math.sin(angle))}
                r="7"
                className={`ring-${n.name}`}
              />
            </g>
          );
        })}
      </svg>
      <div className="systems-ring-legend">
        <h3>Server positions</h3>
        <p className="small-note">
          Colors identify owners; positions increase clockwise from the top.
        </p>
        <dl>
          {owners.map((owner) => (
            <div key={owner}>
              <dt>
                <i className={`ring-${owner}`} aria-hidden="true" />
                Server {owner}
              </dt>
              <dd>
                {points
                  .filter((p) => p.name === owner)
                  .map((p) => p.point)
                  .join(" · ")}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
function Scatter({ points, query }) {
  const length = Math.hypot(...query),
    q = query.map((v) => v / length);
  return (
    <svg
      className="systems-scatter"
      viewBox="0 0 400 340"
      role="img"
      aria-label="Vector directions and normalized query"
    >
      <circle cx="200" cy="170" r="130" />
      <path d="M50 170 H350 M200 20 V320" />
      {points.map(([x, y], i) => (
        <g key={i}>
          <line x1="200" y1="170" x2={f(200 + x * 130)} y2={f(170 - y * 130)} />
          <circle
            className="vector-dot"
            cx={f(200 + x * 130)}
            cy={f(170 - y * 130)}
            r="5"
          />
          <text x={f(208 + x * 130)} y={f(164 - y * 130)}>
            {i}
          </text>
        </g>
      ))}
      <path
        className="query-vector"
        d={`M200 170 L${f(200 + q[0] * 130)} ${f(170 - q[1] * 130)}`}
      />
      <text x="15" y="333">
        Teal: normalized query direction
      </text>
    </svg>
  );
}
export default function SimulationCanvas({ event: e }) {
  const max = Math.max(1e-9, ...e.bars.map((b) => Math.abs(b.value)));
  return (
    <div className="systems-canvas">
      {Object.keys(e.metrics).length > 0 && (
        <dl className="systems-metrics">
          {Object.entries(e.metrics).map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {e.nodes.length > 0 && (
        <>
          <SystemGraph nodes={e.nodes} links={e.links} layout={e.layout} />
          <details className="systems-details">
            <summary>Read every participant’s state</summary>
            <dl>
              {e.nodes.map((n, i) => (
                <div key={i}>
                  <dt>{n.label}</dt>
                  <dd>{n.value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
      {e.ring && <Ring points={e.ring} />}
      {e.scatter && <Scatter {...e.scatter} />}
      {e.cells && (
        <div className="systems-cells" aria-label="Bit array">
          {e.cells.map((c, i) => (
            <div key={i} className={c.active ? "active" : ""}>
              <small>bit {c.label}</small>
              <strong>{c.value}</strong>
            </div>
          ))}
        </div>
      )}
      {e.timeline.length > 0 && (
        <section>
          <h3>Execution timeline</h3>
          <div
            className="systems-timeline"
            tabIndex={0}
            aria-label="Execution timeline"
          >
            {e.timeline.map((t, i) => (
              <div
                key={i}
                className={t.label === "switch" ? "overhead" : ""}
                style={{
                  flexGrow: t.duration,
                  minWidth: Math.max(44, t.duration * 18),
                }}
              >
                <strong>{t.label}</strong>
                <small>
                  {t.duration} tick{t.duration === 1 ? "" : "s"}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      {e.bars.length > 0 && (
        <section className="systems-bars" aria-label="Computed comparison">
          {e.bars.map((b, i) => (
            <div key={i}>
              <span>{b.label}</span>
              <div>
                <i
                  className={b.value < 0 ? "negative" : ""}
                  style={{
                    width: `${((Math.abs(b.value) / max) * 100).toFixed(3)}%`,
                  }}
                />
              </div>
              <strong>
                {Number.isInteger(b.value) ? b.value : b.value.toFixed(3)}
              </strong>
            </div>
          ))}
          <p className="small-note">
            Lengths show magnitude on a shared scale for this frame; labels
            retain the sign and value.
          </p>
        </section>
      )}
      {e.rows.length > 0 && (
        <div
          className="systems-table-scroll"
          tabIndex={0}
          aria-label="Computed state table"
        >
          <table>
            <thead>
              <tr>
                {e.columns.map((c, i) => (
                  <th key={i}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {e.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
