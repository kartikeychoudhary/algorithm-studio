import { afterEach, it, expect } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import CaseStudyLesson, {
  capacityEstimate,
} from "../../features/design/CaseStudyLesson.jsx";
import ConceptLesson from "../../features/concepts/ConceptLesson.jsx";
import PracticeLinks from "../../components/learning/PracticeLinks.jsx";
import Sidebar from "../../components/layout/Sidebar.jsx";
import { systemsConcepts } from "../../lib/data/systems-concepts.js";
import { caseStudies } from "../../lib/data/case-studies.js";
afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
it("hydrates server-rendered case diagrams without recovering the tree", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  host.innerHTML = renderToString(<CaseStudyLesson id="shortener" tab="lab" />);
  const errors = [];
  let root;
  await act(async () => {
    root = hydrateRoot(host, <CaseStudyLesson id="shortener" tab="lab" />, {
      onRecoverableError: (error) => errors.push(error.message),
    });
  });
  expect(errors).toEqual([]);
  await act(async () => root.unmount());
  host.remove();
});
it.each(Object.keys(systemsConcepts))(
  "%s has a diagram, code, and finish/rewind",
  (id) => {
    const { container } = render(<ConceptLesson id={id} tab="lab" />);
    expect(screen.getByRole("img")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(container.querySelector('[aria-current="step"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
  },
);
it.each(Object.keys(caseStudies))(
  "%s scenario selection restarts playback and exposes requirements",
  (id) => {
    const { container } = render(<CaseStudyLesson id={id} tab="lab" />);
    expect(
      screen.getByRole("heading", { name: "Clarify the requirements" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    fireEvent.change(screen.getByLabelText("Case study scenario"), {
      target: { value: "1" },
    });
    expect(screen.getByRole("button", { name: /Back/ }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(container.querySelector(".scenario-state").textContent).toContain(
      id === "checkout" ? "one order only" : "redirect ready",
    );
  },
);
it("workload changes recalculate database pressure and keep units explicit", () => {
  expect(capacityEstimate(8.64, 5, 90).storageReads).toBeCloseTo(50);
  render(<CaseStudyLesson id="shortener" tab="lab" />);
  const old = screen.getByText(/Estimated DB reads/).textContent;
  fireEvent.change(screen.getByLabelText("Cache hit rate"), {
    target: { value: "0" },
  });
  expect(screen.getByText(/Estimated DB reads/).textContent).not.toBe(old);
});
it("practice links explain the scope of coding drills", () => {
  render(<PracticeLinks id="shortener" lesson={caseStudies.shortener} />);
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(
    screen
      .getByRole("link", { name: /Encode and Decode TinyURL/ })
      .getAttribute("href"),
  ).toContain("encode-and-decode-tinyurl");
});
it("focused libraries restore separate scroll positions and searching crosses libraries", () => {
  render(<Sidebar lessonId="coins" />);
  const nav = screen.getByRole("navigation", { name: "Learning library" });
  nav.scrollTop = 321;
  fireEvent.scroll(nav);
  fireEvent.click(screen.getByRole("button", { name: "Case Studies" }));
  expect(nav.scrollTop).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Read-heavy systems" }));
  expect(screen.getByRole("link", { name: "URL shortener" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Algorithms" }));
  expect(nav.scrollTop).toBe(321);
  fireEvent.change(screen.getByLabelText("Find a lesson"), {
    target: { value: "payment" },
  });
  expect(
    screen.getByRole("link", { name: "Order & payment system" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear lesson search" }));
  expect(nav.scrollTop).toBe(321);
});
