import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import SystemsLesson from "../../features/systems/SystemsLesson.jsx";
import SimulationCanvas from "../../features/systems/SimulationCanvas.jsx";
import { deepLessons } from "../../lib/data/deep-lessons.js";
import { runSystems } from "../../lib/simulations/index.js";
import { encodeTrace } from "../../lib/learning/sharing.js";
beforeEach(() => {
  history.replaceState(null, "", "/");
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const lesson = (id) => (
  <StudioProvider>
    <SystemsLesson id={id} tab="lab" />
  </StudioProvider>
);
it.each(Object.keys(deepLessons))(
  "%s renders and supports finish, back, contrast and reset",
  (id) => {
    const view = render(lesson(id));
    fireEvent.click(
      screen.getByRole("button", { name: "Finish", exact: true }),
    );
    expect(screen.getByText("Inspect the final computed result")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.queryByText("Inspect the final computed result")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: deepLessons[id].alternative.label,
        exact: true,
      }),
    );
    expect(
      view.container.querySelector(".systems-current").textContent,
    ).toContain("STEP 1 /");
    fireEvent.click(screen.getByRole("button", { name: "Reset example" }));
    expect(
      screen.getByLabelText(
        Object.keys(deepLessons[id].input)[0]
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()),
      ).value,
    ).toBe(
      Array.isArray(Object.values(deepLessons[id].input)[0])
        ? JSON.stringify(Object.values(deepLessons[id].input)[0])
        : String(Object.values(deepLessons[id].input)[0]),
    );
  },
);
it("invalid JSON and bounds keep the current experiment intact", () => {
  const view = render(lesson("db-bplus"));
  const before = view.container.querySelector(".systems-current").textContent;
  for (const value of ["[1,", "[-1,2]", "[]"]) {
    fireEvent.change(screen.getByLabelText("Values"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Apply experiment" }));
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(view.container.querySelector(".systems-current").textContent).toBe(
      before,
    );
  }
  fireEvent.change(screen.getByLabelText("Values"), {
    target: { value: "[1,2,3]" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply experiment" }));
  expect(screen.queryByRole("alert")).toBeNull();
});
it("shared settings restore both input and the selected execution step", () => {
  const input = { ...deepLessons["web-tcp"].input, drop: 0 };
  history.replaceState(
    null,
    "",
    "/?trace=" + encodeURIComponent(encodeTrace("web-tcp", input, 2)),
  );
  const view = render(lesson("web-tcp"));
  expect(screen.getByLabelText("Drop").value).toBe("0");
  expect(
    view.container.querySelector(".systems-current").textContent,
  ).toContain("STEP 3 /");
});
it("playback timer is released when leaving a systems lesson", () => {
  vi.useFakeTimers();
  const view = render(lesson("db-bplus"));
  fireEvent.click(screen.getByRole("button", { name: /Play/ }));
  act(() => vi.advanceTimersByTime(1000));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it.each([
  "db-bplus",
  "dist-ring",
  "llm-vectors",
  "llm-quantization",
  "os-context",
])("%s diagram hydrates without errors", async (id) => {
  const run = runSystems(id, deepLessons[id].input),
    element = <SimulationCanvas event={run.events.at(-1)} />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.append(container);
  const errors = [];
  let root;
  await act(async () => {
    root = hydrateRoot(container, element, {
      onRecoverableError: (e) => errors.push(e.message),
    });
  });
  expect(errors).toEqual([]);
  await act(async () => root.unmount());
  container.remove();
});
