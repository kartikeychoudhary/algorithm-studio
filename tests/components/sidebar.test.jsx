import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Sidebar from "../../components/layout/Sidebar.jsx";
import StudioShell from "../../components/layout/StudioShell.jsx";

const route = vi.hoisted(() => ({ pathname: "/lessons/coins" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
beforeEach(() => {
  sessionStorage.clear();
  route.pathname = "/lessons/coins";
});
afterEach(cleanup);

it("keeps the same navigation node and scroll position across lesson routes", () => {
  const { rerender } = render(
    <StudioShell>
      <main>Coin change lesson</main>
    </StudioShell>,
  );
  const nav = screen.getByRole("navigation", { name: "Algorithm lessons" });
  nav.scrollTop = 640;
  fireEvent.scroll(nav);
  route.pathname = "/lessons/subsets";
  rerender(
    <StudioShell>
      <main>Subsets lesson</main>
    </StudioShell>,
  );
  expect(screen.getByRole("navigation", { name: "Algorithm lessons" })).toBe(
    nav,
  );
  expect(nav.scrollTop).toBe(640);
  expect(
    screen.getByRole("link", { name: "Subsets" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen
      .getByRole("link", { name: "Coin change" })
      .hasAttribute("aria-current"),
  ).toBe(false);
});

it("restores browsing position after a remount and after clearing a search", () => {
  const first = render(<Sidebar lessonId="coins" />);
  let nav = screen.getByRole("navigation", { name: "Algorithm lessons" });
  nav.scrollTop = 520;
  fireEvent.scroll(nav);
  first.unmount();
  render(<Sidebar lessonId="subsets" />);
  nav = screen.getByRole("navigation", { name: "Algorithm lessons" });
  expect(nav.scrollTop).toBe(520);
  fireEvent.change(screen.getByRole("textbox", { name: "Find a lesson" }), {
    target: { value: "daily temperatures" },
  });
  expect(screen.getByRole("link", { name: "Monotonic stack" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Subsets" })).toBeNull();
  expect(nav.scrollTop).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Clear lesson search" }));
  expect(nav.scrollTop).toBe(520);
  expect(screen.getByRole("link", { name: "Subsets" })).toBeTruthy();
});

it("filters by category, recovers from no results, and toggles the mobile library", () => {
  render(<Sidebar lessonId="ttt" />);
  const input = screen.getByRole("textbox", { name: "Find a lesson" });
  fireEvent.change(input, { target: { value: "graphs" } });
  expect(screen.getAllByRole("link").length).toBe(7); // brand + six graph lessons
  fireEvent.change(input, { target: { value: "does not exist" } });
  expect(screen.getByRole("status").textContent).toContain("No lessons found");
  fireEvent.click(screen.getByRole("button", { name: "Show all lessons" }));
  expect(screen.getAllByRole("link").length).toBe(21);
  fireEvent.click(screen.getByRole("button", { name: "Lessons" }));
  expect(
    screen.getByRole("button", { name: "Close" }).getAttribute("aria-expanded"),
  ).toBe("true");
});
