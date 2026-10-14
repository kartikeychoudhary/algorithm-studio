import { afterEach, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import LlmLesson from "../../features/llm/LlmLesson.jsx";
import { llmLessons } from "../../lib/data/llm-lessons.js";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("dot-product animation reaches the full sum and releases its timer", () => {
  vi.useFakeTimers();
  const view = render(<LlmLesson id="llm-attention" tab="lab" />);
  fireEvent.click(
    screen.getByRole("button", { name: "Animate multiplication" }),
  );
  for (let i = 0; i < 7; i++) act(() => vi.advanceTimersByTime(450));
  expect(screen.getByRole("status").textContent).toContain("8 / 8");
  expect(
    screen.getByRole("button", { name: "Reset multiplication" }),
  ).toBeTruthy();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("EOS selection stops generation without appending visible EOS text to the prefix", () => {
  const { container } = render(<LlmLesson id="llm-sampling" tab="lab" />);
  fireEvent.change(screen.getByLabelText("Input prefix"), {
    target: { value: "." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run prefix" }));
  fireEvent.click(screen.getByLabelText("Greedy decoding"));
  fireEvent.click(
    screen.getByRole("button", { name: "Append token & repeat" }),
  );
  expect(
    screen.getByRole("button", { name: "Append token & repeat" }).disabled,
  ).toBe(true);
  expect(container.querySelector(".llm-context small").textContent).toContain(
    "End of sequence",
  );
});
it.each(Object.keys(llmLessons))(
  "%s renders its interactive content and model disclosure",
  (id) => {
    render(<LlmLesson id={id} tab="lab" />);
    expect(screen.getByText(/36 tokens/)).toBeTruthy();
    expect(
      screen.getByText("Model card, training corpus & limitations"),
    ).toBeTruthy();
  },
);
it("prediction finishes, keeps decoding controls visible when changed, appends and restarts", () => {
  const { container } = render(<LlmLesson id="llm-prediction" tab="lab" />);
  fireEvent.click(screen.getByRole("button", { name: "Finish", exact: true }));
  fireEvent.change(screen.getByLabelText("Temperature"), {
    target: { value: "0.5" },
  });
  expect(screen.getByLabelText("Temperature")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Append token & repeat" }),
  );
  expect(container.querySelector(".llm-context").textContent).toContain(
    "6 / 16",
  );
  expect(screen.getByRole("status").textContent).toContain("Tokenize");
  expect(screen.getByRole("button", { name: "← Back" }).disabled).toBe(true);
});
it("input validation prevents an empty or oversized context and discloses unknown tokens", () => {
  render(<LlmLesson id="llm-tokens" tab="lab" />);
  const input = screen.getByLabelText("Input prefix");
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Run prefix" }));
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.change(input, { target: { value: "the ".repeat(17) } });
  fireEvent.click(screen.getByRole("button", { name: "Run prefix" }));
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.change(input, { target: { value: "mystery cats" } });
  fireEvent.click(screen.getByRole("button", { name: "Run prefix" }));
  expect(screen.getByText(/Unknown words mapped/)).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
it("attention cell selection exposes a masked future score", () => {
  render(<LlmLesson id="llm-attention" tab="lab" />);
  fireEvent.click(
    screen.getByRole("button", { name: "Query 0, key 1: masked" }),
  );
  expect(screen.getByText(/masked to −∞/)).toBeTruthy();
});
it("training updates actual loss and resetting restores it", () => {
  render(<LlmLesson id="llm-training" tab="lab" />);
  const before = screen.getByRole("status").textContent;
  fireEvent.click(screen.getByRole("button", { name: "Train one step" }));
  expect(screen.getByRole("status").textContent).not.toBe(before);
  fireEvent.click(screen.getByRole("button", { name: "Reset weights" }));
  expect(screen.getByRole("status").textContent).toBe(before);
});
it("LLM attention hydrates without replacing the server tree", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  host.innerHTML = renderToString(<LlmLesson id="llm-attention" tab="lab" />);
  const errors = [];
  let root;
  await act(async () => {
    root = hydrateRoot(host, <LlmLesson id="llm-attention" tab="lab" />, {
      onRecoverableError: (e) => errors.push(e.message),
    });
  });
  expect(errors).toEqual([]);
  await act(async () => root.unmount());
  host.remove();
});
