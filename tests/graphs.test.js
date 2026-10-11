import test from "node:test";
import assert from "node:assert/strict";
import {
  searchGraph,
  gridGraph,
  adjacency,
  cheapestFlights,
  networkHeuristic,
} from "../lib/algorithms/graphs.js";
import {
  NETWORK_NODES,
  NETWORK_EDGES,
  AIRPORTS,
  FLIGHTS,
} from "../lib/data/networks.js";
import { traceMinimax, traceKnapsack } from "../lib/algorithms/traces.js";
import { analyzeTicTacToe } from "../lib/algorithms/tic-tac-toe.js";
import { analyzeChess, CHESS_POSITIONS } from "../lib/algorithms/chess.js";
import { solveKnapsack } from "../lib/algorithms/knapsack.js";

test("BFS finds fewest edges while Dijkstra and A* minimize weighted cost", () => {
  const graph = adjacency(NETWORK_NODES, NETWORK_EDGES);
  const bfs = searchGraph(graph, 0, 6, "bfs");
  assert.equal(bfs.cost, 3);
  const dijkstra = searchGraph(graph, 0, 6, "dijkstra");
  assert.equal(dijkstra.cost, 7);
  assert.deepEqual(dijkstra.path, [0, 2, 4, 5, 6]);
  const astar = searchGraph(
    graph,
    0,
    6,
    "astar",
    networkHeuristic(NETWORK_NODES, NETWORK_EDGES, 6),
  );
  assert.equal(astar.cost, dijkstra.cost);
  assert.equal(astar.events.at(-1).line, 3);
  assert.deepEqual(astar.events.at(-1).path, astar.path);
});
test("DFS handles cycles, produces a valid route, and expands each node once", () => {
  const graph = adjacency(NETWORK_NODES, NETWORK_EDGES),
    run = searchGraph(graph, 0, 6, "dfs");
  assert.equal(run.path[0], 0);
  assert.equal(run.path.at(-1), 6);
  assert.equal(new Set(run.visited).size, run.visited.length);
  for (let i = 1; i < run.path.length; i++)
    assert.ok(graph[run.path[i - 1]].some((e) => e.to === run.path[i]));
});
test("all searches handle disconnected and identical endpoints", () => {
  for (const algorithm of ["bfs", "dfs", "dijkstra", "astar"]) {
    const a = searchGraph([[], []], 0, 1, algorithm);
    assert.equal(a.cost, Infinity);
    assert.deepEqual(a.path, []);
    assert.equal(a.events.at(-1).line, 9);
    const b = searchGraph([[]], 0, 0, algorithm);
    assert.equal(b.cost, 0);
    assert.deepEqual(b.path, [0]);
  }
});
test("weighted grid routes avoid costly terrain, and never cross walls", () => {
  const cells = Array(15).fill(1);
  cells[6] = 5;
  cells[7] = 5;
  cells[8] = 5;
  const graph = gridGraph(3, 5, cells),
    h = (id) => Math.abs(Math.floor(id / 5) - 1) + Math.abs((id % 5) - 4);
  assert.equal(searchGraph(graph, 5, 9, "bfs").cost, 4);
  assert.equal(searchGraph(graph, 5, 9, "dijkstra").cost, 6);
  assert.equal(searchGraph(graph, 5, 9, "astar", h).cost, 6);
  cells[2] = cells[7] = cells[12] = -1;
  assert.equal(
    searchGraph(gridGraph(3, 5, cells), 5, 9, "dijkstra").cost,
    Infinity,
  );
});
test("A* and Dijkstra agree with an independent relaxation solver on many weighted grids", () => {
  let seed = 123;
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let trial = 0; trial < 30; trial++) {
    const cells = Array.from({ length: 30 }, () =>
      rand() < 0.18 ? -1 : rand() < 0.4 ? 5 : 1,
    );
    cells[0] = cells[29] = 1;
    const graph = gridGraph(5, 6, cells),
      distance = Array(30).fill(Infinity);
    distance[0] = 0;
    for (let pass = 0; pass < 29; pass++)
      for (let u = 0; u < 30; u++)
        for (const e of graph[u])
          distance[e.to] = Math.min(distance[e.to], distance[u] + e.weight);
    for (const algorithm of ["astar", "dijkstra"]) {
      const run = searchGraph(
        graph,
        0,
        29,
        algorithm,
        (id) => 4 - Math.floor(id / 6) + 5 - (id % 6),
      );
      assert.equal(run.cost, distance[29]);
      assert.ok(run.path.every((id) => cells[id] !== -1));
      if (run.path.length)
        assert.equal(
          run.path.slice(1).reduce((sum, id) => sum + cells[id], 0),
          run.cost,
        );
    }
  }
});
test("flight budget changes optimum and previous-round reads prevent excess stops", () => {
  assert.equal(cheapestFlights(AIRPORTS, FLIGHTS, 0, 4, 0).cost, 700);
  assert.equal(cheapestFlights(AIRPORTS, FLIGHTS, 0, 4, 1).cost, 500);
  assert.equal(cheapestFlights(AIRPORTS, FLIGHTS, 0, 4, 2).cost, 300);
  assert.equal(cheapestFlights(AIRPORTS, FLIGHTS, 4, 0, 4).cost, Infinity);
  assert.equal(cheapestFlights(AIRPORTS, FLIGHTS, 0, 0, 0).cost, 0);
  const chain = [
    { from: 0, to: 1, weight: 1 },
    { from: 1, to: 2, weight: 1 },
    { from: 2, to: 3, weight: 1 },
  ];
  assert.equal(cheapestFlights([0, 1, 2, 3], chain, 0, 3, 1).cost, Infinity);
});
test("flight planner agrees with exhaustive bounded walks for every airport pair", () => {
  const graph = adjacency(AIRPORTS, FLIGHTS, true);
  for (let s = 0; s < 6; s++)
    for (let d = 0; d < 6; d++)
      for (let k = 0; k < 4; k++) {
        function brute(u, left, cost) {
          let best = u === d ? cost : Infinity;
          if (left)
            for (const e of graph[u])
              best = Math.min(best, brute(e.to, left - 1, cost + e.weight));
          return best;
        }
        const run = cheapestFlights(AIRPORTS, FLIGHTS, s, d, k);
        assert.equal(run.cost, brute(s, k + 1, 0));
        assert.ok(run.path.length <= k + 2);
      }
});
test("execution traces match original algorithms and keep immutable snapshots", () => {
  const board = ["X", "O", null, null, "X", null, "O", null, null];
  const tic = traceMinimax({ board });
  assert.equal(tic.score, analyzeTicTacToe(board).score);
  assert.deepEqual(tic.events[0].board, board);
  assert.ok(tic.events.some((e) => e.vars.ply > 0));
  for (const p of CHESS_POSITIONS)
    for (const depth of [1, 2, 3])
      assert.equal(
        traceMinimax({ fen: p.fen, depth }).score,
        analyzeChess(p.fen, depth).score,
      );
  const items = [
    { name: "A", weight: 3, value: 5 },
    { name: "B", weight: 2, value: 4 },
  ];
  const run = traceKnapsack(items, 5);
  assert.equal(run.score, solveKnapsack(items, 5).value);
  assert.ok(run.events[0].table.flat().every((v) => v === 0));
  assert.deepEqual(run.events.at(-1).selected, [1, 0]);
  for (const trace of [tic, run]) {
    assert.ok(trace.events.at(-1).done);
    assert.ok(
      trace.events.every((e) => e.line >= 0 && e.line < trace.code.length),
    );
  }
});
