import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { usePlayback } from "../../hooks/usePlayback.js";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import GraphLesson from "../../features/graphs/GraphLesson.jsx";
import KnapsackLesson from "../../features/knapsack/KnapsackLesson.jsx";
import TicTacToeLesson from "../../features/minimax/TicTacToeLesson.jsx";
import ChessLesson from "../../features/minimax/ChessLesson.jsx";
vi.mock("next/link", () => ({
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const wrap = (children) => render(<StudioProvider>{children}</StudioProvider>);
describe("playback lifecycle", () => {
  it("steps, rewinds, completes, and cancels timers on replacement and unmount", () => {
    vi.useFakeTimers();
    const first = { events: Array(8).fill({}) },
      second = { events: Array(3).fill({}) };
    const { result, rerender, unmount } = renderHook(
      ({ run }) => usePlayback(run),
      { initialProps: { run: first } },
    );
    act(() => result.current.step());
    expect(result.current.index).toBe(1);
    act(() => result.current.back());
    expect(result.current.index).toBe(0);
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(450));
    expect(result.current.index).toBe(1);
    rerender({ run: second });
    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.finish());
    expect(result.current.index).toBe(2);
    act(() => result.current.restart());
    act(() => result.current.toggle());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
describe("interactive lessons", () => {
  it("shows a weighted grid route and resets execution after an edit", () => {
    const { container } = wrap(<GraphLesson algorithm="astar" />);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.getByText("Route found")).toBeTruthy();
    expect(
      container.querySelectorAll(".path-cell.on-path").length,
    ).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", { name: "Row 1, column 1: cost 1" }),
    );
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Row 1, column 1: wall" }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Grid preset"), {
      target: { value: "blocked" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.getByText("No route")).toBeTruthy();
  });
  it("recomputes the flight budget and allows editing a fare without losing focus", () => {
    const { container } = wrap(<GraphLesson algorithm="flights" />);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(container.querySelector(".run-stats").textContent).toContain("500");
    fireEvent.change(screen.getByLabelText("Maximum stops"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(container.querySelector(".run-stats").textContent).toContain("300");
    const fare = screen.getAllByRole("spinbutton")[0];
    fare.focus();
    fireEvent.change(fare, { target: { value: "" } });
    fireEvent.change(fare, { target: { value: "125" } });
    expect(document.activeElement).toBe(fare);
    expect(fare.value).toBe("125");
    expect(screen.getByText("Ready")).toBeTruthy();
  });
  it("recovers the optimal knapsack and restarts when capacity changes", () => {
    const { container } = wrap(<KnapsackLesson tab="lab" />);
    fireEvent.change(screen.getByLabelText(/Bag capacity/), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(container.querySelector(".total-value").textContent).toContain(
      "$11",
    );
    expect(container.querySelectorAll(".inventory-row.packed").length).toBe(2);
    fireEvent.change(screen.getByLabelText(/Bag capacity/), {
      target: { value: "1" },
    });
    expect(container.querySelector(".total-value").textContent).toContain("—");
  });
  it.each(["ttt", "chess", "knapsack"])(
    "renders and completes the %s pseudocode trace",
    (kind) => {
      const Component = {
        ttt: TicTacToeLesson,
        chess: ChessLesson,
        knapsack: KnapsackLesson,
      }[kind];
      const { container } = wrap(<Component tab="code" />);
      expect(container.querySelector('[aria-current="step"]')).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Finish" }));
      expect(screen.getByText("Complete")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /Back/ }));
      expect(screen.queryByText("Complete")).toBeNull();
    },
  );
});
