"use client";
import { useState } from "react";
import { Panel } from "../../components/ui/Panel.jsx";
export default function GrowthLab() {
  const [n, setN] = useState(8);
  const rows = [
    ["O(1)", 1, "Read one array slot"],
    ["O(log n)", Math.ceil(Math.log2(n)), "Halve a search interval"],
    ["O(n)", n, "Visit every element"],
    ["O(n log n)", n * Math.ceil(Math.log2(n)), "Divide and merge"],
    ["O(n²)", n * n, "Compare every ordered pair"],
    ["O(2ⁿ)", 2 ** n, "Enumerate subsets"],
  ];
  const scale = Math.log10(2 ** n + 1);
  return (
    <Panel
      eyebrow="GROWTH EXPLORER"
      title="How much work does a larger input create?"
    >
      <label className="growth-input">
        Input size · n = {n}
        <input
          aria-label="Input size"
          type="range"
          min="2"
          max="32"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
      </label>
      <div className="growth-chart">
        {rows.map(([label, count, example], i) => (
          <div className="growth-row" key={label}>
            <div>
              <strong>{label}</strong>
              <span>{example}</span>
            </div>
            <div className="growth-track">
              <i
                style={{
                  width: `${Math.max(2, (Math.log10(count + 1) / scale) * 100)}%`,
                  opacity: 1 - i * 0.08,
                }}
              />
            </div>
            <code>{count.toLocaleString("en-US")}</code>
          </div>
        ))}
      </div>
      <p className="small-note">
        Exact illustrative counts appear at right. Bar lengths use a logarithmic
        scale so small counts stay visible. These are growth models, not
        benchmark timings or exact counts for every implementation.
      </p>
      <div className="learning-takeaways">
        <section>
          <span className="overline">DOUBLE n</span>
          <p>
            Linear work roughly doubles. Quadratic work quadruples. Exponential
            work squares its previous count.
          </p>
        </section>
        <section>
          <span className="overline">INTERVIEW HABIT</span>
          <p>
            Identify what n means, count the dominant operations, and
            distinguish worst-case, average-case, and amortized bounds.
          </p>
        </section>
      </div>
    </Panel>
  );
}
