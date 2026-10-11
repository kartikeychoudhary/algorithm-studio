"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { lessons } from "../../lib/data/lessons.js";
import { navigationGroups } from "../../lib/data/navigation.js";

const scrollKey = "algorithm-studio-navigation-scroll";
const names = {
  ttt: "Tic-tac-toe",
  chess: "Chess",
  knapsack: "0/1 Knapsack",
  bfs: "Breadth-first search",
  dfs: "Depth-first search",
  astar: "A* search",
  stack: "Monotonic stack",
  heap: "Kth largest · Min-heap",
  tree: "Inorder traversal",
  hashing: "Two Sum · Hash map",
  subsets: "Subsets",
  linked: "Reverse linked list",
};
const iconPaths = [
  "M12 3v5M5 16v-4h14v4M5 20v-4M19 20v-4M12 8v4",
  "M5 8h14l1 12H4L5 8ZM9 8V5a3 3 0 0 1 6 0v3",
  "m5 5 14 3-7 11L5 5Zm0 0 7 14M19 8 5 5",
  "M4 6h16M4 12h11M4 18h6m8-3 3 3-3 3",
  "M5 20V12M12 20V7M19 20V3",
  "m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4",
  "M12 3v6M5 20v-7h14v7M12 9v4M2 20h6M16 20h6",
  "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 3h6m-3-3v6",
];
function CategoryIcon({ index }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={iconPaths[index]} />
    </svg>
  );
}

export default function Sidebar({ lessonId }) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const browseTop = useRef(0);
  const restored = useRef(false);
  const term = query.trim().toLowerCase();
  const groups = navigationGroups
    .map((group, index) => ({
      ...group,
      index,
      ids: group.ids.filter((id) =>
        `${names[id] || lessons[id].label} ${group.title} ${lessons[id].problem?.name || ""}`
          .toLowerCase()
          .includes(term),
      ),
    }))
    .filter((group) => group.ids.length);

  useLayoutEffect(() => {
    if (!restored.current) {
      try {
        browseTop.current = Math.max(
          0,
          Number(sessionStorage.getItem(scrollKey)) || 0,
        );
      } catch {}
      restored.current = true;
    }
    navRef.current.scrollTop = term ? 0 : browseTop.current;
  }, [term, mobileOpen]);

  function rememberScroll(event) {
    if (term) return;
    browseTop.current = event.currentTarget.scrollTop;
    try {
      sessionStorage.setItem(scrollKey, String(browseTop.current));
    } catch {}
  }

  return (
    <aside
      className={`sidebar studio-sidebar ${mobileOpen ? "navigation-open" : ""}`}
      aria-label="Lesson library"
    >
      <div className="library-header">
        <Link
          className="brand"
          href="/"
          scroll={false}
          aria-label="Algorithm Studio home"
        >
          <span className="brand-mark">
            a<span>.</span>
          </span>
          <span>
            algorithm<span className="brand-studio">STUDIO</span>
          </span>
        </Link>
        <button
          className="library-toggle"
          aria-expanded={mobileOpen}
          aria-controls="lesson-library"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? "Close" : "Lessons"}
          <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
        </button>
      </div>
      <div className="library-body" id="lesson-library">
        <div className="library-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            aria-label="Find a lesson"
            placeholder="Find a lesson…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setQuery("");
            }}
          />
          {query && (
            <button
              aria-label="Clear lesson search"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </div>
        <div className="library-caption">
          THE PLAYGROUND<span aria-hidden="true">✦</span>
        </div>
        <nav
          className="library-nav"
          aria-label="Algorithm lessons"
          ref={navRef}
          onScroll={rememberScroll}
        >
          {groups.map((group) => (
            <section
              className="library-group"
              key={group.title}
              aria-label={group.title}
            >
              <h2>
                <CategoryIcon index={group.index} />
                {group.title}
              </h2>
              <div className="library-links">
                {group.ids.map((id) => (
                  <Link
                    key={id}
                    href={`/lessons/${id}`}
                    scroll={false}
                    aria-current={id === lessonId ? "page" : undefined}
                    className={`library-link ${id === lessonId ? "is-current" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="lesson-indicator" aria-hidden="true" />
                    <span>{names[id] || lessons[id].label}</span>
                    {id === lessonId && (
                      <svg
                        className="lesson-arrow"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M4 10h11m-4-4 4 4-4 4" />
                      </svg>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {!groups.length && (
            <div className="library-empty" role="status">
              <strong>No lessons found</strong>
              <p>Try a topic like graphs, tree, or sorting.</p>
              <button onClick={() => setQuery("")}>Show all lessons</button>
            </div>
          )}
        </nav>
        <div className="library-footer">
          <span className="library-footer-icon" aria-hidden="true">
            ⌘
          </span>
          <div>
            Small steps. Clearer thinking.<span>Explore at your own pace.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
