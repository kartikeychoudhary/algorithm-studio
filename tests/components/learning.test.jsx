import { afterEach, it, expect } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ConceptLesson from "../../features/concepts/ConceptLesson.jsx";
import DesignLesson from "../../features/design/DesignLesson.jsx";
import { patternList } from "../../lib/data/design-patterns.js";
import { conceptLessons } from "../../lib/data/concepts.js";
afterEach(cleanup);
it("ACID walkthrough hides partial writes and recovers after a rollback", () => {
  const { container } = render(<ConceptLesson id="acid" tab="lab" />);
  fireEvent.change(screen.getByLabelText("Scenario"), {
    target: { value: "rollback" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Step →" }));
  fireEvent.click(screen.getByRole("button", { name: "Step →" }));
  expect(container.querySelector(".account-card strong").textContent).toBe(
    "70",
  );
  expect(container.querySelector(".reader-snapshot strong").textContent).toBe(
    "A: 100 · B: 50",
  );
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(container.querySelector(".account-card strong").textContent).toBe(
    "100",
  );
  fireEvent.change(screen.getByLabelText("Scenario"), {
    target: { value: "recovery" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(container.querySelector(".reader-snapshot strong").textContent).toBe(
    "A: 70 · B: 80",
  );
});
it("CAP controls demonstrate the consistency/availability tradeoff", () => {
  render(<ConceptLesson id="cap" tab="lab" />);
  fireEvent.click(screen.getByRole("button", { name: "Break network" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Write next version on A" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Read from B" }));
  expect(screen.getByText("Unavailable · retry")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Partition policy"), {
    target: { value: "ap" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Read from B" }));
  expect(screen.getByText("Version 1 · stale")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Heal network" }));
  fireEvent.click(screen.getByRole("button", { name: "Read from B" }));
  expect(screen.getByText("Version 2")).toBeTruthy();
});
it.each(patternList.map((p) => p.id))(
  "%s pattern advances its diagram with pseudocode and rewinds",
  (id) => {
    const { container } = render(<DesignLesson id={id} tab="lab" />);
    expect(screen.getByRole("img")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(
      container.querySelector('[aria-current="step"]').textContent,
    ).toContain(patternList.find((p) => p.id === id).steps.at(-1)[3]);
    const final = container.querySelector(".scenario-state").textContent;
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(container.querySelector(".scenario-state").textContent).not.toBe(
      final,
    );
  },
);
it.each(["solid", "oop", "clean"])(
  "%s exposes each principle as a distinct visual example",
  (id) => {
    const { container } = render(<ConceptLesson id={id} tab="lab" />);
    for (const facet of conceptLessons[id].facets) {
      fireEvent.click(screen.getByRole("tab", { name: facet.label }));
      expect(screen.getByText(facet.idea, { selector: "h2" })).toBeTruthy();
      expect(container.querySelector(".flow-diagram")).toBeTruthy();
    }
  },
);
it("growth slider updates exact operation counts", () => {
  render(<ConceptLesson id="complexity" tab="lab" />);
  fireEvent.change(screen.getByLabelText("Input size"), {
    target: { value: "4" },
  });
  expect(screen.getByText("Input size · n = 4")).toBeTruthy();
  expect(screen.getAllByText("16", { selector: "code" }).length).toBe(2);
});
