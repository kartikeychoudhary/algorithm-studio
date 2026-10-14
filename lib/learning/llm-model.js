// A transparent, deliberately tiny causal decoder. No model service or API key.
export const vocabulary = [
  "[UNK]",
  "[EOS]",
  "the",
  "cat",
  "dog",
  "##s",
  "sat",
  "on",
  "mat",
  "rug",
  "a",
  "i",
  "like",
  "love",
  "code",
  "learn",
  "to",
  "write",
  "is",
  "sun",
  "bright",
  "sky",
  "blue",
  "grass",
  "green",
  "bird",
  "can",
  "fly",
  "fish",
  "swim",
  ".",
  "and",
  "we",
  "you",
  "eat",
  "food",
];
export const DIM = 8;
export const MAX_CONTEXT = 16;
export const corpus = [
  "the cat sat on the mat .",
  "the dog sat on the rug .",
  "a cat sat on a mat .",
  "a dog sat on a rug .",
  "i like to code .",
  "i love to code .",
  "we learn to code .",
  "you learn to write code .",
  "i like cats .",
  "i like dogs .",
  "the sky is blue .",
  "the grass is green .",
  "the sun is bright .",
  "a bird can fly .",
  "a fish can swim .",
  "cats eat food .",
  "dogs eat food .",
  "we like to learn .",
  "i like the blue sky .",
  "the cat is on the mat .",
];
export function randomGenerator(seed = 42) {
  let state = seed >>> 0;
  return () =>
    (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
}
const rng = randomGenerator(712);
const matrix = (rows, cols, scale) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() * 2 - 1) * scale),
  );
export const weights = {
  embedding: matrix(vocabulary.length, DIM, 0.9),
  q: matrix(DIM, DIM, 0.45),
  k: matrix(DIM, DIM, 0.45),
  v: matrix(DIM, DIM, 0.3),
  o: matrix(DIM, DIM, 0.3),
  f1: matrix(DIM, 16, 0.3),
  f2: matrix(16, DIM, 0.2),
};
export const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
export const project = (x, w) =>
  w[0].map((_, j) => x.reduce((sum, v, i) => sum + v * w[i][j], 0));
const add = (a, b) => a.map((v, i) => v + b[i]);
export function normalize(x) {
  const mean = x.reduce((s, v) => s + v, 0) / x.length;
  const variance = x.reduce((s, v) => s + (v - mean) ** 2, 0) / x.length;
  return x.map((v) => (v - mean) / Math.sqrt(variance + 1e-5));
}
export function softmax(logits) {
  const max = Math.max(...logits);
  if (!Number.isFinite(max))
    throw new Error("At least one finite logit is required.");
  const values = logits.map((v) => Math.exp(v - max)),
    total = values.reduce((a, b) => a + b, 0);
  return values.map((v) => v / total);
}
// Fixed, greedy WordPiece-style vocabulary. Unknown words become one [UNK].
export function tokenize(text) {
  const words = text.toLowerCase().match(/[a-z]+|[^\s]/g) || [];
  const tokens = [];
  for (const word of words) {
    let start = 0;
    const pieces = [];
    while (start < word.length) {
      let found = null;
      for (let end = word.length; end > start; end--) {
        const piece = (start ? "##" : "") + word.slice(start, end),
          id = vocabulary.indexOf(piece);
        if (id >= 2) {
          found = { id, piece, word, start, end };
          break;
        }
      }
      if (!found) {
        pieces.splice(0, pieces.length, {
          id: 0,
          piece: "[UNK]",
          word,
          start: 0,
          end: word.length,
        });
        break;
      }
      pieces.push(found);
      start = found.end;
    }
    tokens.push(...pieces);
  }
  return tokens;
}
export function decode(ids) {
  return ids
    .map((id) => vocabulary[id])
    .reduce(
      (s, p) =>
        p === "[EOS]"
          ? s
          : p.startsWith("##")
            ? s + p.slice(2)
            : p === "."
              ? s + "."
              : s + (s ? " " : "") + p,
      "",
    );
}
export function encode(ids) {
  if (
    !ids.length ||
    ids.length > MAX_CONTEXT ||
    ids.some((id) => !Number.isInteger(id) || id < 0 || id >= vocabulary.length)
  )
    throw new Error(`Use 1–${MAX_CONTEXT} valid tokens.`);
  const embeddings = ids.map((id) => weights.embedding[id]);
  const positions = ids.map((_, pos) =>
    Array.from(
      { length: DIM },
      (_, d) =>
        0.15 *
        (d % 2
          ? Math.cos(pos / 10000 ** ((d - 1) / DIM))
          : Math.sin(pos / 10000 ** (d / DIM))),
    ),
  );
  const x = embeddings.map((e, i) => add(e, positions[i])),
    normalized = x.map(normalize);
  const q = normalized.map((row) => project(row, weights.q)),
    k = normalized.map((row) => project(row, weights.k)),
    v = normalized.map((row) => project(row, weights.v));
  const scores = q.map((row, i) =>
    k.map((key, j) => (j > i ? -Infinity : dot(row, key) / Math.sqrt(DIM))),
  );
  const attention = scores.map(softmax);
  const mixed = attention.map((row) =>
    Array.from({ length: DIM }, (_, d) =>
      row.reduce((s, a, j) => s + a * v[j][d], 0),
    ),
  );
  const residual = x.map((row, i) => add(row, project(mixed[i], weights.o)));
  const hidden = residual.map((row) =>
    project(normalize(row), weights.f1).map((v) => Math.max(0, v)),
  );
  const features = residual.map((row, i) =>
    normalize(add(row, project(hidden[i], weights.f2))),
  );
  return {
    ids,
    embeddings,
    positions,
    x,
    normalized,
    q,
    k,
    v,
    scores,
    attention,
    mixed,
    residual,
    hidden,
    features,
  };
}
export function logitsFor(feature, head) {
  return head.w.map((row, i) => dot(feature, row) + head.b[i]);
}
export function sampling(
  logits,
  { temperature = 1, topK = 0, topP = 1, seed = 42, greedy = false } = {},
) {
  if (
    !Number.isFinite(temperature) ||
    temperature < 0.1 ||
    temperature > 2 ||
    !Number.isInteger(topK) ||
    topK < 0 ||
    topK > logits.length ||
    topP <= 0 ||
    topP > 1 ||
    !Number.isFinite(topP)
  )
    throw new Error("Invalid decoding controls.");
  const base = softmax(logits.map((v) => v / temperature));
  const ranked = base
    .map((p, id) => ({ p, id }))
    .sort((a, b) => b.p - a.p || a.id - b.id);
  const candidates = topK ? ranked.slice(0, topK) : ranked;
  const kMass = candidates.reduce((s, x) => s + x.p, 0);
  let mass = 0;
  const kept = [];
  for (const item of candidates) {
    kept.push(item);
    mass += item.p;
    if (mass / kMass >= topP) break;
  }
  const probabilities = base.map((_, id) =>
    kept.some((x) => x.id === id) ? base[id] / mass : 0,
  );
  const draw = randomGenerator(seed)();
  let cumulative = 0,
    selected = kept[kept.length - 1].id;
  const intervals = kept.map(({ id }) => {
    const start = cumulative;
    cumulative += probabilities[id];
    return { id, start, end: cumulative };
  });
  if (greedy) selected = ranked[0].id;
  else selected = intervals.find((x) => draw < x.end)?.id ?? selected;
  return {
    base,
    ranked,
    probabilities,
    intervals,
    draw,
    selected,
    entropy: -probabilities.reduce((s, p) => s + (p ? p * Math.log2(p) : 0), 0),
  };
}
export function forward(ids, head, settings) {
  const state = encode(ids),
    feature = state.features.at(-1),
    logits = logitsFor(feature, head);
  return { ...state, logits, ...sampling(logits, settings) };
}
export function trainStep(feature, target, head, rate = 0.05) {
  const logits = logitsFor(feature, head),
    probabilities = softmax(logits);
  const gradient = probabilities.map((p, id) => p - (id === target ? 1 : 0));
  const next = {
    w: head.w.map((row, id) =>
      row.map((w, d) => w - rate * gradient[id] * feature[d]),
    ),
    b: head.b.map((b, id) => b - rate * gradient[id]),
  };
  const after = softmax(logitsFor(feature, next));
  return {
    head: next,
    probabilities,
    after,
    gradient,
    loss: -Math.log(probabilities[target]),
    afterLoss: -Math.log(after[target]),
  };
}
