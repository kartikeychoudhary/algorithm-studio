const lesson = (label, subtitle, topic) => ({
  label:
    {
      "Inside the next-token prediction": "Next-token prediction",
      "Words become tokens. Tokens become vectors.": "Tokens & embeddings",
      "Attention, one multiplication at a time": "Attention math",
      "From scores to a choice": "Softmax & sampling",
      "How prediction errors change weights": "Training & gradients",
    }[label] || label,
  title: label,
  subtitle,
  topic,
  section: "LLM",
  kind: "llm",
  tag: "LANGUAGE MODELS · FROM NUMBERS TO TOKENS",
});
export const llmLessons = {
  "llm-prediction": lesson(
    "Inside the next-token prediction",
    "Follow one real forward pass, inspect every handoff, then append the selected token and run again.",
    "Prediction pipeline",
  ),
  "llm-tokens": lesson(
    "Words become tokens. Tokens become vectors.",
    "Explore subword boundaries, vocabulary IDs, embedding lookup, and position information.",
    "Representation",
  ),
  "llm-attention": lesson(
    "Attention, one multiplication at a time",
    "Choose a query and key. See their dot product, causal mask, normalized weight, and contribution.",
    "Transformer internals",
  ),
  "llm-sampling": lesson(
    "From scores to a choice",
    "Change temperature, top-k, top-p, and the random seed. Watch probability mass move before a token is chosen.",
    "Decoding",
  ),
  "llm-training": lesson(
    "How prediction errors change weights",
    "Take actual gradient-descent steps on the output head and watch the target probability and loss change.",
    "Learning",
  ),
};
export const stages = [
  {
    title: "Tokenize",
    formula: "text → token IDs",
    message:
      "Split text into pieces from a fixed vocabulary. A token may be a whole word, a word fragment, or punctuation.",
    code: "ids = tokenizer(prompt)",
  },
  {
    title: "Embed + position",
    formula: "Xᵢ = E[tokenᵢ] + Pᵢ",
    message:
      "Look up eight numbers for each token, then add a position vector. IDs are indices, not measures of meaning.",
    code: "X = embedding[ids] + position",
  },
  {
    title: "Project Q, K, V",
    formula: "Q = LN(X)WQ; K = LN(X)WK; V = LN(X)WV",
    message:
      "Three matrix multiplications create queries, keys, and values from normalized inputs. The same matrices are used at every position.",
    code: "Q, K, V = project(layer_norm(X))",
  },
  {
    title: "Masked attention",
    formula: "A = softmax(QKᵀ / √8 + M)",
    message:
      "Compare queries with keys, divide by the square root of key dimension, and mask future positions before a row-wise softmax.",
    code: "A = softmax(Q @ K.T / sqrt(8) + causal_mask)",
  },
  {
    title: "Mix + residual",
    formula: "C = AV; R = X + CWO",
    message:
      "Use attention weights to mix value vectors. Project that mixture and add the original input through a residual connection.",
    code: "R = X + (A @ V) @ WO",
  },
  {
    title: "Feed-forward",
    formula: "H = LN(R + ReLU(LN(R)W₁)W₂)",
    message:
      "A position-wise network expands eight values to sixteen, applies ReLU, projects back, and adds a residual. Final normalization produces H.",
    code: "H = layer_norm(R + relu(layer_norm(R) @ W1) @ W2)",
  },
  {
    title: "Vocabulary logits",
    formula: "zⱼ = Hlast · Wout[j] + bⱼ",
    message:
      "Only the final position is needed to predict the next token. Its vector produces one unnormalized score for every vocabulary item.",
    code: "z = Wout @ H[-1] + bias",
  },
  {
    title: "Probabilities",
    formula: "pⱼ = exp(zⱼ/T − m) / Σₖ exp(zₖ/T − m)",
    message:
      "Temperature rescales scores. Subtracting the maximum m prevents numerical overflow without changing probabilities. Filters then remove candidates and renormalize.",
    code: "p = renormalize(top_p(top_k(softmax(z / T))))",
  },
  {
    title: "Select + repeat",
    formula: "y ~ Categorical(p), or y = argmax(z)",
    message:
      "Sample using the displayed random draw, or choose greedily. Append that token and repeat the forward pass until EOS or the context limit.",
    code: "next_id = sample(p); ids.append(next_id)",
  },
];
export const llmReading = {
  "llm-prediction": [
    [
      "Predicting a token, not necessarily a word",
      "An autoregressive language model estimates P(next token | all preceding tokens). Generation repeats that operation. It does not fetch a finished sentence from a list. The probabilities reflect its learned patterns, not a guarantee that the output is true.",
    ],
    [
      "Why the last position?",
      "Each position produces a contextual vector. A causal training objective pairs each input prefix with the following token. At generation time the last vector is the one whose target has not yet been supplied.",
    ],
    [
      "Prefill and decode",
      "A real decoder can process the prompt positions together with a causal mask. A KV cache then reuses earlier keys and values while adding one position at a time. This lab recomputes the full short context on each step; it does not implement a KV cache.",
    ],
  ],
  "llm-tokens": [
    [
      "A small WordPiece-style example",
      "This tokenizer lowercases text, separates punctuation, and greedily finds the longest vocabulary piece. Continuations carry ##: cats becomes cat + ##s. An unsegmentable word becomes one [UNK]. This is a fixed demonstration vocabulary, not the tokenizer of any commercial model.",
    ],
    [
      "Embeddings are a lookup table",
      "A token ID selects a row E[id]. The eight coordinates here are not named concepts such as “catness.” Token embeddings normally learn during training. Contextual vectors change after attention; the original lookup row does not change during inference.",
    ],
    [
      "Position changes the input",
      "This lab adds a small sinusoidal vector: P(pos,2i)=0.15 sin(pos/10000^(2i/8)); P(pos,2i+1)=0.15 cos(pos/10000^(2i/8)). Other architectures use different schemes, including rotary position embeddings.",
    ],
  ],
  "llm-attention": [
    [
      "Query, key, value",
      "A query participates in scoring which positions to draw from; keys are the vectors it is compared with; values are the content that gets mixed. These are learned projections in a full model. Their “question / address / content” names are analogies, not literal database operations.",
    ],
    [
      "Mask before softmax",
      "For query position i, any key position j > i gets score −∞, hence probability zero. Known positions including i remain available. Every row sums to one. Click a cell above the diagonal to inspect a blocked future token.",
    ],
    [
      "Attention is one operation",
      "A transformer also needs normalization, residual connections, and a feed-forward network. Real models often stack many blocks with multiple heads. A high attention weight is not by itself a complete explanation of why an output was produced.",
    ],
  ],
  "llm-sampling": [
    [
      "Scores are not percentages",
      "Logits may be negative and need not sum to anything. Softmax turns them into a distribution. Lower temperature sharpens it; higher temperature flattens it. This lab uses T≥0.1. Greedy decoding directly selects the largest logit instead of dividing by zero.",
    ],
    [
      "Filters and order",
      "Here, temperature comes first, then top-k, then top-p on the normalized top-k distribution. Top-p keeps the smallest ranked prefix whose cumulative mass reaches the threshold, including the token that crosses it. The kept probabilities are normalized again.",
    ],
    [
      "Sampling is reproducible here",
      "A seeded pseudorandom generator produces u in [0,1). The token whose cumulative interval contains u wins. The same prompt, settings, model, and seed reproduce the same selection. Changing a seed need not change the result. Entropy measures distribution spread in bits, not factual confidence.",
    ],
  ],
  "llm-training": [
    [
      "A next-token target",
      "In “the sky is blue”, a training example pairs the prefix “the sky is” with target “blue”. The cross-entropy loss is L=−ln p(target), measured in nats. This lab trains one selected example at a time; improvement on it need not improve other examples.",
    ],
    [
      "A gradient with numbers",
      "For softmax cross-entropy, ∂L/∂zⱼ=pⱼ−1[j=target]. With zⱼ=Wⱼ·h+bⱼ, gradients are ∂L/∂Wⱼ,d=(pⱼ−yⱼ)h_d and ∂L/∂bⱼ=pⱼ−yⱼ. Gradient descent subtracts learning rate times gradient.",
    ],
    [
      "Inference versus training",
      "Inference uses fixed parameters. Training changes them using targets and gradients. This exercise updates only the output projection and bias; the decoder is frozen. Full language-model training generally backpropagates through the entire network on many sequences. Neither this exercise nor the checkpoint is instruction tuning or human-feedback training.",
    ],
  ],
};
export const llmSources = [
  { label: "Transformer paper", url: "https://arxiv.org/abs/1706.03762" },
  {
    label: "WordPiece explanation",
    url: "https://huggingface.co/learn/llm-course/en/chapter6/6",
  },
  {
    label: "Decoding controls",
    url: "https://huggingface.co/docs/transformers/main_classes/text_generation",
  },
];
