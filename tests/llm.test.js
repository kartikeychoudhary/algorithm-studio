import test from "node:test";
import assert from "node:assert/strict";
import {
  encode,
  tokenize,
  decode,
  softmax,
  forward,
  sampling,
  trainStep,
  logitsFor,
  vocabulary,
  corpus,
  DIM,
  MAX_CONTEXT,
} from "../lib/learning/llm-model.js";
import { checkpoint } from "../lib/data/llm-checkpoint.js";
const close = (a, b, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
test("fixed subword tokenizer segments plurals, normalizes case and falls back per unknown word", () => {
  assert.deepEqual(
    tokenize("Cats and dogs.").map((t) => t.piece),
    ["cat", "##s", "and", "dog", "##s", "."],
  );
  assert.deepEqual(
    tokenize("caterpillar").map((t) => t.id),
    [0],
  );
  assert.equal(
    decode(tokenize("cats and dogs.").map((t) => t.id)),
    "cats and dogs.",
  );
  for (const text of corpus) assert.ok(tokenize(text).every((t) => t.id !== 0));
  assert.throws(() => encode([]));
  assert.throws(() => encode(Array(MAX_CONTEXT + 1).fill(2)));
  assert.throws(() => encode([-1]));
});
test("stable softmax handles extreme scores and negative-infinity masks", () => {
  const a = softmax([10000, 10001, -Infinity]),
    b = softmax([0, 1, -Infinity]);
  a.forEach((v, i) => close(v, b[i]));
  close(
    a.reduce((s, x) => s + x, 0),
    1,
  );
  assert.equal(a[2], 0);
});
test("causal decoder cannot leak later tokens into earlier positions", () => {
  const ids = tokenize("the cat sat on the mat").map((t) => t.id),
    full = encode(ids);
  for (let n = 1; n <= ids.length; n++) {
    const prefix = encode(ids.slice(0, n));
    prefix.features.forEach((row, i) =>
      row.forEach((v, d) => close(v, full.features[i][d])),
    );
  }
  full.attention.forEach((row, i) => {
    close(
      row.reduce((a, b) => a + b, 0),
      1,
    );
    row.forEach((v, j) => {
      if (j > i) assert.equal(v, 0);
    });
  });
  full.features.forEach((row) => {
    assert.equal(row.length, DIM);
    assert.ok(row.every(Number.isFinite));
  });
});
test("attention mixture independently matches a weighted sum of value vectors", () => {
  const s = encode(tokenize("the sky is").map((t) => t.id));
  for (let i = 0; i < s.ids.length; i++)
    for (let d = 0; d < DIM; d++)
      close(
        s.mixed[i][d],
        s.v.reduce((sum, row, j) => sum + s.attention[i][j] * row[d], 0),
      );
});
test("top-k, nucleus boundary and inverse-CDF selection use a normalized distribution", () => {
  const logits = [Math.log(0.5), Math.log(0.3), Math.log(0.2)];
  const nucleus = sampling(logits, { topP: 0.7 });
  close(nucleus.probabilities[0], 0.625);
  close(nucleus.probabilities[1], 0.375);
  assert.equal(nucleus.probabilities[2], 0);
  assert.equal(sampling(logits, { topK: 1 }).selected, 0);
  const afterK = sampling(logits, { topK: 2, topP: 0.6 });
  assert.deepEqual(afterK.probabilities, [1, 0, 0]);
  for (let seed = 0; seed < 1000; seed += 7) {
    const s = sampling(logits, { seed });
    const interval = s.intervals.find((x) => x.id === s.selected);
    assert.ok(s.draw >= interval.start && s.draw < interval.end);
    close(
      s.probabilities.reduce((a, b) => a + b, 0),
      1,
    );
    assert.deepEqual(s, sampling(logits, { seed }));
  }
  assert.ok(
    sampling(logits, { temperature: 0.2 }).entropy <
      sampling(logits, { temperature: 2 }).entropy,
  );
  assert.equal(sampling(logits, { greedy: true, seed: 999 }).selected, 0);
});
test("output-head gradient agrees with finite differences and a step lowers target loss", () => {
  const feature = encode(tokenize("the sky is").map((t) => t.id)).features.at(
      -1,
    ),
    target = vocabulary.indexOf("blue");
  const before = structuredClone(checkpoint),
    result = trainStep(feature, target, checkpoint, 0.01),
    epsilon = 1e-5;
  for (const id of [0, target]) {
    const perturbed = structuredClone(checkpoint);
    perturbed.w[id][0] += epsilon;
    const loss = -Math.log(softmax(logitsFor(feature, perturbed))[target]);
    close(
      (loss - result.loss) / epsilon,
      result.gradient[id] * feature[0],
      1e-4,
    );
  }
  assert.ok(result.afterLoss < result.loss);
  assert.ok(result.after[target] > result.probabilities[target]);
  assert.deepEqual(checkpoint, before);
});
test("checkpoint produces finite complete predictions and learns a corpus association", () => {
  const s = forward(
    tokenize("the cat sat on the").map((t) => t.id),
    checkpoint,
    { greedy: true },
  );
  assert.equal(s.logits.length, vocabulary.length);
  assert.ok(s.logits.every(Number.isFinite));
  assert.equal(vocabulary[s.selected], "mat");
});
