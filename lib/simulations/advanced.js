import { trace, node, bars, bounded, numbers, text } from "./trace.js";
function rangeInput(p) {
  const nums = numbers(p.nums, { min: -20, max: 99, count: 12, name: "nums" }),
    index = bounded(p.index, 0, nums.length - 1, "index"),
    value = bounded(p.value, -20, 99, "value"),
    left = bounded(p.left, 0, nums.length - 1, "left"),
    right = bounded(p.right, left, nums.length - 1, "right");
  return { nums, index, value, left, right };
}
export function fenwick(p) {
  const { nums, index, value, left, right } = rangeInput(p),
    r = trace(),
    tree = Array(nums.length + 1).fill(0),
    values = [...nums];
  const visual = (active) => ({
    columns: ["Index (1-based)", "Covered interval", "Stored sum"],
    rows: tree
      .slice(1)
      .map((v, i) => [i + 1, `${i + 2 - ((i + 1) & -(i + 1))}…${i + 1}`, v]),
    bars: bars(values),
    metrics: { "Tree cell": active },
  });
  function add(i, delta) {
    for (; i < tree.length; i += i & -i) {
      tree[i] += delta;
      r.step(
        "tree[i] += delta; i += i & -i",
        `Add ${delta} to tree cell ${i}. Its low bit determines the interval width and next ancestor.`,
        visual(i),
      );
    }
  }
  nums.forEach((v, i) => add(i + 1, v));
  const delta = value - values[index];
  values[index] = value;
  add(index + 1, delta);
  function prefix(end) {
    let sum = 0;
    for (let i = end; i > 0; i -= i & -i) {
      sum += tree[i];
      r.step(
        "sum += tree[i]; i -= i & -i",
        `Prefix(${end}): take cell ${i}; running sum ${sum}.`,
        { ...visual(i), metrics: { Prefix: end, Sum: sum } },
      );
    }
    return sum;
  }
  const sum = prefix(right + 1) - prefix(left);
  r.step(
    "range(l,r) = prefix(r+1) - prefix(l)",
    `After nums[${index}]=${value}, the sum on [${left},${right}] is ${sum}.`,
    { ...visual("done"), metrics: { "Range sum": sum } },
  );
  return r.finish({ sum, values, tree });
}
export function segment(p) {
  const { nums, index, value, left, right } = rangeInput(p),
    r = trace(),
    values = [...nums],
    nodes = [],
    links = [];
  function build(lo, hi) {
    const id = nodes.length;
    nodes.push({ lo, hi, sum: 0 });
    if (lo === hi) nodes[id].sum = values[lo];
    else {
      const mid = (lo + hi) >> 1,
        a = build(lo, mid),
        b = build(mid + 1, hi);
      Object.assign(nodes[id], { a, b, sum: nodes[a].sum + nodes[b].sum });
      links.push([id, a], [id, b]);
    }
    return id;
  }
  build(0, values.length - 1);
  const visual = (active) => ({
    nodes: nodes.map((n, i) =>
      node(`[${n.lo},${n.hi}]`, n.sum, i === active ? "active" : ""),
    ),
    links,
    layout: "tree",
  });
  r.step(
    "build: parent.sum = left.sum + right.sum",
    "Each node stores the sum of its interval. Children partition that interval.",
    visual(0),
  );
  values[index] = value;
  function update(i) {
    const n = nodes[i];
    if (n.lo === n.hi) n.sum = value;
    else {
      update(index <= nodes[n.a].hi ? n.a : n.b);
      n.sum = nodes[n.a].sum + nodes[n.b].sum;
    }
    r.step(
      "update leaf; recompute sums on its ancestor path",
      `Update [${n.lo},${n.hi}] → ${n.sum}.`,
      visual(i),
    );
  }
  update(0);
  function query(i) {
    const n = nodes[i];
    if (n.hi < left || n.lo > right) {
      r.step(
        "if disjoint: return 0",
        `Skip [${n.lo},${n.hi}]; no overlap.`,
        visual(i),
      );
      return 0;
    }
    if (left <= n.lo && n.hi <= right) {
      r.step(
        "if fully covered: return node.sum",
        `Use the entire [${n.lo},${n.hi}] sum ${n.sum}.`,
        visual(i),
      );
      return n.sum;
    }
    r.step(
      "partial overlap: query both children",
      `Split [${n.lo},${n.hi}] to resolve partial coverage.`,
      visual(i),
    );
    return query(n.a) + query(n.b);
  }
  const sum = query(0);
  r.step("return combined sum", `Range [${left},${right}] sums to ${sum}.`, {
    ...visual(0),
    metrics: { "Range sum": sum },
  });
  return r.finish({ sum, values });
}
export function deque(p) {
  const nums = numbers(p.nums, { min: -20, max: 99, count: 16, name: "nums" }),
    k = bounded(p.k, 1, nums.length, "k"),
    r = trace(),
    q = [],
    result = [];
  nums.forEach((v, i) => {
    while (q.length && q[0] <= i - k) q.shift();
    while (q.length && nums[q.at(-1)] <= v) q.pop();
    q.push(i);
    if (i >= k - 1) result.push(nums[q[0]]);
    r.step(
      "expire front; discard dominated backs; append index; emit front",
      `Read nums[${i}]=${v}. Candidate values decrease from front to back; a newer equal-or-larger value outlasts the discarded candidate.`,
      {
        columns: ["Candidate index", "Value"],
        rows: q.map((j) => [j, nums[j]]),
        bars: bars(nums),
        metrics: {
          "Window start": Math.max(0, i - k + 1),
          "Window end": i,
          "Window maxima": result.join(", ") || "window not full",
        },
      },
    );
  });
  return r.finish({ result });
}
export function mst(p) {
  if (
    !Array.isArray(p.points) ||
    p.points.length < 1 ||
    p.points.length > 7 ||
    p.points.some(
      (a) =>
        !Array.isArray(a) ||
        a.length !== 2 ||
        a.some((v) => !Number.isInteger(v) || Math.abs(v) > 20),
    )
  )
    throw new Error(
      "Use 1–7 [x,y] points with integer coordinates from -20 to 20.",
    );
  const points = p.points,
    n = points.length,
    edges = [],
    parent = points.map((_, i) => i),
    size = points.map(() => 1),
    r = trace(),
    chosen = [];
  let cost = 0;
  const root = (i) => {
    while (parent[i] !== i) i = parent[i];
    return i;
  };
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++)
      edges.push([
        a,
        b,
        Math.abs(points[a][0] - points[b][0]) +
          Math.abs(points[a][1] - points[b][1]),
      ]);
  edges.sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
  r.step(
    "sort all edges by weight; start separate components",
    "Distance is Manhattan distance. We seek minimum total connection cost, not a shortest route between two points.",
    { nodes: points.map((p, i) => node(`Point ${i}`, p.join(", "))) },
  );
  for (const [a, b, w] of edges) {
    const ra = root(a),
      rb = root(b),
      take = ra !== rb;
    if (take) {
      const small = size[ra] < size[rb] ? ra : rb,
        large = small === ra ? rb : ra;
      parent[small] = large;
      size[large] += size[small];
      chosen.push([a, b, w]);
      cost += w;
    }
    r.step(
      "if roots differ: union endpoints and take edge",
      `${take ? "Take" : "Reject"} ${a}—${b}, weight ${w}: ${take ? "connects separate components" : "would close a cycle"}.`,
      {
        nodes: points.map((p, i) =>
          node(`Point ${i}`, p.join(", "), i === a || i === b ? "active" : ""),
        ),
        links: chosen.map(([a, b]) => [a, b]),
        columns: ["From", "To", "Weight"],
        rows: chosen,
        metrics: { "Total cost": cost, "Edges selected": chosen.length },
      },
    );
    if (chosen.length === n - 1) break;
  }
  return r.finish({ cost, edges: chosen });
}
function graph(p, directed) {
  const n = bounded(p.n, 1, 8, "n");
  if (!Array.isArray(p.edges) || p.edges.length > 24)
    throw new Error("Use at most 24 edges.");
  const seen = new Set(),
    adj = Array.from({ length: n }, () => []);
  p.edges.forEach((e, i) => {
    if (!Array.isArray(e) || e.length !== 2)
      throw new Error("Edges must be [from,to] pairs.");
    const [a, b] = e.map((v) => bounded(v, 0, n - 1, "vertex"));
    const key = directed ? `${a}:${b}` : [a, b].sort((a, b) => a - b).join(":");
    if (a === b || seen.has(key))
      throw new Error(
        "Use a simple graph without duplicate edges or self-loops.",
      );
    seen.add(key);
    adj[a].push([b, i]);
    if (!directed) adj[b].push([a, i]);
  });
  return { n, adj };
}
export function scc(p) {
  const { n, adj } = graph(p, true),
    r = trace(),
    seen = new Set(),
    order = [],
    groups = [],
    assigned = Array(n).fill(-1);
  const visual = (active) => ({
    nodes: assigned.map((c, i) =>
      node(
        `Vertex ${i}`,
        c < 0 ? "unassigned" : `SCC ${c}`,
        i === active ? "active" : "",
      ),
    ),
    links: p.edges,
    metrics: { "Finish order": order.join(", ") || "none" },
  });
  function first(v) {
    seen.add(v);
    for (const [w] of adj[v]) if (!seen.has(w)) first(w);
    order.push(v);
    r.step(
      "DFS original graph; append vertex on return",
      `Finish vertex ${v} after its descendants.`,
      visual(v),
    );
  }
  for (let i = 0; i < n; i++) if (!seen.has(i)) first(i);
  const reverse = Array.from({ length: n }, () => []);
  p.edges.forEach(([a, b]) => reverse[b].push(a));
  function second(v, c) {
    assigned[v] = c;
    groups[c].push(v);
    r.step(
      "DFS transposed graph in decreasing finish order",
      `Assign vertex ${v} to component ${c}. The reverse-edge pass stays within one remaining strongly connected component.`,
      { ...visual(v), links: p.edges.map(([a, b]) => [b, a]) },
    );
    for (const w of reverse[v]) if (assigned[w] < 0) second(w, c);
  }
  for (const v of [...order].reverse())
    if (assigned[v] < 0) {
      groups.push([]);
      second(v, groups.length - 1);
    }
  return r.finish({ groups, assigned });
}
export function bridges(p) {
  const { n, adj } = graph(p, false),
    r = trace(),
    tin = Array(n).fill(-1),
    low = Array(n).fill(-1),
    result = [];
  let time = 0;
  const visual = (v) => ({
    nodes: tin.map((t, i) =>
      node(`Vertex ${i}`, `in:${t} low:${low[i]}`, i === v ? "active" : ""),
    ),
    links: p.edges,
    columns: ["Bridge from", "Bridge to"],
    rows: result,
  });
  function dfs(v, edge = -1) {
    tin[v] = low[v] = time++;
    r.step("tin[v] = low[v] = timer++", `Discover vertex ${v}.`, visual(v));
    for (const [w, id] of adj[v]) {
      if (id === edge) continue;
      if (tin[w] < 0) {
        dfs(w, id);
        low[v] = Math.min(low[v], low[w]);
        if (low[w] > tin[v]) result.push([Math.min(v, w), Math.max(v, w)]);
        r.step(
          "low[v]=min(low[v],low[child]); bridge iff low[child]>tin[v]",
          `Return ${w} → ${v}: ${low[w] > tin[v] ? "no back route crosses above this edge; it is a bridge" : "another route prevents a bridge"}.`,
          visual(v),
        );
      } else {
        low[v] = Math.min(low[v], tin[w]);
        r.step(
          "back edge: low[v] = min(low[v], tin[neighbor])",
          `Seen neighbor ${w} lowers the reachable discovery time when applicable.`,
          visual(v),
        );
      }
    }
  }
  for (let v = 0; v < n; v++) if (tin[v] < 0) dfs(v);
  return r.finish({
    bridges: result.sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    tin,
    low,
  });
}
export function kmp(p) {
  const haystack = text(p.haystack, 48, "haystack"),
    needle = text(p.needle, 16, "needle");
  if (!/^[a-z]+$/.test(haystack) || !/^[a-z]+$/.test(needle))
    throw new Error("Use lowercase a–z characters.");
  const r = trace(),
    lps = Array(needle.length).fill(0),
    comparisons = { value: 0 };
  let len = 0;
  const visual = (i, j) => ({
    columns: ["Pattern index", "Character", "LPS"],
    rows: [...needle].map((c, k) => [k, c, lps[k]]),
    nodes: [node("Text", haystack), node("Pattern", needle)],
    metrics: {
      "Text cursor": i,
      "Pattern cursor": j,
      Comparisons: comparisons.value,
    },
  });
  for (let i = 1; i < needle.length;) {
    if (needle[i] === needle[len]) lps[i++] = ++len;
    else if (len) len = lps[len - 1];
    else lps[i++] = 0;
    r.step(
      "build longest proper prefix that is also a suffix",
      `Build fallback lengths without including the entire prefix itself.`,
      visual("preprocess", len),
    );
  }
  let i = 0,
    j = 0,
    index = -1;
  r.step(
    "i=0; j=0",
    "Scan the text; a mismatch can reuse a known prefix without moving the text cursor backward.",
    visual(i, j),
  );
  while (i < haystack.length) {
    comparisons.value++;
    if (haystack[i] === needle[j]) {
      i++;
      j++;
    } else if (j) j = lps[j - 1];
    else i++;
    r.step(
      "match: advance both; mismatch: j=lps[j-1] or advance i",
      `Now text cursor ${i}, pattern cursor ${j}.`,
      visual(i, j),
    );
    if (j === needle.length) {
      index = i - j;
      break;
    }
  }
  r.step(
    "return first match index, or -1",
    index < 0 ? "No match exists." : `First match begins at index ${index}.`,
    {
      ...visual(i, j),
      metrics: { Index: index, Comparisons: comparisons.value },
    },
  );
  return r.finish({ index, lps, comparisons: comparisons.value });
}
export function bitmask(p) {
  const nums = numbers(p.nums, { min: 1, max: 20, count: 8, name: "nums" }),
    k = bounded(p.k, 1, nums.length, "k"),
    total = nums.reduce((a, b) => a + b, 0),
    r = trace(),
    target = total / k;
  if (total % k || Math.max(...nums) > target) {
    r.step(
      "reject incompatible total or oversized element",
      "Equal nonempty subsets are impossible for this input.",
      { bars: bars(nums), metrics: { Total: total, Subsets: k } },
    );
    return r.finish({ possible: false, target });
  }
  const dp = Array(1 << nums.length).fill(-1),
    parent = Array(dp.length).fill(null);
  dp[0] = 0;
  r.step(
    "dp[0]=0; all other masks unreachable",
    "A bit marks a used element. dp[mask] stores the current bucket sum modulo target.",
    { bars: bars(nums), metrics: { "Target per subset": target } },
  );
  for (let mask = 0; mask < dp.length; mask++)
    if (dp[mask] >= 0)
      for (let i = 0; i < nums.length; i++)
        if (!(mask & (1 << i)) && dp[mask] + nums[i] <= target) {
          const next = mask | (1 << i);
          if (dp[next] >= 0) continue;
          dp[next] = (dp[mask] + nums[i]) % target;
          parent[next] = [mask, i];
          r.step(
            "if unused and fits: dp[mask | bit]=(dp[mask]+num)%target",
            `Take index ${i} (${nums[i]}): ${mask.toString(2).padStart(nums.length, "0")} → ${next.toString(2).padStart(nums.length, "0")}. A zero remainder closes a subset.`,
            {
              columns: ["Index", "Value", "Used"],
              rows: nums.map((v, j) => [j, v, !!(next & (1 << j))]),
              metrics: {
                Mask: next,
                "Current subset sum": dp[next],
                Target: target,
              },
            },
          );
        }
  const possible = dp.at(-1) === 0,
    groups = [];
  if (possible) {
    const order = [];
    let m = dp.length - 1;
    while (m) {
      order.push(parent[m][1]);
      m = parent[m][0];
    }
    let group = [],
      sum = 0;
    for (const i of order.reverse()) {
      group.push(i);
      sum += nums[i];
      if (sum === target) {
        groups.push(group);
        group = [];
        sum = 0;
      }
    }
  }
  r.step(
    "all-used mask reachable with remainder 0?",
    possible
      ? "Every element is used exactly once in equal-sum subsets."
      : "No sequence of valid subset fills uses every element.",
    {
      columns: ["Subset", "Indices", "Values"],
      rows: groups.map((g, i) => [
        i,
        g.join(", "),
        g.map((j) => nums[j]).join(", "),
      ]),
      metrics: { Possible: String(possible), Target: target },
    },
  );
  return r.finish({ possible, target, groups });
}
export const advancedModels = {
  "adv-fenwick": fenwick,
  "adv-segment": segment,
  "adv-deque": deque,
  "adv-mst": mst,
  "adv-scc": scc,
  "adv-bridges": bridges,
  "adv-kmp": kmp,
  "adv-bitmask": bitmask,
};
