import { useId, useRef, useEffect } from "react";
export default function SequenceDiagram({ scenario, event, index }) {
  const marker = useId();
  const scroll = useRef(null);
  const w = Math.max(600, scenario.nodes.length * 145),
    h = scenario.steps.length * 58 + 40;
  useEffect(() => {
    const el = scroll.current;
    if (!el) return;
    const y = 60 + index * 58;
    if (y < el.scrollTop + 60 || y > el.scrollTop + el.clientHeight - 60)
      el.scrollTop = Math.max(0, y - 140);
    const x = ((event.to + 0.5) * w) / scenario.nodes.length;
    if (x < el.scrollLeft + 70 || x > el.scrollLeft + el.clientWidth - 70)
      el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
  }, [index, scenario, w, event.to]);
  return (
    <div
      className="sequence-scroll"
      ref={scroll}
      tabIndex={0}
      aria-label="Scrollable sequence diagram"
    >
      <div className="sequence-participants" style={{ width: w }}>
        {scenario.nodes.map((node, i) => (
          <span
            key={node}
            className={event.from === i || event.to === i ? "lit" : ""}
            style={{ width: w / scenario.nodes.length }}
          >
            {node}
          </span>
        ))}
      </div>
      <svg
        role="img"
        aria-label={`${scenario.label} sequence diagram`}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
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
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        {scenario.nodes.map((node, i) => {
          const x = ((i + 0.5) * w) / scenario.nodes.length;
          return (
            <g key={node}>
              <path className="sequence-lifeline" d={`M${x} 0V${h}`} />
            </g>
          );
        })}
        {scenario.steps.map(([from, to, , code], i) => {
          const x = ((from + 0.5) * w) / scenario.nodes.length,
            y = 35 + i * 58,
            x2 = ((to + 0.5) * w) / scenario.nodes.length;
          return (
            <g key={i} opacity={i <= index ? 1 : 0.65}>
              <path
                className={
                  index === i ? "sequence-message active" : "sequence-message"
                }
                d={from === to ? `M${x} ${y}h48v18h-48` : `M${x} ${y}H${x2}`}
                markerEnd={`url(#${marker})`}
              />
              <text
                className="sequence-step"
                x={from === to ? x + 5 : Math.min(x, x2) + 8}
                y={y - 9}
              >
                {i + 1}. {code.length > 48 ? code.slice(0, 46) + "…" : code}
              </text>
              <title>{`${i + 1}. ${code}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
