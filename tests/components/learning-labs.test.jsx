import { afterEach, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import LabLesson from "../../features/interview/LabLesson.jsx";
import { labLessons } from "../../lib/data/lab-lessons.js";
import SpringLesson from "../../features/spring/SpringLesson.jsx";
import { springLessons } from "../../lib/data/spring-lessons.js";
import {
  ConcurrencyLab,
  MemoryLab,
} from "../../features/concepts/FoundationLesson.jsx";
import FailureLab from "../../components/learning/FailureLab.jsx";
import {
  CompareLab,
  DebugLab,
  Roadmap,
} from "../../features/practice/PracticeLesson.jsx";
import LessonProgress from "../../components/learning/LessonProgress.jsx";
import InterviewLesson from "../../features/interview/InterviewLesson.jsx";
import { encodeTrace } from "../../lib/learning/sharing.js";
afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});
it.each(Object.keys(labLessons))(
  "%s executes, rewinds and rejects malformed edits",
  (id) => {
    const { container } = render(
      <StudioProvider>
        <LabLesson id={id} tab="lab" />
      </StudioProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Finish", exact: true }),
    );
    expect(container.querySelector(".judge-output").textContent).not.toContain(
      "not yet",
    );
    expect(screen.getByRole("button", { name: /Back/ }).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    fireEvent.change(screen.getByLabelText("Algorithm input JSON"), {
      target: { value: "not json" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
    expect(screen.getByRole("alert")).toBeTruthy();
  },
);
it.each(Object.keys(springLessons))(
  "%s has a playable sequence and explicit boundaries",
  (id) => {
    render(<SpringLesson id={id} tab="lab" />);
    expect(screen.getByRole("img", { name: /sequence diagram/ })).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Finish", exact: true }),
    );
    expect(
      screen.getByRole("button", { name: "Step →", exact: true }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole("heading", { name: "Important boundaries" }),
    ).toBeTruthy();
  },
);
it("annotation search changes both explanatory content and diagram", () => {
  render(<SpringLesson id="spring-annotations" tab="lab" />);
  fireEvent.change(screen.getByLabelText("Search annotations"), {
    target: { value: "Transactional" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^@Transactional/ }));
  expect(
    screen.getByRole("img", { name: "@Transactional sequence diagram" }),
  ).toBeTruthy();
  expect(screen.getByText(/self-invocation bypasses advice/)).toBeTruthy();
});
it("prediction mode gates playback until the learner selects the correct next event", () => {
  render(<SpringLesson id="spring-request" tab="lab" />);
  fireEvent.click(screen.getByLabelText("Predict before revealing"));
  expect(
    screen.getByRole("button", { name: "Step →", exact: true }).disabled,
  ).toBe(true);
  fireEvent.click(
    screen.getByLabelText(
      "Configured servlet filters run; DelegatingFilterProxy enters Spring Security.",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));
  fireEvent.click(screen.getByRole("button", { name: "Reveal next step →" }));
  expect(screen.getAllByRole("status")[0].textContent).toContain("STEP 2");
});
it("thread controls exhibit lost update and lock protection", () => {
  render(<ConcurrencyLab />);
  for (const w of ["A", "B", "A", "B"])
    fireEvent.click(screen.getByRole("button", { name: `Step worker ${w}` }));
  expect(screen.getByText("B writes 1")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Protect read + write with one lock"));
  for (const w of ["A", "B", "A", "B", "B"])
    fireEvent.click(screen.getByRole("button", { name: `Step worker ${w}` }));
  expect(screen.getByText("B writes 2")).toBeTruthy();
});
it("failure controls change the computed queue and reset it", () => {
  const { container } = render(<FailureLab />);
  fireEvent.click(screen.getByLabelText("Pause workers"));
  fireEvent.click(screen.getByRole("button", { name: "Advance 1 second" }));
  expect(container.querySelector(".system-pipeline").textContent).toContain(
    "100 events",
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset simulation" }));
  expect(container.querySelector(".system-pipeline").textContent).toContain(
    "0 events",
  );
});
it("comparison completes both algorithms with the same answer", () => {
  render(<CompareLab />);
  fireEvent.click(screen.getByRole("button", { name: "Finish comparison" }));
  expect(screen.getAllByText("Result: 31")).toHaveLength(2);
});
it("debugging a loop boundary changes failing tests into passing tests", () => {
  render(<DebugLab />);
  fireEvent.click(screen.getByRole("button", { name: "Run boundary tests" }));
  expect(screen.getByRole("status").textContent).toMatch(/fails/);
  fireEvent.change(screen.getByLabelText("Binary search loop condition"), {
    target: { value: "inclusive" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Run boundary tests" }));
  expect(screen.getByRole("status").textContent).toMatch(
    /All boundary tests pass/,
  );
});
it("memory lab collects only unreachable objects and orders microtasks before timers", () => {
  render(<MemoryLab />);
  fireEvent.click(screen.getByRole("button", { name: "Allocate object" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Drop a root reference" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Collect unreachable objects" }),
  );
  expect(screen.queryByText(/Object #1/)).toBeNull();
  expect(screen.getByText(/Object #2/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Event loop" }));
  for (let i = 0; i < 3; i++)
    fireEvent.click(
      screen.getByRole("button", { name: "Next event-loop phase" }),
    );
  expect(screen.getByText("Output: main, sync, promise, timer")).toBeTruthy();
});
it("bookmarks and weak-topic confidence persist into the roadmap", () => {
  const view = render(<LessonProgress id="trie" />);
  fireEvent.click(screen.getByRole("button", { name: "☆ Bookmark" }));
  fireEvent.change(screen.getByLabelText("Lesson confidence"), {
    target: { value: "review" },
  });
  view.unmount();
  render(<Roadmap />);
  fireEvent.click(screen.getByRole("button", { name: "Review weak topics" }));
  expect(screen.getByRole("link", { name: /Trie/ })).toBeTruthy();
});
it("shared custom inputs and execution steps restore after mount", async () => {
  history.replaceState(
    {},
    "",
    "/lessons/lowerbound?trace=" +
      encodeURIComponent(
        encodeTrace("lowerbound", { nums: [2, 4, 8], target: 4 }, 2),
      ),
  );
  render(
    <StudioProvider>
      <LabLesson id="lowerbound" tab="lab" />
    </StudioProvider>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Algorithm input JSON").value).toContain(
      "[2,4,8]",
    ),
  );
  expect(screen.getByRole("button", { name: /Back/ }).disabled).toBe(false);
});
it("legacy interview traces restore validated inputs and reject broken share payloads", async () => {
  history.replaceState(
    {},
    "",
    "/lessons/binary?trace=" +
      encodeURIComponent(
        encodeTrace("binary", { values: [2, 4, 8], parameter: 8 }, 2),
      ),
  );
  const view = render(
    <StudioProvider>
      <InterviewLesson id="binary" />
    </StudioProvider>,
  );
  await waitFor(() =>
    expect(screen.getByLabelText("nums").value).toBe("[2,4,8]"),
  );
  view.unmount();
  history.replaceState({}, "", "/lessons/binary?trace=invalid");
  render(
    <StudioProvider>
      <InterviewLesson id="binary" />
    </StudioProvider>,
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "could not be loaded",
  );
});
