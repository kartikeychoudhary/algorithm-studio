"use client";
import { useMemo } from "react";
import { useLessonState } from "../../components/layout/StudioProvider.jsx";
import { Panel, LearningStrip } from "../../components/ui/Panel.jsx";
import NumberField from "../../components/ui/NumberField.jsx";
import { solveKnapsack } from "../../lib/algorithms/knapsack.js";
import { traceKnapsack } from "../../lib/algorithms/traces.js";
import { usePlayback } from "../../hooks/usePlayback.js";
import PlaybackControls from "../../components/execution/PlaybackControls.jsx";
import ExecutionView from "../../components/execution/ExecutionView.jsx";
import KnapsackTable from "./KnapsackTable.jsx";

const initial = {
  capacity: 7,
  items: [
    { name: "Camera", weight: 4, value: 8 },
    { name: "Headphones", weight: 3, value: 6 },
    { name: "Notebook", weight: 2, value: 5 },
    { name: "Water bottle", weight: 1, value: 2 },
  ],
};

export default function KnapsackLesson({ tab }) {
  const [state, setState] = useLessonState("knapsack", initial);
  const trace = useMemo(
    () => (tab === "code" ? traceKnapsack(state.items, state.capacity) : null),
    [tab, state],
  );
  if (tab === "code")
    return <ExecutionView run={trace} kind="knapsack" items={state.items} />;
  return <KnapsackPlayground state={state} onChange={setState} />;
}
function KnapsackPlayground({ state, onChange }) {
  const solved = useMemo(
    () => solveKnapsack(state.items, state.capacity),
    [state],
  );
  const run = useMemo(() => ({ events: [null, ...solved.steps] }), [solved]);
  const playback = usePlayback(run),
    step = run.events[playback.index],
    done = playback.index === run.events.length - 1;
  const item = step ? state.items[step.i - 1] : null;
  function updateItem(index, field, value) {
    onChange({
      ...state,
      items: state.items.map((it, i) =>
        i === index ? { ...it, [field]: value } : it,
      ),
    });
  }
  return (
    <>
      <LearningStrip tag="0/1 Knapsack">
        <strong>Take it or leave it.</strong> Compare both choices and reuse
        answers to smaller problems.
      </LearningStrip>
      <div className="lab-grid knapsack-layout">
        <Panel
          eyebrow="YOUR INVENTORY"
          title="A bag with a limit."
          action={
            <button
              className="icon-button"
              onClick={playback.restart}
              aria-label="Reset knapsack"
            >
              ↺
            </button>
          }
        >
          <div className="capacity-block">
            <label htmlFor="capacity">
              Bag capacity{" "}
              <strong>
                {state.capacity}
                <small> kg</small>
              </strong>
            </label>
            <input
              id="capacity"
              type="range"
              min={1}
              max={15}
              value={state.capacity}
              onChange={(e) =>
                onChange({ ...state, capacity: Number(e.target.value) })
              }
            />
            <div>
              <span>1 kg</span>
              <span>15 kg</span>
            </div>
          </div>
          <div className="inventory-heading">
            <span>Item</span>
            <span>Weight · kg</span>
            <span>Value · $</span>
          </div>
          {state.items.map((it, i) => (
            <div
              key={it.name}
              className={`inventory-row ${done && solved.selected.includes(i) ? "packed" : ""}`}
            >
              <div>
                <span className="item-icon">{["◈", "♫", "▤", "◉"][i]}</span>
                <strong>{it.name}</strong>
              </div>
              <NumberField
                value={it.weight}
                max={15}
                label={`${it.name} weight`}
                onChange={(v) => updateItem(i, "weight", v)}
              />
              <NumberField
                value={it.value}
                max={99}
                label={`${it.name} value`}
                onChange={(v) => updateItem(i, "value", v)}
              />
            </div>
          ))}
          <div className="packed-bag">
            <span className="overline">
              {done ? "THE OPTIMAL PACK" : "YOUR BAG"}
            </span>
            <div className="bag-visual">
              <strong>
                {done ? solved.weight : 0}
                <small> / {state.capacity} kg</small>
              </strong>
            </div>
            <div className="capacity-meter">
              <i
                style={{
                  width: `${done ? (solved.weight / state.capacity) * 100 : 0}%`,
                }}
              />
            </div>
            <p>
              {done
                ? solved.selected.map((i) => state.items[i].name).join(" + ") ||
                  "No item fits."
                : "Step through the table to find what belongs inside."}
            </p>
            <div className="total-value">
              <span>Best total value</span>
              <strong>{done ? `$${solved.value}` : "—"}</strong>
            </div>
          </div>
          <p className="small-note">
            Adjust weights, values, or capacity. Each edit starts a fresh table.
          </p>
        </Panel>
        <Panel
          className="dp-panel"
          eyebrow="BUILDING THE ANSWER"
          title="Small decisions. One optimal result."
        >
          <p className="panel-copy">
            Each cell is the best value using the first i items and at most w
            kg. Click a cell to inspect its decision.
          </p>
          <KnapsackTable
            table={solved.table}
            items={state.items}
            visibleSteps={playback.index}
            current={step}
            dependency={
              step
                ? {
                    i: step.i - 1,
                    columns: [
                      step.c,
                      ...(step.take !== null ? [step.c - item.weight] : []),
                    ],
                  }
                : null
            }
            onCell={(i, c) =>
              playback.seek(
                i === 0 ? 0 : (i - 1) * (state.capacity + 1) + c + 1,
              )
            }
          />
          <div className="tree-key">
            <span>Current cell</span>
            <span>Previous answers used</span>
          </div>
          <div className="dp-explain" aria-live="polite">
            {!step ? (
              <>
                <span className="overline">START WITH WHAT YOU KNOW</span>
                <h3>No items means no value.</h3>
                <p>
                  The first row is 0. Fill the table one item and capacity at a
                  time.
                </p>
              </>
            ) : (
              <>
                <span className="overline">
                  {item.name} · CAPACITY {step.c} KG
                </span>
                <h3>
                  {step.take === null
                    ? "This item is too heavy."
                    : step.chosen
                      ? "Taking this item is better."
                      : "Skipping is at least as good."}
                </h3>
                <div className="choice-comparison">
                  <div>
                    <span>SKIP THIS ITEM</span>
                    <strong>${step.skip}</strong>
                    <small>Previous row, same capacity</small>
                  </div>
                  <span>vs.</span>
                  <div className={step.chosen ? "chosen" : ""}>
                    <span>TAKE THIS ITEM</span>
                    <strong>
                      {step.take === null ? "Doesn’t fit" : `$${step.take}`}
                    </strong>
                    <small>
                      {step.take === null
                        ? `${item.weight} kg > ${step.c} kg`
                        : `$${item.value} + $${solved.table[step.i - 1][step.c - item.weight]} from remaining capacity`}
                    </small>
                  </div>
                </div>
                <p>
                  Store {step.value} in dp[{step.i}][{step.c}].
                </p>
              </>
            )}
          </div>
        </Panel>
      </div>
      <PlaybackControls playback={playback} />
      <div className="concept-banner">
        <div>
          <strong>Why not just pick the most valuable item?</strong>
          <p>
            With capacity set to 5 kg, headphones + notebook earn $11. The $8
            camera is the most valuable single item, but greedy selection misses
            the optimum.
          </p>
        </div>
      </div>
    </>
  );
}
