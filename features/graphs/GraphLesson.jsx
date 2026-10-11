"use client";
import { useMemo, useState } from "react";
import { useLessonState } from "../../components/layout/StudioProvider.jsx";
import { Panel, LearningStrip } from "../../components/ui/Panel.jsx";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import { usePlayback } from "../../hooks/usePlayback.js";
import {
  adjacency,
  cheapestFlights,
  gridGraph,
  networkHeuristic,
  searchGraph,
} from "../../lib/algorithms/graphs.js";
import {
  AIRPORTS,
  FLIGHTS,
  NETWORK_EDGES,
  NETWORK_NODES,
} from "../../lib/data/networks.js";
import { COLS, ROWS, makeGrid } from "../../lib/data/grid.js";
import { formatValue as fmt } from "../../lib/format.js";
import GridCanvas from "./GridCanvas.jsx";
import NetworkGraph from "./NetworkGraph.jsx";
import GraphInspector from "./GraphInspector.jsx";
import EdgeEditor from "./EdgeEditor.jsx";

const initial = {
  mode: "grid",
  ...makeGrid(),
  edges: NETWORK_EDGES.map((e) => ({ ...e, enabled: true })),
  flights: FLIGHTS.map((e) => ({ ...e, enabled: true })),
  networkStart: 0,
  networkGoal: 6,
  source: 0,
  destination: 4,
  stops: 1,
};
const insights = {
  bfs: "BFS minimizes the number of edges. It ignores terrain and edge weights.",
  dfs: "DFS finds a route, but does not guarantee the fewest moves or the lowest cost.",
  dijkstra:
    "Dijkstra minimizes total cost with non-negative weights. Expensive terrain can make a longer route cheaper.",
  astar:
    "A* prioritizes f = g + h. Our consistent heuristic never overestimates the remaining cost.",
  flights:
    "K stops allows K + 1 flights. Read from the previous round to prevent using too many flights.",
};
function NodeSelect({ label, nodes, value, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {nodes.map((node, i) => (
          <option key={i} value={i}>
            {node.label}
            {node.name ? ` · ${node.name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function GraphLesson({ algorithm }) {
  const [state, setState] = useLessonState("graph", initial),
    [tool, setTool] = useState("wall");
  const flights = algorithm === "flights",
    weighted = ["dijkstra", "astar"].includes(algorithm);
  const run = useMemo(() => {
    if (flights)
      return {
        ...cheapestFlights(
          AIRPORTS,
          state.flights,
          state.source,
          state.destination,
          state.stops,
        ),
        nodes: AIRPORTS,
        edges: state.flights,
        start: state.source,
        goal: state.destination,
      };
    if (state.mode === "grid")
      return {
        ...searchGraph(
          gridGraph(ROWS, COLS, state.cells),
          state.start,
          state.goal,
          algorithm,
          (id) =>
            Math.abs(Math.floor(id / COLS) - Math.floor(state.goal / COLS)) +
            Math.abs((id % COLS) - (state.goal % COLS)),
        ),
        nodes: state.cells.map((_, id) => ({
          label: `${Math.floor(id / COLS) + 1},${(id % COLS) + 1}`,
        })),
        edges: [],
        start: state.start,
        goal: state.goal,
      };
    return {
      ...searchGraph(
        adjacency(NETWORK_NODES, state.edges),
        state.networkStart,
        state.networkGoal,
        algorithm,
        networkHeuristic(NETWORK_NODES, state.edges, state.networkGoal),
      ),
      nodes: NETWORK_NODES,
      edges: state.edges,
      start: state.networkStart,
      goal: state.networkGoal,
    };
  }, [algorithm, flights, state]);
  const playback = usePlayback(run),
    event = run.events[playback.index];
  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  function editCell(id) {
    if (
      (tool === "start" && id === state.goal) ||
      (tool === "goal" && id === state.start)
    )
      return;
    if (
      !["start", "goal"].includes(tool) &&
      (id === state.start || id === state.goal)
    )
      return;
    const cells = state.cells.slice();
    cells[id] =
      tool === "wall"
        ? cells[id] === -1
          ? 1
          : -1
        : tool === "terrain"
          ? 5
          : 1;
    update({
      cells,
      ...(["start", "goal"].includes(tool) ? { [tool]: id } : {}),
    });
  }
  function editEdge(index, patch) {
    const key = flights ? "flights" : "edges";
    update({
      [key]: state[key].map((edge, i) =>
        i === index ? { ...edge, ...patch } : edge,
      ),
    });
  }
  return (
    <>
      <LearningStrip
        tag={
          flights
            ? "Stop-constrained routing"
            : algorithm === "dfs"
              ? "Reachability"
              : weighted
                ? "Minimum cost"
                : "Minimum moves"
        }
      >
        {insights[algorithm]}
      </LearningStrip>
      <div className="graph-layout">
        <Panel
          className="graph-canvas-panel"
          eyebrow={flights ? "THE FLIGHT NETWORK" : "BUILD YOUR OWN PROBLEM"}
          title={
            flights
              ? "A cheaper ticket. One more connection."
              : "One map. Different ways to explore."
          }
          action={
            !flights && (
              <div className="segmented">
                {["grid", "network"].map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={state.mode === mode}
                    className={state.mode === mode ? "active" : ""}
                    onClick={() => update({ mode })}
                  >
                    {mode === "grid" ? "Grid" : "Graph"}
                  </button>
                ))}
              </div>
            )
          }
        >
          {flights ? (
            <div className="graph-settings">
              <NodeSelect
                label="From"
                nodes={AIRPORTS}
                value={state.source}
                onChange={(source) => update({ source })}
              />
              <NodeSelect
                label="To"
                nodes={AIRPORTS}
                value={state.destination}
                onChange={(destination) => update({ destination })}
              />
              <label>
                Maximum stops
                <select
                  value={state.stops}
                  onChange={(e) => update({ stops: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "stop" : "stops"} · {n + 1}{" "}
                      {n === 0 ? "flight" : "flights"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : state.mode === "grid" ? (
            <div
              className="grid-tools"
              role="group"
              aria-label="Grid editing tools"
            >
              {[
                ["wall", "▧ Wall"],
                ["terrain", "5 Terrain"],
                ["erase", "Erase"],
                ["start", "S Start"],
                ["goal", "G Goal"],
              ].map(([id, name]) => (
                <button
                  key={id}
                  aria-pressed={tool === id}
                  className={tool === id ? "active" : ""}
                  onClick={() => setTool(id)}
                >
                  {name}
                </button>
              ))}
              <select
                value=""
                aria-label="Grid preset"
                onChange={(e) => {
                  if (e.target.value) update(makeGrid(e.target.value));
                }}
              >
                <option value="">Load a map…</option>
                <option value="weighted">Weighted shortcut</option>
                <option value="maze">Maze</option>
                <option value="empty">Clear grid</option>
                <option value="blocked">Unreachable goal</option>
              </select>
            </div>
          ) : (
            <div className="graph-settings">
              <NodeSelect
                label="Start"
                nodes={NETWORK_NODES}
                value={state.networkStart}
                onChange={(networkStart) => update({ networkStart })}
              />
              <NodeSelect
                label="Goal"
                nodes={NETWORK_NODES}
                value={state.networkGoal}
                onChange={(networkGoal) => update({ networkGoal })}
              />
            </div>
          )}
          {!flights && state.mode === "grid" ? (
            <GridCanvas state={state} event={event} onCell={editCell} />
          ) : (
            <NetworkGraph
              nodes={run.nodes}
              edges={run.edges}
              event={event}
              start={run.start}
              goal={run.goal}
              directed={flights}
            />
          )}
          <div className="graph-legend">
            {["source", "frontier", "visited", "current", "path"].map(
              (name, i) => (
                <span key={name}>
                  <i className={`legend-${name}`} />
                  {["Start", "Frontier", "Visited", "Current", "Route"][i]}
                </span>
              ),
            )}
          </div>
          <p className="small-note">
            {flights
              ? "Directed edges · fictional fares in dollars. Labels below airports show the previous-round cost."
              : state.mode === "grid"
                ? `Click cells to edit. Four-direction movement. ${weighted ? "Entering a normal cell costs 1; terrain costs 5." : "Each traversable step counts as 1, including terrain."} Editing restarts execution.`
                : "Undirected edges · positive weights. Switch algorithms to compare the same network."}
          </p>
          {(flights || state.mode === "network") && (
            <EdgeEditor
              nodes={run.nodes}
              edges={run.edges}
              directed={flights}
              onChange={editEdge}
            />
          )}
          <div className="run-stats">
            <div>
              <span>{flights ? "FLIGHT BUDGET" : "EXPANDED"}</span>
              <strong>
                {flights ? event.round : event.visited.length}
                <small>{flights ? ` / ${state.stops + 1}` : " nodes"}</small>
              </strong>
            </div>
            <div>
              <span>
                {flights
                  ? "BEST COMMITTED FARE"
                  : weighted
                    ? "ROUTE COST"
                    : "ROUTE LENGTH"}
              </span>
              <strong>
                {flights
                  ? fmt(event.distances[state.destination])
                  : event.done
                    ? fmt(event.cost)
                    : "—"}
              </strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong className="status-word">
                {event.done
                  ? Number.isFinite(event.cost)
                    ? "Route found"
                    : "No route"
                  : playback.index === 0
                    ? "Ready"
                    : "Exploring"}
              </strong>
            </div>
          </div>
          <div className="route-result">
            {event.done
              ? event.path.length
                ? event.path.map((id) => run.nodes[id].label).join(" → ")
                : "No valid route. Change the map, endpoints, or stop limit and try again."
              : flights
                ? "Try 0, 1, then 2 stops: the default cheapest fare changes from $700 → $500 → $300."
                : algorithm === "astar"
                  ? `Heuristic: ${state.mode === "grid" ? "Manhattan distance × minimum step cost (1)" : "straight-line distance × minimum edge cost per geometric unit"}.`
                  : "Finish the search to reveal the recovered route."}
          </div>
        </Panel>
        <GraphInspector
          algorithm={algorithm}
          run={run}
          event={event}
          playback={playback}
        />
      </div>
      <PlaybackControls playback={playback} />
      <div className="concept-banner">
        <span className="concept-icon">↳</span>
        <div>
          <strong>
            {flights
              ? "Why a single cheapest price per airport can fail"
              : "Which algorithm should I use?"}
          </strong>
          <p>
            {flights ? (
              <>
                A cheap arrival may use every allowed flight. Layered
                Bellman–Ford preserves the flight budget by copying the previous
                round. Inspired by{" "}
                <a
                  href="https://leetcode.com/problems/cheapest-flights-within-k-stops/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LeetCode 787 ↗
                </a>
                .
              </>
            ) : (
              "BFS: fewest edges in an unweighted graph. DFS: explore and test reachability. Dijkstra: minimum cost with non-negative weights. A*: minimum cost with a consistent heuristic. Flights with a stop limit: track the flight budget, too."
            )}
          </p>
        </div>
      </div>
    </>
  );
}
