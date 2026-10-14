import { trace, node, bars, bounded, choice, text } from "./trace.js";
import {
  encode,
  tokenize,
  vocabulary,
  weights,
  DIM,
  softmax,
  dot,
  project,
  normalize,
} from "../learning/llm-model.js";
export function bpe(p) {
  const input = text(p.corpus, 160, "corpus").toLowerCase(),
    merges = bounded(p.merges, 1, 10, "merges");
  if (!/^[a-z ]+$/.test(input))
    throw new Error("Use lowercase words separated by spaces.");
  const words = input
      .trim()
      .split(/\s+/)
      .map((w) => [...w, "▁"]),
    r = trace(),
    history = [];
  r.step(
    "start with character symbols + word boundary",
    "This is character-level BPE with a fixed end-of-word marker, not a production byte-level tokenizer.",
    {
      columns: ["Word", "Symbols"],
      rows: words.map((w) => [w.join("").replace("▁", ""), w.join(" · ")]),
    },
  );
  for (let step = 0; step < merges; step++) {
    const counts = new Map();
    for (const word of words)
      for (let i = 0; i < word.length - 1; i++) {
        const pair = JSON.stringify([word[i], word[i + 1]]);
        counts.set(pair, (counts.get(pair) || 0) + 1);
      }
    const sorted = [...counts].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
    if (!sorted.length) break;
    const [key, count] = sorted[0],
      [a, b] = JSON.parse(key);
    history.push([a, b]);
    for (let j = 0; j < words.length; j++) {
      const next = [];
      for (let i = 0; i < words[j].length; i++) {
        if (words[j][i] === a && words[j][i + 1] === b) {
          next.push(a + b);
          i++;
        } else next.push(words[j][i]);
      }
      words[j] = next;
    }
    r.step(
      "count adjacent pairs; merge most frequent non-overlapping pair",
      `Merge ${a} + ${b} → ${a + b}; counted ${count} adjacent occurrence(s). Ties use a deterministic lexical order.`,
      {
        columns: ["Word", "Current symbols"],
        rows: words.map((w) => [w.join("").replace("▁", ""), w.join(" · ")]),
        bars: sorted.slice(0, 6).map(([pair, value]) => ({
          label: JSON.parse(pair).join(" + "),
          value,
        })),
        metrics: {
          Merges: step + 1,
          "Remaining symbols": words.reduce((s, w) => s + w.length, 0),
        },
      },
    );
  }
  return r.finish({ words, history });
}
export function heads(p) {
  const input = text(p.prompt, 80, "prompt"),
    ids = tokenize(input).map((t) => t.id);
  if (!ids.length || ids.length > 8) throw new Error("Use 1–8 tokens.");
  const query = bounded(p.query, 0, ids.length - 1, "query"),
    state = encode(ids),
    r = trace(),
    outputs = [];
  for (let head = 0; head < 2; head++) {
    const start = head * 4,
      q = state.q[query].slice(start, start + 4),
      scores = state.k.map((k, j) =>
        j > query ? -Infinity : dot(q, k.slice(start, start + 4)) / 2,
      ),
      attention = softmax(scores),
      mixed = Array.from({ length: 4 }, (_, d) =>
        attention.reduce((sum, a, j) => sum + a * state.v[j][start + d], 0),
      );
    outputs.push(mixed);
    r.step(
      "head = softmax(Qhead Kheadᵀ / √4 + mask) Vhead",
      `Head ${head + 1} uses its own four-dimensional projection subspace. It can assign different weights to the same positions. These fixed example weights have no assigned linguistic roles.`,
      {
        columns: ["Key position", "Token", "Score", "Weight"],
        rows: ids.map((id, j) => [
          j,
          vocabulary[id],
          Number.isFinite(scores[j]) ? scores[j].toFixed(3) : "masked",
          attention[j].toFixed(3),
        ]),
        bars: bars(
          attention,
          ids.map((id, j) => `${j}:${vocabulary[id]}`),
        ),
        metrics: { Head: head + 1, Query: query, "Head dimension": 4 },
      },
    );
  }
  const combined = outputs.flat(),
    out = project(combined, weights.o);
  r.step(
    "concatenate(head1,head2) @ WO",
    "Concatenation restores eight coordinates; the output projection combines both heads. This is a two-head variation, not the trained one-head checkpoint.",
    {
      columns: ["Dimension", "Concatenated", "Projected"],
      rows: combined.map((v, i) => [i, v.toFixed(3), out[i].toFixed(3)]),
    },
  );
  return r.finish({ outputs, out });
}
export function cache(p) {
  const prompt = tokenize(text(p.prompt, 80, "prompt")).map((t) => t.id),
    extra = tokenize(text(p.append, 60, "append")).map((t) => t.id);
  if (!prompt.length || prompt.length + extra.length > 16)
    throw new Error("Use 1–16 total tokens.");
  const r = trace(),
    keys = [],
    values = [];
  let rows = 0,
    uncached = 0,
    maxError = 0;
  const append = (id, pos) => {
    const position = Array.from(
        { length: DIM },
        (_, d) =>
          0.15 *
          (d % 2
            ? Math.cos(pos / 10000 ** ((d - 1) / DIM))
            : Math.sin(pos / 10000 ** (d / DIM))),
      ),
      x = weights.embedding[id].map((v, d) => v + position[d]),
      norm = normalize(x);
    keys.push(project(norm, weights.k));
    values.push(project(norm, weights.v));
    rows++;
    return { x, q: project(norm, weights.q) };
  };
  let last;
  prompt.forEach((id, i) => (last = append(id, i)));
  const ids = [...prompt];
  uncached = prompt.length;
  const emit = (label) => {
    const scores = keys.map((k) => dot(last.q, k) / Math.sqrt(DIM)),
      a = softmax(scores),
      mixed = Array.from({ length: DIM }, (_, d) =>
        a.reduce((s, v, j) => s + v * values[j][d], 0),
      ),
      residual = last.x.map((v, d) => v + project(mixed, weights.o)[d]),
      ff = project(
        project(normalize(residual), weights.f1).map((v) => Math.max(0, v)),
        weights.f2,
      ),
      feature = normalize(residual.map((v, d) => v + ff[d])),
      reference = encode(ids).features.at(-1);
    maxError = Math.max(
      maxError,
      ...feature.map((v, i) => Math.abs(v - reference[i])),
    );
    r.step("reuse old K,V; project only newly appended positions", label, {
      nodes: ids.map((id, i) =>
        node(
          `Position ${i}`,
          vocabulary[id],
          i === ids.length - 1 ? "active" : "",
        ),
      ),
      bars: bars(
        [rows, uncached],
        ["Cached projected rows", "Recomputed projected rows"],
      ),
      metrics: {
        "Token positions": ids.length,
        "K+V bytes at hypothetical fp16": 2 * ids.length * DIM * 2,
        "Maximum reference error": maxError.toExponential(2),
      },
    });
  };
  emit(
    "Prefill computes K and V for the complete prompt. Counts refer to projection rows, not wall-clock time.",
  );
  for (const id of extra) {
    ids.push(id);
    last = append(id, ids.length - 1);
    uncached += ids.length;
    emit(
      `Append ${vocabulary[id]}. Older keys and values are reused; current attention still visits the entire retained context.`,
    );
  }
  return r.finish({
    rows,
    uncached,
    maxError,
    bytes: 2 * ids.length * DIM * 2,
  });
}
export const documents = [
  {
    id: "refund",
    text: "Refund requests are accepted within thirty days of purchase.",
  },
  {
    id: "delivery",
    text: "Standard delivery takes three business days after shipping.",
  },
  {
    id: "support",
    text: "Customer support is available Monday through Friday.",
  },
  {
    id: "damaged",
    text: "Damaged items qualify for a replacement after support reviews photos.",
  },
];
const words = (s) =>
  (s.toLowerCase().match(/[a-z]+/g) || []).filter(
    (w) =>
      ![
        "a",
        "the",
        "is",
        "are",
        "of",
        "for",
        "to",
        "my",
        "what",
        "how",
        "can",
        "i",
      ].includes(w),
  );
export function cosine(a, b) {
  const denominator = Math.sqrt(dot(a, a) * dot(b, b));
  return denominator ? dot(a, b) / denominator : 0;
}
export function rag(p) {
  const query = text(p.query, 100, "query"),
    k = bounded(p.k, 1, 4, "k"),
    r = trace(),
    terms = [
      ...new Set(documents.flatMap((d) => words(d.text)).concat(words(query))),
    ],
    vector = (s) => terms.map((w) => words(s).filter((t) => t === w).length),
    q = vector(query),
    ranked = documents
      .map((d) => ({ ...d, score: cosine(q, vector(d.text)) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  r.step(
    "chunk documents; retain source IDs",
    "Each short policy is one chunk. Vectors here are transparent bag-of-words counts, not learned semantic embeddings.",
    {
      columns: ["Source", "Chunk"],
      rows: documents.map((d) => [d.id, d.text]),
    },
  );
  r.step(
    "embed query; score chunks by cosine similarity",
    `Retrieve for “${query}”. Lexical similarity can miss synonyms or prefer a misleading overlap.`,
    {
      bars: ranked.map((d) => ({ label: d.id, value: d.score })),
      columns: ["Chunk", "Similarity"],
      rows: ranked.map((d) => [d.id, d.score.toFixed(3)]),
    },
  );
  const selected = ranked.slice(0, k).filter((d) => d.score > 0);
  r.step(
    "assemble context with citations; answer only from evidence",
    selected.length
      ? "The response below is an extractive teaching answer assembled from retrieved sentences. No language model is called."
      : "No positive-overlap evidence: abstain rather than invent a policy.",
    {
      columns: ["Retrieved source", "Evidence"],
      rows: selected.map((d) => [`[${d.id}]`, d.text]),
      nodes: [
        node("Question", query),
        node("Evidence", selected.map((d) => d.id).join(", ") || "none"),
        node(
          "Answer",
          selected.length
            ? "cited extracts"
            : "I do not have supporting evidence.",
          "active",
        ),
      ],
      links: [
        [0, 1],
        [1, 2],
      ],
    },
  );
  return r.finish({
    selected,
    answer: selected.length
      ? selected.map((d) => `${d.text} [${d.id}]`).join(" ")
      : "No supporting evidence",
  });
}
export function vectorSearch(p) {
  const query = p.query;
  if (
    !Array.isArray(query) ||
    query.length !== 2 ||
    query.some((v) => !Number.isFinite(v) || Math.abs(v) > 5) ||
    query.every((v) => v === 0)
  )
    throw new Error(
      "query must be a nonzero two-number vector between −5 and 5.",
    );
  const probes = bounded(p.probes, 1, 3, "probes"),
    r = trace(),
    points = [
      [1, 0],
      [0.8, 0.2],
      [0, 1],
      [-0.2, 0.8],
      [-1, 0],
      [-0.8, -0.2],
    ],
    centers = [
      [1, 0],
      [0, 1],
      [-1, 0],
    ],
    clusters = centers
      .map((center, i) => ({ i, score: cosine(query, center) }))
      .sort((a, b) => b.score - a.score),
    visited = new Set(clusters.slice(0, probes).map((c) => c.i)),
    exact = points
      .map((v, i) => ({ i, score: cosine(query, v) }))
      .sort((a, b) => b.score - a.score || a.i - b.i),
    approx = exact.filter((x) => visited.has(Math.floor(x.i / 2)));
  r.step(
    "route query to the nearest coarse centroids",
    "This miniature inverted-file index stores two vectors per cluster. Fewer probes reduce comparisons but can miss the true nearest neighbor.",
    {
      columns: ["Centroid", "Cosine score", "Probed"],
      rows: clusters.map((c) => [
        c.i,
        c.score.toFixed(3),
        visited.has(c.i) ? "yes" : "no",
      ]),
    },
  );
  r.step(
    "compare candidate vectors; return best similarity",
    "Cosine = dot(q,x)/(||q|| ||x||). Exact search compares all six vectors; the approximate search compares only selected clusters.",
    {
      columns: ["Vector", "Coordinates", "Cosine", "Visited"],
      rows: exact.map((x) => [
        x.i,
        `[${points[x.i]}]`,
        x.score.toFixed(3),
        visited.has(Math.floor(x.i / 2)) ? "yes" : "no",
      ]),
      scatter: { points, query },
      metrics: {
        "Exact top-1": exact[0].i,
        "Approximate top-1": approx[0].i,
        Comparisons: approx.length,
        "Recall@1": Number(exact[0].i === approx[0].i),
      },
    },
  );
  return r.finish({
    exact: exact[0].i,
    approx: approx[0].i,
    comparisons: approx.length,
  });
}
export function quantize(p) {
  if (
    !Array.isArray(p.weights) ||
    !p.weights.length ||
    p.weights.length > 12 ||
    p.weights.some((x) => !Number.isFinite(x) || Math.abs(x) > 10)
  )
    throw new Error("Use 1–12 finite weights between −10 and 10.");
  const bits = choice(p.bits, [4, 8], "bits"),
    qmax = 2 ** (bits - 1) - 1,
    max = Math.max(...p.weights.map(Math.abs)),
    scale = max ? max / qmax : 1,
    r = trace(),
    quant = p.weights.map((w) =>
      Math.max(-qmax, Math.min(qmax, Math.round(w / scale))),
    ),
    restored = quant.map((v) => v * scale),
    mse =
      p.weights.reduce((s, w, i) => s + (w - restored[i]) ** 2, 0) /
      p.weights.length;
  r.step(
    "s=max_abs/(2^(bits−1)−1); q=round(w/s)",
    `Symmetric per-tensor ${bits}-bit quantization. Scale=${scale.toFixed(6)}. Integer range is −${qmax}…${qmax}; the most negative two’s-complement code is unused.`,
    {
      columns: ["Weight", "Integer", "Reconstructed", "Error"],
      rows: p.weights.map((w, i) => [
        w,
        quant[i],
        restored[i].toFixed(5),
        (restored[i] - w).toFixed(5),
      ]),
      bars: bars(
        restored,
        restored.map((_, i) => `w${i}`),
      ),
      metrics: {
        MSE: mse.toFixed(6),
        "FP32 payload bits": p.weights.length * 32,
        "Quantized payload + FP32 scale bits": p.weights.length * bits + 32,
      },
    },
  );
  r.step(
    "dequantize: ŵ=q×s; compare dot products",
    "For input x=[1,…,1], compare the original dot product with the reconstructed one. This does not measure end-to-end language-model quality or speed.",
    {
      metrics: {
        Original: p.weights.reduce((a, b) => a + b, 0).toFixed(5),
        Reconstructed: restored.reduce((a, b) => a + b, 0).toFixed(5),
        MSE: mse.toFixed(6),
      },
    },
  );
  return r.finish({ quant, restored, mse, scale });
}
export function evaluation(p) {
  const mode = choice(
      p.answer,
      ["supported", "plausible", "irrelevant"],
      "answer",
    ),
    answer =
      mode === "supported"
        ? "Refund requests are accepted within thirty days of purchase. [refund]"
        : mode === "plausible"
          ? "Refund requests are accepted within ninety days of purchase. [refund]"
          : "The sky is blue.",
    reference = documents[0].text,
    r = trace();
  const tokens = words(answer.replace(/\[.*?\]/g, "")),
    target = words(reference),
    common = tokens.filter((w) => target.includes(w)).length,
    precision = common / Math.max(1, tokens.length),
    recall = common / target.length,
    f1 =
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    grounded = mode === "supported";
  r.step(
    "evaluate answer against a reference and retrieved evidence",
    "The reference policy says thirty days. Merely including a citation does not make the cited claim correct.",
    { columns: ["Reference", "Candidate"], rows: [[reference, answer]] },
  );
  r.step(
    "separate lexical overlap, factual checks, and citation support",
    mode === "plausible"
      ? "“Ninety” sounds plausible and shares many words, yet contradicts the source. A high overlap score cannot certify truth."
      : grounded
        ? "The candidate matches the stated policy and cites the supporting chunk."
        : "The response does not answer the refund question.",
    {
      bars: bars(
        [f1, Number(grounded), Number(answer.includes("[refund]"))],
        ["Token-overlap F1", "Policy fact correct", "Citation present"],
      ),
      metrics: { "Answer supported by source": String(grounded) },
    },
  );
  return r.finish({ f1, grounded, answer });
}
export const aiModels = {
  "llm-bpe": bpe,
  "llm-heads": heads,
  "llm-kv": cache,
  "llm-rag": rag,
  "llm-vectors": vectorSearch,
  "llm-quantization": quantize,
  "llm-evaluation": evaluation,
};
