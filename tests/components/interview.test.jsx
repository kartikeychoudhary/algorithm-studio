import { afterEach, it, expect } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import InterviewLesson from "../../features/interview/InterviewLesson.jsx";
import { StudioProvider } from "../../components/layout/StudioProvider.jsx";
import { interviewLessons } from "../../lib/data/interview-lessons.js";
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
  fireEvent.change(screen.getByLabelText("Input values"), {
    target: { value: "-5, -2, -1" },
  });
  fireEvent.change(screen.getByLabelText("Window size"), {
    target: { value: "9" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply & restart" }));
  expect(screen.getByRole("alert").textContent).toContain("between 1");
  expect(screen.getByText("Complete", { exact: true })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Window size"), {
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
it("loads a cyclic course preset and displays the reason there is no complete ordering", () => {
  mount("topo");
  fireEvent.change(screen.getByLabelText("Example preset"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(screen.getByRole("status").textContent).toContain("directed cycle");
});
