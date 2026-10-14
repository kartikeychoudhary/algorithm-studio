import { DIM, vocabulary, dot, weights } from "../../lib/learning/llm-model.js";
import { useMemo, useState } from "react";
import { usePlayback } from "../../hooks/usePlayback.js";
export const fmt = (n) => (Number.isFinite(n) ? n.toFixed(3) : "−∞");
function DotProduct({ q, k }) {
  const run = useMemo(
    () => ({
      events: q.map((v, i) => ({
        product: v * k[i],
        sum: q.slice(0, i + 1).reduce((s, x, d) => s + x * k[d], 0),
      })),
    }),
    [q, k],
  );
  const p = usePlayback(run);
  return (
    <div className="llm-dot-lab">
      <div className="llm-section-title">
        <h3>Watch the dot product accumulate</h3>
        <button
          className="button"
          onClick={() => (p.index === p.total - 1 ? p.restart() : p.toggle())}
        >
          {p.index === p.total - 1
            ? "Reset multiplication"
            : p.playing
              ? "Pause multiplication"
              : "Animate multiplication"}
        </button>
      </div>
      <div className="llm-dot-cells">
        {q.map((v, i) => (
          <div
            key={i}
            className={i === p.index ? "active" : i < p.index ? "complete" : ""}
          >
            <small>d{i}</small>
            <span>{fmt(v)}</span>
            <span>× {fmt(k[i])}</span>
            <strong>{i <= p.index ? fmt(v * k[i]) : "…"}</strong>
          </div>
        ))}
      </div>
      <p role="status">
        Accumulated {p.index + 1} / {q.length} products:{" "}
        <strong>{fmt(run.events[p.index].sum)}</strong>
        {p.index === p.total - 1 ? " = q · k" : ""}
      </p>
      <p className="small-note">
        The animation serializes the multiply-and-add for learning; actual
        accelerators evaluate many products in parallel. Displayed values are
        rounded; calculations retain full precision.
      </p>
    </div>
  );
}
export function Matrix({ title, rows, labels }) {
  return (
    <div className="llm-matrix">
      <h3>{title}</h3>
      <div className="llm-overflow" tabIndex={0} aria-label={`${title} matrix`}>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              {rows[0]?.map((_, i) => (
                <th key={i}>d{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <th>{labels?.[i] ?? i}</th>
                {row.map((v, j) => (
                  <td
                    key={j}
                    style={{
                      background: `rgba(${v >= 0 ? "143,112,237" : "54,166,167"},${Math.min(0.5, Math.abs(v) * 0.17).toFixed(2)})`,
                    }}
                  >
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function TokenRibbon({ ids, selected, onSelect }) {
  return (
    <div className="llm-token-ribbon" aria-label="Token sequence">
      {ids.map((id, i) => (
        <button
          type="button"
          className={i === selected ? "active" : ""}
          aria-pressed={i === selected}
          key={i}
          onClick={() => onSelect?.(i)}
        >
          <strong>{vocabulary[id]}</strong>
          <small>
            pos {i} · ID {id}
          </small>
        </button>
      ))}
    </div>
  );
}
export function Pipeline({ stage, onSelect }) {
  const names = [
    "Tokens",
    "Embedding",
    "Q · K · V",
    "Attention",
    "Mix values",
    "Feed-forward",
    "Logits",
    "Softmax",
    "Next token",
  ];
  return (
    <div className="llm-pipeline" aria-label="Prediction pipeline">
      {names.map((name, i) => (
        <button
          key={name}
          className={`${i === stage ? "active" : ""} ${i < stage ? "complete" : ""}`}
          aria-current={i === stage ? "step" : undefined}
          onClick={() => onSelect(i)}
        >
          <span>{i < stage ? "✓" : String(i + 1).padStart(2, "0")}</span>
          {name}
          <i aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
export function AttentionView({
  state,
  query,
  setQuery,
  keyIndex,
  setKeyIndex,
}) {
  const q = state.q[query],
    k = state.k[keyIndex],
    blocked = keyIndex > query;
  const products = q.map((x, i) => x * k[i]),
    raw = dot(q, k);
  return (
    <section className="llm-attention">
      <h3>Causal attention · query rows × key columns</h3>
      <p className="small-note">
        Select any cell. Brighter cells carry more weight; the future triangle
        is blocked.
      </p>
      <div className="llm-overflow" tabIndex={0} aria-label="Attention matrix">
        <table>
          <thead>
            <tr>
              <th>Q ↓ / K →</th>
              {state.ids.map((id, i) => (
                <th key={i}>
                  {i}: {vocabulary[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.attention.map((row, i) => (
              <tr key={i}>
                <th>
                  {i}: {vocabulary[state.ids[i]]}
                </th>
                {row.map((a, j) => (
                  <td key={j}>
                    <button
                      className={
                        i === query && j === keyIndex ? "selected" : ""
                      }
                      style={{
                        background:
                          j > i
                            ? "transparent"
                            : `rgba(137,104,230,${(0.1 + a * 0.8).toFixed(2)})`,
                      }}
                      aria-label={`Query ${i}, key ${j}: ${j > i ? "masked" : (a * 100).toFixed(1) + " percent"}`}
                      onClick={() => {
                        setQuery(i);
                        setKeyIndex(j);
                      }}
                    >
                      {j > i ? "×" : (a * 100).toFixed(1) + "%"}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="llm-equation">
        <strong>
          {vocabulary[state.ids[query]]} at {query} →{" "}
          {vocabulary[state.ids[keyIndex]]} at {keyIndex}
        </strong>
        <code>
          q · k = {products.map(fmt).join(" + ")} = {fmt(raw)}
        </code>
        <code>
          score = {fmt(raw)} / √{DIM} = {fmt(raw / Math.sqrt(DIM))}
          {blocked ? " → masked to −∞" : ""}
        </code>
        <code>
          A[{query},{keyIndex}] = {fmt(state.attention[query][keyIndex])} · row
          sum = {fmt(state.attention[query].reduce((a, b) => a + b, 0))}
        </code>
      </div>
      <div
        className="llm-arcs"
        aria-label="Attention contributions to selected query"
      >
        <svg
          viewBox={`0 0 720 180`}
          role="img"
          aria-label="Line thickness represents attention weight"
        >
          <text x="360" y="22" textAnchor="middle">
            Query: {vocabulary[state.ids[query]]} · position {query}
          </text>
          {state.ids.map((id, j) => {
            const x = 36 + (j * 648) / Math.max(1, state.ids.length - 1),
              a = state.attention[query][j];
            return (
              <g key={j}>
                <path
                  className={a ? "llm-signal" : ""}
                  d={`M360 35 Q${x} 65 ${x} 130`}
                  strokeWidth={(a ? 1 + a * 8 : 1).toFixed(3)}
                  opacity={(a ? 0.3 + a * 0.7 : 0.14).toFixed(3)}
                  fill="none"
                />
                <text x={x} y="153" textAnchor="middle">
                  {vocabulary[id]}
                </text>
                <text x={x} y="173" textAnchor="middle">
                  {(a * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <DotProduct q={q} k={k} />
      <Matrix
        title="Selected query, key, and weighted value"
        rows={[
          q,
          k,
          state.v[keyIndex],
          state.v[keyIndex].map((v) => v * state.attention[query][keyIndex]),
        ]}
        labels={["q", "k", "v", "A × v"]}
      />
      <p className="small-note">
        The weighted values from every allowed key are added coordinate by
        coordinate. Line widths and table values use the computed weights, not a
        scripted animation.
      </p>
    </section>
  );
}
export function Distribution({ state, greedy }) {
  return (
    <section className="llm-distribution">
      <div className="llm-section-title">
        <h3>Every vocabulary candidate</h3>
        <span>Entropy {state.entropy.toFixed(2)} bits</span>
      </div>
      <p className="small-note">
        Bars: final sampling probabilities. Muted rows were filtered out. Base =
        softmax(logit / temperature).
      </p>
      <div
        className="llm-candidates"
        tabIndex={0}
        aria-label="Vocabulary probability distribution"
      >
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Logit</th>
              <th>Base</th>
              <th>Final probability</th>
            </tr>
          </thead>
          <tbody>
            {state.ranked.map(({ id, p }) => (
              <tr
                className={`${state.probabilities[id] ? "" : "filtered"} ${state.selected === id ? "chosen" : ""}`}
                key={id}
              >
                <th>
                  {vocabulary[id]}
                  {state.selected === id ? " ←" : ""}
                </th>
                <td>{fmt(state.logits[id])}</td>
                <td>{(p * 100).toFixed(2)}%</td>
                <td>
                  <div className="llm-prob-bar">
                    <i
                      style={{
                        width: `${(state.probabilities[id] * 100).toFixed(3)}%`,
                      }}
                    />
                    <span>{(state.probabilities[id] * 100).toFixed(2)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="llm-equation">
        <strong>
          {greedy ? "Greedy selection" : "The actual random draw"}
        </strong>
        <code>
          {greedy
            ? `argmax(z) → ${vocabulary[state.selected]}`
            : `u = ${state.draw.toFixed(6)} → ${vocabulary[state.selected]}`}
        </code>
        {!greedy && (
          <code>
            {state.intervals
              .filter((x) => x.id === state.selected)
              .map((x) => `${x.start.toFixed(6)} ≤ u < ${x.end.toFixed(6)}`)}
          </code>
        )}
      </div>
      <div className="llm-cdf" aria-label="Cumulative sampling intervals">
        {state.intervals.map((x, i) => (
          <div
            key={x.id}
            style={{
              width: `${((x.end - x.start) * 100).toFixed(3)}%`,
              background: `hsl(${245 + i * 37} 48% 48%)`,
            }}
            title={`${vocabulary[x.id]}: ${x.start.toFixed(4)}–${x.end.toFixed(4)}`}
          >
            {x.end - x.start > 0.06 ? vocabulary[x.id] : ""}
          </div>
        ))}
        {!greedy && <i style={{ left: `${(state.draw * 100).toFixed(3)}%` }} />}
      </div>
      <p className="small-note">
        Intervals are ordered by descending probability. The marker lands in the
        selected token’s interval. Greedy mode ignores the sampling
        distribution.
      </p>
    </section>
  );
}
export function WeightInspector({ head }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="llm-weights"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Inspect the actual model parameters</summary>
      {open && (
        <>
          <p className="small-note">
            All matrices are the ones used in this forward pass. Projections use
            row vectors xW; the output head stores one row per token. LayerNorm
            uses γ=1, β=0, ε=10⁻⁵. Feed-forward biases are zero.
          </p>
          {Object.entries(weights).map(([name, rows]) => (
            <Matrix
              key={name}
              title={name}
              rows={rows}
              labels={name === "embedding" ? vocabulary : undefined}
            />
          ))}
          <Matrix title="Output projection" rows={head.w} labels={vocabulary} />
          <Matrix
            title="Output bias"
            rows={head.b.map((v) => [v])}
            labels={vocabulary}
          />
        </>
      )}
    </details>
  );
}
