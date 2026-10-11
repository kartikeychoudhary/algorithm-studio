# Algorithm Studio

A local learning app built with **Vinext, React, and Vite**. Learn algorithms by changing a problem and watching its board, graph, variables, and pseudocode update together.

## Run locally

Use Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. For a local production server, stop development first, then run:

```sh
npm run build
npm start
```

Vinext provides App Router routes, React server rendering, and client components through Vite. `dist/` contains the production client and server builds; it is not a standalone static site. No deployment, database, account, or API key is required. The theme preference is stored locally; lesson edits persist across navigation and reset on reload.

## Lessons

| Route               | Interactive example                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| `/lessons/ttt`      | Full minimax, candidate scores, optimal moves, undo, and recursive execution                              |
| `/lessons/chess`    | Legal chess moves, depth 1–3 minimax with alpha–beta pruning, material evaluation, and best continuations |
| `/lessons/knapsack` | Editable 0/1 knapsack, dynamic programming table, take/skip decisions, and recovered items                |
| `/lessons/bfs`      | Queue traversal and fewest-edge routes                                                                    |
| `/lessons/dfs`      | Stack traversal and reachability                                                                          |
| `/lessons/dijkstra` | Minimum-cost paths with non-negative weights                                                              |
| `/lessons/astar`    | A* with consistent Manhattan or scaled geometric heuristics                                               |
| `/lessons/flights`  | Cheapest flights within K stops, using layered Bellman–Ford; inspired by LeetCode 787                     |

Graph lessons share editable grids and networks, so you can compare algorithms on the same input. Execution controls include step, rewind, play/pause, finish, and playback speed. Dark theme is the default. Legacy links such as `/#flights` redirect to their lesson route.

## Project structure

```text
app/                     Vinext App Router pages, root layout, and 404 page
components/
  layout/                Application shell, navigation, guides, and state provider
  execution/             Shared pseudocode, variables, explanations, and controls
  ui/                    Reusable panels and validated numeric input
features/
  minimax/               Tic-tac-toe and chess lesson components and boards
  knapsack/              Inventory editor and dynamic programming table
  graphs/                Graph lesson, grid, SVG network, editor, and inspector
hooks/                   Playback lifecycle and timer management
lib/
  algorithms/            Pure solvers and immutable execution trace generators
  data/                  Lesson metadata, explanations, networks, and grid presets
styles/                  Shared responsive layout and themes
tests/                   Algorithm correctness and React interaction tests
.github/workflows/       Automated tests and production build
```

Route files select the lesson; feature components own its presentation. A shared provider retains lesson inputs between routes, while `usePlayback` owns each trace's temporary playback state and cleans up timers. Solvers have no React or browser dependencies. Visualizations render immutable snapshots instead of mutating the DOM.

To add a lesson, implement its solver in `lib/algorithms`, its UI in `features`, register metadata in `lib/data/lessons.js`, and connect it to `Studio` and `Sidebar`. Reuse the execution components when the algorithm exposes step events.

## Validation

```sh
npm test                 # Pure algorithm and trace correctness
npm run test:components  # React interactions and playback cleanup
npm run build            # Client, SSR, and React Server Component builds
npm run check            # All of the above
npm run format           # Format source and documentation
```

Tests cover adversarial tic-tac-toe play, chess terminal positions, knapsack against exhaustive selection, weighted graph searches against a reference solver, bounded flights against exhaustive routes, trace/solver equivalence, and interactive edits. GitHub Actions runs the same check command.

Complexity labels describe the underlying algorithms. Storing snapshots for backward playback adds teaching overhead. The chess evaluation is intentionally material-only and is not a competitive chess engine. Google Fonts is optional; system fonts are used when unavailable.

See [dependency notes](docs/dependencies.md) for the remaining upstream build-tool advisory and the patched dependency override.
