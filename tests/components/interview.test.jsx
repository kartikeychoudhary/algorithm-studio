import { afterEach, it, expect } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import InterviewLesson from "../../features/interview/InterviewLesson.jsx";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import { interviewLessons } from "../../lib/data/interview-lessons.js";
import Sidebar from "../../components/layout/Sidebar.jsx";
import { lessons } from "../../lib/data/lessons.js";
afterEach(cleanup);
const mount = (id) =>
  render(
    <StudioProvider>
      <InterviewLesson id={id} />
    </StudioProvider>,
  );
it.each(Object.keys(interviewLessons))(
  "%s renders a visual trace and supports finish / rewind",
  (id) => {
    const { container } = mount(id);
    expect(container.querySelector("svg,.array-visual")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.getByText("Complete", { exact: true })).toBeTruthy();
    expect(container.querySelector('[aria-current="step"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.queryByText("Complete", { exact: true })).toBeNull();
  },
);
it("keeps the current run on invalid input, then applies edits and restarts", () => {
  const { container } = mount("window");
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  fireEvent.change(screen.getByLabelText("nums"), {
    target: { value: "-5, -2, -1" },
  });
  fireEvent.change(screen.getByLabelText("k"), {
    target: { value: "9" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
  expect(screen.getByRole("alert").textContent).toContain("between 1");
  expect(screen.getByText("Complete", { exact: true })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("k"), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("Complete", { exact: true })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(container.querySelector(".event-explanation").textContent).toContain(
    "sum -3",
  );
});

it("sorting keeps small bars visible, rejects out-of-range input, and finishes in height order", () => {
  const { container } = mount("merge");
  fireEvent.change(screen.getByLabelText("nums"), {
    target: { value: "[100,0,1]" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
  const heights = () =>
    Array.from(container.querySelectorAll(".sort-bar"), (bar) =>
      parseFloat(bar.style.height),
    );
  expect(heights()[0]).toBeGreaterThan(heights()[2]);
  expect(Math.min(...heights())).toBeGreaterThanOrEqual(24);
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(heights()).toEqual([...heights()].sort((a, b) => a - b));
  expect(container.querySelector(".judge-output code").textContent).toBe(
    "[0,1,100]",
  );
  fireEvent.change(screen.getByLabelText("nums"), {
    target: { value: "[-1,100]" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
  expect(screen.getByRole("alert").textContent).toContain("0 and 100");
  expect(container.querySelector(".judge-output code").textContent).toBe(
    "[0,1,100]",
  );
});

it("tree editor preserves null children and supports an empty-list preset", () => {
  const { container } = mount("tree");
  expect(screen.getByLabelText("root").value).toBe("[1,null,2,3]");
  expect(container.querySelectorAll(".structure-view circle").length).toBe(3);
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(container.querySelector(".judge-output code").textContent).toBe(
    "[1,3,2]",
  );
  fireEvent.change(screen.getByLabelText("Example preset"), {
    target: { value: "1" },
  });
  expect(screen.getByLabelText("root").value).toBe("[]");
  expect(screen.getByText("The tree is empty.")).toBeTruthy();
});

it("every lesson exists in the searchable library without category numbering", () => {
  const { container } = render(<Sidebar lessonId="merge" />);
  const nav = screen.getByRole("navigation", { name: "Learning library" });
  for (const id of Object.keys(lessons))
    expect(nav.querySelector(`a[href="/lessons/${id}"]`)).toBeTruthy();
  expect(nav.querySelector("details,.module-index,.count")).toBeNull();
  expect(
    container.querySelector('[aria-current="page"]').textContent,
  ).toContain("Merge sort");
});
it("loads a cyclic course preset and displays the reason there is no complete ordering", () => {
  mount("topo");
  fireEvent.change(screen.getByLabelText("Example preset"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(screen.getByRole("status").textContent).toContain("directed cycle");
});
