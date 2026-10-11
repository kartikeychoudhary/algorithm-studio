// Events are immutable snapshots of actual execution, used for forward/backward playback.
export const GRAPH_CODE = {
  bfs: [
    "frontier = queue([start]); seen = {start}",
    "while frontier is not empty:",
    "  current = frontier.dequeue(); visit(current)",
    "  if current == goal: return path(parent, goal)",
    "  for neighbor in neighbors(current):",
    "    if neighbor not in seen:",
    "      seen.add(neighbor); parent[neighbor] = current",
    "      distance[neighbor] = distance[current] + 1",
    "      frontier.enqueue(neighbor)",
    "return NO_PATH",
  ],
  dfs: [
    "frontier = stack([start]); seen = {start}",
    "while frontier is not empty:",
    "  current = frontier.pop(); visit(current)",
    "  if current == goal: return path(parent, goal)",
    "  for neighbor in neighbors(current):",
    "    if neighbor not in seen:",
    "      seen.add(neighbor); parent[neighbor] = current",
    "      distance[neighbor] = distance[current] + 1",
    "      frontier.push(neighbor)",
    "return NO_PATH",
  ],
  dijkstra: [
    "g[start] = 0; frontier.push(start, priority=0)",
    "while frontier is not empty:",
    "  current = frontier.pop_min(); skip stale entries",
    "  if current == goal: return path(parent, goal)",
    "  for neighbor, weight in neighbors(current):",
    "    candidate = g[current] + weight",
    "    if candidate < g[neighbor]:",
    "      g[neighbor] = candidate; parent[neighbor] = current",
    "      frontier.push(neighbor, priority=g[neighbor])",
    "return NO_PATH",
  ],
  astar: [
    "g[start] = 0; frontier.push(start, h(start))",
    "while frontier is not empty:",
    "  current = frontier.pop_min(); skip stale entries",
    "  if current == goal: return path(parent, goal)",
    "  for neighbor, weight in neighbors(current):",
    "    candidate = g[current] + weight",
    "    if candidate < g[neighbor]:",
    "      g[neighbor] = candidate; parent[neighbor] = current",
    "      frontier.push(neighbor, g[neighbor] + h(neighbor))",
    "return NO_PATH",
  ],
  flights: [
    "cost[source] = 0; all other costs = infinity",
    "for flights_used = 1 to max_stops + 1:",
    "  next = copy(cost); next_paths = copy(paths)",
    "  for (from, to, fare) in flights:",
    "    candidate = cost[from] + fare  // previous round only",
    "    if candidate < next[to]:",
    "      next[to] = candidate",
    "      next_paths[to] = paths[from] + [to]",
    "  cost = next; paths = next_paths",
    "return cost[destination], paths[destination]",
  ],
};

class MinHeap {
  constructor() {
    this.data = [];
    this.order = 0;
  }
  push(id, priority, cost) {
    const entry = { id, priority, cost, order: this.order++ };
    this.data.push(entry);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.less(entry, this.data[p])) break;
      this.data[i] = this.data[p];
      i = p;
    }
    this.data[i] = entry;
  }
  less(a, b) {
    return (
      a.priority < b.priority ||
      (a.priority === b.priority && a.order < b.order)
    );
  }
  pop() {
    const root = this.data[0],
      last = this.data.pop();
    if (this.data.length) {
      let i = 0;
      while (i * 2 + 1 < this.data.length) {
        let child = i * 2 + 1;
        if (
          child + 1 < this.data.length &&
          this.less(this.data[child + 1], this.data[child])
        )
          child++;
        if (!this.less(this.data[child], last)) break;
        this.data[i] = this.data[child];
        i = child;
      }
      this.data[i] = last;
    }
    return root;
  }
}

export function gridGraph(rows, cols, cells) {
  return cells.map((cell, id) => {
    if (cell === -1) return [];
    const r = Math.floor(id / cols),
      c = id % cols;
    return [
      [r, c + 1],
      [r + 1, c],
      [r, c - 1],
      [r - 1, c],
    ]
      .filter(
        ([nr, nc]) =>
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          cells[nr * cols + nc] !== -1,
      )
      .map(([nr, nc]) => ({
        to: nr * cols + nc,
        weight: cells[nr * cols + nc],
      }));
  });
}

export function adjacency(nodes, edges, directed = false) {
  const graph = nodes.map(() => []);
  edges
    .filter((e) => e.enabled !== false)
    .forEach((e) => {
      graph[e.from].push({ to: e.to, weight: e.weight });
      if (!directed) graph[e.to].push({ to: e.from, weight: e.weight });
    });
  return graph;
}

export function networkHeuristic(nodes, edges, goal) {
  // Scaling by the cheapest cost per geometric unit makes this consistent on every edge.
  let scale = Infinity;
  for (const e of edges.filter((e) => e.enabled !== false)) {
    const d = Math.hypot(
      nodes[e.from].x - nodes[e.to].x,
      nodes[e.from].y - nodes[e.to].y,
    );
    if (d) scale = Math.min(scale, e.weight / d);
  }
  if (!Number.isFinite(scale)) scale = 0;
  return (id) =>
    scale *
    Math.hypot(nodes[id].x - nodes[goal].x, nodes[id].y - nodes[goal].y);
}

export function searchGraph(
  graph,
  start,
  goal,
  algorithm = "bfs",
  heuristic = () => 0,
) {
  if (!["bfs", "dfs", "dijkstra", "astar"].includes(algorithm))
    throw new Error("Unknown algorithm");
  if (!graph[start] || !graph[goal]) throw new Error("Invalid endpoints");
  if (graph.some((edges) => edges.some((e) => e.weight < 0)))
    throw new Error("Non-negative weights required");
  const weighted = algorithm === "dijkstra" || algorithm === "astar";
  const g = Array(graph.length).fill(Infinity),
    parent = Array(graph.length).fill(null);
  const seen = new Set([start]),
    visited = [],
    closed = new Set(),
    events = [];
  const heap = new MinHeap(),
    linear = [start];
  let head = 0;
  const h = algorithm === "astar" ? heuristic : () => 0;
  g[start] = 0;
  heap.push(start, h(start), 0);
  let current = null,
    neighbor = null,
    candidate = null;
  const frontier = () =>
    weighted
      ? [
          ...new Set(
            heap.data
              .filter((e) => e.cost === g[e.id] && !closed.has(e.id))
              .sort((a, b) => a.priority - b.priority || a.order - b.order)
              .map((e) => e.id),
          ),
        ]
      : algorithm === "bfs"
        ? linear.slice(head)
        : linear.slice().reverse();
  const emit = (line, message, extra = {}) =>
    events.push({
      line,
      message,
      current,
      neighbor,
      candidate,
      visited: visited.slice(),
      frontier: frontier(),
      distances: g.slice(),
      parent: parent.slice(),
      h: current === null ? null : h(current),
      path: [],
      ...extra,
    });
  emit(0, "Initialize the frontier with the start node; its distance is 0.");
  const reconstruct = () => {
    const path = [];
    for (let u = goal; u !== null; u = parent[u]) path.push(u);
    return path.reverse();
  };
  while (
    weighted
      ? heap.data.length
      : algorithm === "bfs"
        ? head < linear.length
        : linear.length
  ) {
    neighbor = null;
    candidate = null;
    emit(1, "The frontier still has nodes to explore.");
    if (weighted) {
      const entry = heap.pop();
      if (entry.cost !== g[entry.id] || closed.has(entry.id)) continue;
      current = entry.id;
    } else current = algorithm === "bfs" ? linear[head++] : linear.pop();
    closed.add(current);
    visited.push(current);
    emit(
      2,
      weighted
        ? "Remove the node with the smallest priority."
        : algorithm === "bfs"
          ? "Remove the oldest node: breadth-first order."
          : "Remove the newest node: depth-first order.",
    );
    if (current === goal) {
      const path = reconstruct();
      emit(
        3,
        "Destination reached. Follow the parent links back to the start.",
        { path, done: true, cost: g[goal] },
      );
      return { events, path, cost: g[goal], visited };
    }
    for (const edge of graph[current]) {
      neighbor = edge.to;
      candidate = null;
      emit(4, "Inspect this adjacent node.");
      if (weighted) {
        candidate = g[current] + edge.weight;
        emit(
          5,
          `Candidate cost = ${g[current]} + ${edge.weight} = ${candidate}.`,
        );
        emit(
          6,
          candidate < g[neighbor]
            ? "This route improves the known distance."
            : "The known route is at least as good; skip this edge.",
        );
        if (candidate >= g[neighbor]) continue;
        g[neighbor] = candidate;
        parent[neighbor] = current;
        emit(7, "Save the improved distance and its parent.");
        closed.delete(neighbor);
        heap.push(neighbor, candidate + h(neighbor), candidate);
      } else {
        emit(
          5,
          seen.has(neighbor)
            ? "Already discovered; do not enqueue twice."
            : "This node has not been discovered.",
        );
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        parent[neighbor] = current;
        emit(6, "Mark discovered and save the parent.");
        g[neighbor] = g[current] + 1;
        emit(7, "Record one more edge from the start.");
        linear.push(neighbor);
      }
      emit(
        8,
        algorithm === "astar"
          ? `Add to frontier with f = g + h = ${g[neighbor]} + ${h(neighbor).toFixed(1)}.`
          : "Add the neighbor to the frontier.",
      );
    }
  }
  current = null;
  neighbor = null;
  emit(9, "The frontier is empty. No route reaches this destination.", {
    done: true,
    cost: Infinity,
  });
  return { events, path: [], cost: Infinity, visited };
}

export function cheapestFlights(nodes, edges, source, destination, maxStops) {
  let costs = nodes.map(() => Infinity),
    paths = nodes.map(() => []);
  costs[source] = 0;
  paths[source] = [source];
  const events = [];
  let round = 0,
    edge = null,
    candidate = null,
    next = costs.slice();
  const emit = (line, message, extra = {}) =>
    events.push({
      line,
      message,
      round,
      edge: edge ? { ...edge } : null,
      candidate,
      distances: costs.slice(),
      next: next.slice(),
      path: paths[destination].slice(),
      ...extra,
    });
  emit(0, "Only the source can be reached with zero flights.");
  for (round = 1; round <= maxStops + 1; round++) {
    edge = null;
    candidate = null;
    emit(
      1,
      `Allow at most ${round} flight${round === 1 ? "" : "s"} (${round - 1} stop${round === 2 ? "" : "s"}).`,
    );
    next = costs.slice();
    const nextPaths = paths.map((p) => p.slice());
    emit(
      2,
      "Copy previous costs. Read only the previous round while relaxing flights.",
    );
    for (edge of edges.filter((e) => e.enabled !== false)) {
      candidate = null;
      emit(3, "Inspect this directed flight.");
      candidate = costs[edge.from] + edge.weight;
      emit(
        4,
        Number.isFinite(candidate)
          ? `Previous cost ${costs[edge.from]} + fare ${edge.weight} = ${candidate}.`
          : "The departure airport was unreachable in the previous round.",
      );
      emit(
        5,
        candidate < next[edge.to]
          ? "This flight improves the next-round cost."
          : "No improvement within this flight budget.",
      );
      if (candidate < next[edge.to]) {
        next[edge.to] = candidate;
        emit(6, "Update the arrival cost in the next-round array.");
        nextPaths[edge.to] = [...paths[edge.from], edge.to];
        emit(7, "Remember the route that achieves this cost.");
      }
    }
    costs = next;
    paths = nextPaths;
    edge = null;
    candidate = null;
    emit(
      8,
      "Commit this round. Its answers can now be used in the next round.",
    );
  }
  round = maxStops + 1;
  emit(
    9,
    Number.isFinite(costs[destination])
      ? "The cheapest route satisfying the stop limit is ready."
      : "No route satisfies this stop limit.",
    { done: true, cost: costs[destination] },
  );
  return { events, cost: costs[destination], path: paths[destination] };
}
