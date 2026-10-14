"use client";
import { useMemo, useState } from "react";
import { checkpoint, checkpointInfo } from "../../lib/data/llm-checkpoint.js";
import { llmReading, llmSources, stages } from "../../lib/data/llm-lessons.js";
import {
  forward,
  tokenize,
  vocabulary,
  MAX_CONTEXT,
  decode,
  corpus,
  weights,
} from "../../lib/learning/llm-model.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import CodePanel from "../../components/execution/CodePanel.jsx";
import {
  Matrix,
  TokenRibbon,
  Pipeline,
  AttentionView,
  Distribution,
  WeightInspector,
  fmt,
} from "./ModelViews.jsx";
import TrainingLab from "./TrainingLab.jsx";
const defaultPrompt = "the cat sat on the";
const presets = [
  defaultPrompt,
  "the sky is",
  "i like to",
  "a bird can",
  "cats eat",
];
export default function LlmLesson({ id, tab }) {
  const [draft, setDraft] = useState(defaultPrompt),
    [tokens, setTokens] = useState(() => tokenize(defaultPrompt)),
    [error, setError] = useState("");
  const [settings, setSettings] = useState({
    temperature: 1,
    topK: 0,
    topP: 1,
    seed: 42,
    greedy: false,
  });
  const [query, setQuery] = useState(tokens.length - 1),
    [keyIndex, setKeyIndex] = useState(0),
    [tokenIndex, setTokenIndex] = useState(0),
    [generated, setGenerated] = useState([]);
  const ids = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const state = useMemo(
    () => forward(ids, checkpoint, settings),
    [ids, settings],
  );
  const run = useMemo(
    () => ({
      code: stages.map((s) => s.code),
      events: stages.map((s, line) => ({ line, message: s.message })),
    }),
    [ids],
  );
  const p = usePlayback(run),
    stage = stages[p.index];
  const labels = ids.map((id, i) => `${i}: ${vocabulary[id]}`);
  const change = (name, value) => setSettings((s) => ({ ...s, [name]: value }));
  const apply = (text) => {
    const next = tokenize(text);
    if (!next.length || next.length > MAX_CONTEXT) {
      setError(`Enter text that produces 1–${MAX_CONTEXT} tokens.`);
      return;
    }
    setDraft(text);
    setTokens(next);
    setQuery(next.length - 1);
    setKeyIndex(0);
    setTokenIndex(0);
    setGenerated([]);
    setError("");
  };
  const append = () => {
    if (ids.length >= MAX_CONTEXT || generated.at(-1) === 1) return;
    const next = state.selected;
    setGenerated([...generated, next]);
    if (next === 1) return;
    setTokens([
      ...tokens,
      { id: next, piece: vocabulary[next], word: vocabulary[next] },
    ]);
    setQuery(ids.length);
    setSettings((s) => ({
      ...s,
      seed: (Math.imul(s.seed, 1664525) + 1013904223) >>> 0,
    }));
  };
  const attention = (
    <AttentionView
      state={state}
      query={query}
      setQuery={setQuery}
      keyIndex={keyIndex}
      setKeyIndex={setKeyIndex}
    />
  );
  const representation = (
    <>
      <h3>Inspect an input position</h3>
      <TokenRibbon ids={ids} selected={tokenIndex} onSelect={setTokenIndex} />
      <div className="llm-equation">
        <strong>
          {tokens[tokenIndex].word} → {vocabulary[ids[tokenIndex]]} → ID{" "}
          {ids[tokenIndex]}
        </strong>
        <code>
          X[{tokenIndex}] = E[{ids[tokenIndex]}] + P[{tokenIndex}]
        </code>
        <code>
          Coordinate 0: {fmt(state.embeddings[tokenIndex][0])} +{" "}
          {fmt(state.positions[tokenIndex][0])} = {fmt(state.x[tokenIndex][0])}
        </code>
      </div>
      <Matrix
        title="Embedding + position = transformer input"
        rows={[
          state.embeddings[tokenIndex],
          state.positions[tokenIndex],
          state.x[tokenIndex],
        ]}
        labels={["Embedding E", "Position P", "Input X"]}
      />
      <p className="small-note">
        The selected row is a vector with eight dimensions. Larger token IDs do
        not mean larger or more important concepts.
      </p>
    </>
  );
  return (
    <div className="llm-lesson">
      <div className="llm-model-note">
        <span className="llm-live-dot" /> REAL COMPUTATION · TINY TEACHING MODEL{" "}
        <p>
          36 tokens · 8 dimensions · 1 causal attention head · 1 decoder block.
          The output head was trained on 20 synthetic sentences; all other
          weights are fixed illustrative values. This is not a production LLM.
          Every displayed score is calculated in your browser.
        </p>
      </div>
      <form
        className="llm-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          apply(draft);
        }}
      >
        <label htmlFor="llm-prompt">Input prefix</label>
        <div>
          <input
            id="llm-prompt"
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
          />
          <button className="button primary">Run prefix</button>
        </div>
        <div className="llm-presets">
          {presets.map((text) => (
            <button type="button" key={text} onClick={() => apply(text)}>
              {text}…
            </button>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
      </form>
      {tokens.some((t) => t.id === 0) && (
        <p className="llm-warning">
          Unknown words mapped to [UNK]:{" "}
          {tokens
            .filter((t) => t.id === 0)
            .map((t) => t.word)
            .join(", ")}
          . Try a preset or inspect the vocabulary below. This tiny tokenizer
          does not have byte fallback.
        </p>
      )}
      <div className="llm-context">
        <span className="overline">
          ACTIVE CONTEXT · {ids.length} / {MAX_CONTEXT} TOKENS
        </span>
        <p>
          {decode(ids)}
          <span className="llm-cursor" aria-hidden="true">
            ▍
          </span>
        </p>
        {generated.length > 0 && (
          <small>
            Generated: {generated.map((id) => vocabulary[id]).join(" ")}{" "}
            {generated.at(-1) === 1 ? "· End of sequence" : ""}
          </small>
        )}
      </div>
      {tab === "learn" ? (
        <div className="concept-reading">
          {llmReading[id].map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
          <div className="llm-equation">
            <strong>Joint probability of a sequence</strong>
            <code>P(t₁,…,tₙ) = ∏ᵢ P(tᵢ | t₁,…,tᵢ₋₁)</code>
            <code>Training loss = −Σᵢ ln P(targetᵢ | prefixᵢ)</code>
          </div>
        </div>
      ) : (
        <>
          {id === "llm-prediction" && (
            <>
              <Pipeline stage={p.index} onSelect={p.seek} />
              <div className="llm-stage" key={p.index} role="status">
                <span className="overline">
                  FORWARD PASS · {p.index + 1} / {stages.length}
                </span>
                <h2>{stage.title}</h2>
                <p>{stage.message}</p>
                <div className="llm-equation">
                  <code>{stage.formula}</code>
                </div>
              </div>
            </>
          )}
          {(id === "llm-tokens" || (id === "llm-prediction" && p.index <= 1)) &&
            representation}
          {id === "llm-prediction" && p.index === 2 && (
            <>
              <Matrix
                title="Normalized inputs"
                rows={state.normalized}
                labels={labels}
              />
              <Matrix title="Queries Q" rows={state.q} labels={labels} />
              <Matrix title="Keys K" rows={state.k} labels={labels} />
              <Matrix title="Values V" rows={state.v} labels={labels} />
              <div className="llm-equation">
                <code>Q[last,0] = Σd LN(X)[last,d] × WQ[d,0]</code>
                <code>
                  {state.normalized
                    .at(-1)
                    .map((v, d) => `(${fmt(v)} × ${fmt(weights.q[d][0])})`)
                    .join(" + ")}{" "}
                  = {fmt(state.q.at(-1)[0])}
                </code>
              </div>
            </>
          )}
          {(id === "llm-attention" ||
            (id === "llm-prediction" && p.index === 3)) &&
            attention}
          {id === "llm-prediction" && p.index === 4 && (
            <>
              <Matrix
                title="Attention mixtures AV"
                rows={state.mixed}
                labels={labels}
              />
              <Matrix
                title="Residual R = X + (AV)WO"
                rows={state.residual}
                labels={labels}
              />
              <div className="llm-equation">
                <code>
                  C[last,0] ={" "}
                  {state.attention
                    .at(-1)
                    .map((a, j) => `(${fmt(a)} × ${fmt(state.v[j][0])})`)
                    .join(" + ")}{" "}
                  = {fmt(state.mixed.at(-1)[0])}
                </code>
              </div>
            </>
          )}
          {id === "llm-prediction" && p.index === 5 && (
            <>
              <Matrix
                title="ReLU activations · 16 hidden dimensions"
                rows={[state.hidden.at(-1)]}
                labels={["last position"]}
              />
              <Matrix
                title="Final contextual vectors H"
                rows={state.features}
                labels={labels}
              />
              <p>
                The final row supplies the next-token logits. ReLU replaces
                negative hidden activations with zero; it is not a probability
                function.
              </p>
            </>
          )}
          {id === "llm-prediction" && p.index === 6 && (
            <>
              <Matrix title="Final position H" rows={[state.features.at(-1)]} />
              <div className="llm-equation">
                <strong>Worked logit: {vocabulary[state.selected]}</strong>
                <code>
                  z ={" "}
                  {state.features
                    .at(-1)
                    .map(
                      (h, d) =>
                        `(${fmt(h)} × ${fmt(checkpoint.w[state.selected][d])})`,
                    )
                    .join(" + ")}{" "}
                  + {fmt(checkpoint.b[state.selected])} ={" "}
                  {fmt(state.logits[state.selected])}
                </code>
              </div>
              <Matrix
                title="Vocabulary logits (unnormalized scores)"
                rows={state.logits.map((z) => [z])}
                labels={vocabulary}
              />
            </>
          )}
          {(id === "llm-sampling" ||
            (id === "llm-prediction" && p.index >= 7)) && (
            <>
              <div className="llm-controls">
                <label>
                  Temperature · {settings.temperature.toFixed(2)}
                  <input
                    aria-label="Temperature"
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) =>
                      change("temperature", Number(e.target.value))
                    }
                  />
                </label>
                <label>
                  Top-k
                  <select
                    aria-label="Top-k"
                    value={settings.topK}
                    onChange={(e) => change("topK", Number(e.target.value))}
                  >
                    {[0, 1, 3, 5, 10].map((k) => (
                      <option key={k} value={k}>
                        {k || "All tokens"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Top-p · {settings.topP.toFixed(2)}
                  <input
                    aria-label="Top-p"
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={settings.topP}
                    onChange={(e) => change("topP", Number(e.target.value))}
                  />
                </label>
                <label>
                  Random seed
                  <input
                    aria-label="Random seed"
                    type="number"
                    min="0"
                    max="4294967295"
                    value={settings.seed}
                    onChange={(e) =>
                      change(
                        "seed",
                        Math.max(
                          0,
                          Math.min(
                            4294967295,
                            Math.floor(Number(e.target.value) || 0),
                          ),
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.greedy}
                    onChange={(e) => change("greedy", e.target.checked)}
                  />{" "}
                  Greedy decoding
                </label>
              </div>
              <Distribution state={state} greedy={settings.greedy} />
              <div className="llm-equation">
                <strong>Worked softmax for {vocabulary[state.selected]}</strong>
                <code>
                  m = max(z / T) ={" "}
                  {fmt(Math.max(...state.logits) / settings.temperature)}
                </code>
                <code>
                  exp({fmt(state.logits[state.selected] / settings.temperature)}{" "}
                  − m) / Σ exp(z / T − m) ={" "}
                  {state.base[state.selected].toFixed(6)}
                </code>
                <small>
                  Top-k and top-p may change this base probability by filtering
                  and renormalizing.
                </small>
              </div>
            </>
          )}
          {id === "llm-training" && (
            <TrainingLab key={ids.join(",")} feature={state.features.at(-1)} />
          )}
          {((id === "llm-prediction" && p.index === 8) ||
            id === "llm-sampling") && (
            <div className="llm-next">
              <div>
                <span className="overline">SELECTED TOKEN</span>
                <strong>{vocabulary[state.selected]}</strong>
              </div>
              <button
                className="button primary"
                disabled={ids.length >= MAX_CONTEXT || generated.at(-1) === 1}
                onClick={append}
              >
                Append token & repeat
              </button>
              <small>
                {generated.at(-1) === 1
                  ? "EOS reached. Run a new prefix to restart."
                  : ids.length >= MAX_CONTEXT
                    ? "Context limit reached. Run a shorter prefix."
                    : "Weights stay fixed during generation. A new token changes the input."}
              </small>
            </div>
          )}
          {id === "llm-prediction" && (
            <>
              <PlaybackControls playback={p} />
              {tab === "code" && (
                <CodePanel code={run.code} event={run.events[p.index]} />
              )}
            </>
          )}
          {id !== "llm-prediction" && (
            <div className="concept-reading">
              {llmReading[id].map(([title, body]) => (
                <section key={title}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </section>
              ))}
            </div>
          )}
        </>
      )}
      <details className="llm-weights">
        <summary>Model card, training corpus & limitations</summary>
        <p>
          This decoder uses pre-normalization, sinusoidal position vectors, a
          single masked head, residuals, a ReLU feed-forward network, and final
          normalization. The fixed input embeddings and decoder projections are
          seeded random values. Only Wout and bias were trained:{" "}
          {checkpointInfo.examples} next-token examples, {checkpointInfo.epochs}{" "}
          passes, SGD rate {checkpointInfo.rate}.
        </p>
        <p>
          Output quality is limited and can be ungrammatical. Probabilities are
          this model’s outputs, not calibrated truth scores or results from a
          larger hidden model. No external inference service is called. The
          animation slows down mathematical operations for inspection; it does
          not represent hardware timing or physical neurons.
        </p>
        <p>
          Full LLMs use much larger vocabularies and usually train all their
          parameters. Architectural details such as positional encoding,
          normalization, activation, attention heads, and caching vary. The
          training exercise here is intentionally restricted to the output head.
        </p>
        <h3>Synthetic training sentences</h3>
        <ul>
          {corpus.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <h3>Vocabulary · ID order</h3>
        <p>{vocabulary.map((v, i) => `${i}: ${v}`).join(" · ")}</p>
      </details>
      <WeightInspector head={checkpoint} />
      <p className="learning-source">
        References:{" "}
        {llmSources.map((s) => (
          <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
            {s.label} ↗{" "}
          </a>
        ))}
      </p>
    </div>
  );
}
