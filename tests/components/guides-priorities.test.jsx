import { beforeEach, afterEach, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  within,
  act,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import StudyGuides from "../../features/guides/StudyGuides.jsx";
import StudyJourney from "../../features/guides/StudyJourney.jsx";
import LessonProgress from "../../components/learning/LessonProgress.jsx";
import SystemsLesson from "../../features/systems/SystemsLesson.jsx";
import IncidentLesson from "../../features/practice/IncidentLesson.jsx";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import { studyGoals, goalIds } from "../../lib/data/study-goals.js";
import { priorityLessons } from "../../lib/data/priority-lessons.js";
import { incidentLessons } from "../../lib/data/incidents.js";
import { runSystems } from "../../lib/simulations/index.js";
import SimulationCanvas from "../../features/systems/SimulationCanvas.jsx";
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
});
afterEach(cleanup);
it("choosing data structures shows only its ordered table and persists checked progress separately from confidence", () => {
  const view = render(<StudyGuides />);
  fireEvent.click(
    screen.getByRole("button", { name: /Learn data structures/ }),
  );
  expect(
    screen.getByRole("link", { name: /Start this guide/ }).getAttribute("href"),
  ).toBe("/lessons/complexity");
  expect(screen.getAllByRole("checkbox")).toHaveLength(13);
  expect(screen.queryByRole("link", { name: /Spring/ })).toBeNull();
  fireEvent.click(screen.getByLabelText("Complete Big O & growth"));
  expect(
    screen
      .getByRole("link", { name: /Continue learning/ })
      .getAttribute("href"),
  ).toBe("/lessons/hashing");
  expect(location.search).toBe("?goal=structures");
  view.unmount();
  render(<StudyGuides />);
  expect(screen.getByLabelText("Complete Big O & growth").checked).toBe(true);
  fireEvent.change(screen.getByLabelText("Guide lesson filter"), {
    target: { value: "completed" },
  });
  expect(screen.getAllByRole("checkbox")).toHaveLength(1);
});
it("lesson completion syncs across consumers, survives confidence review and guides next navigation", () => {
  localStorage.setItem("algorithm-studio-goal-v1", "structures");
  const view = render(
    <>
      <LessonProgress id="complexity" />
      <StudyJourney id="complexity" />
    </>,
  );
  view.container.addEventListener("click", (e) => {
    if (e.target.closest("a")) e.preventDefault();
  });
  fireEvent.change(screen.getByLabelText("Lesson confidence"), {
    target: { value: "learned" },
  });
  expect(screen.getByLabelText("Lesson completed").checked).toBe(false);
  fireEvent.click(
    screen.getByRole("link", { name: "Mark complete & continue →" }),
  );
  expect(screen.getByLabelText("Lesson completed").checked).toBe(true);
  fireEvent.change(screen.getByLabelText("Lesson confidence"), {
    target: { value: "review" },
  });
  expect(screen.getByLabelText("Lesson completed").checked).toBe(true);
  expect(
    screen
      .getByRole("link", { name: "Mark complete & continue →" })
      .getAttribute("href"),
  ).toBe("/lessons/hashing");
});
it("fully completed paths expose a completion state and reopening one lesson resumes there", () => {
  localStorage.setItem("algorithm-studio-goal-v1", "structures");
  localStorage.setItem(
    "algorithm-studio-progress-v1",
    JSON.stringify(
      Object.fromEntries(
        goalIds(studyGoals.structures).map((id) => [id, { completed: true }]),
      ),
    ),
  );
  render(<StudyGuides />);
  expect(screen.getByRole("status").textContent).toContain("Guide complete");
  fireEvent.click(
    screen.getByLabelText("Complete Fenwick tree · mutable range sums"),
  );
  expect(
    screen
      .getByRole("link", { name: /Continue learning/ })
      .getAttribute("href"),
  ).toBe("/lessons/adv-fenwick");
});
it("switching goals changes the checklist without losing shared completion", () => {
  render(<StudyGuides />);
  fireEvent.click(
    screen.getByRole("button", { name: /Learn data structures/ }),
  );
  fireEvent.click(screen.getByLabelText("Complete Big O & growth"));
  fireEvent.click(screen.getByRole("button", { name: "Change learning goal" }));
  fireEvent.click(
    screen.getByRole("button", { name: /Prepare for coding interviews/ }),
  );
  expect(screen.getAllByRole("checkbox")).toHaveLength(49);
  expect(screen.getByLabelText("Complete Big O & growth").checked).toBe(true);
  expect(location.search).toBe("?goal=dsa");
});
it("invalid goal links and corrupt storage recover to goal selection", () => {
  history.replaceState(null, "", "/?goal=missing");
  localStorage.setItem("algorithm-studio-goal-v1", "missing");
  localStorage.setItem("algorithm-studio-progress-v1", "bad json");
  render(<StudyGuides />);
  expect(screen.getByRole("status").textContent).toContain("Select a goal");
});
it.each(Object.keys(priorityLessons))(
  "%s supports valid alternate input, finish and highlighted code",
  (id) => {
    render(
      <StudioProvider>
        <SystemsLesson id={id} tab="code" />
      </StudioProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: priorityLessons[id].alternative.label,
        exact: true,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Finish", exact: true }),
    );
    expect(screen.getByText("Inspect the final computed result")).toBeTruthy();
  },
);
it.each(Object.keys(incidentLessons))(
  "%s provides feedback and an inspectable recovery trace",
  (id) => {
    const l = incidentLessons[id];
    render(<IncidentLesson id={id} />);
    expect(
      screen.getByRole("button", { name: "Run recovery scenario" }).disabled,
    ).toBe(true);
    const wrong = l.choices.find(([c]) => c !== l.correct);
    fireEvent.click(screen.getByLabelText(wrong[1]));
    fireEvent.click(
      screen.getByRole("button", { name: "Run recovery scenario" }),
    );
    expect(
      screen.getByText("This does not fully resolve the incident."),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByLabelText(l.choices.find(([c]) => c === l.correct)[1]),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Run recovery scenario" }),
    );
    expect(screen.getByText("This addresses the modeled cause.")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Finish", exact: true }),
    );
    expect(
      JSON.parse(localStorage.getItem("algorithm-studio-progress-v1"))[id]
        .challengePassed,
    ).toBe(true);
  },
);
it("parallel span waterfall hydrates without mismatches", async () => {
  const r = runSystems("obs-traces", priorityLessons["obs-traces"].input),
    element = <SimulationCanvas event={r.events.at(-1)} />,
    container = document.createElement("div");
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
