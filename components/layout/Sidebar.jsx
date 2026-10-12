"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { lessons } from "../../lib/data/lessons.js";
import {
  navigationSections,
  groupKey,
  lessonAncestors,
} from "../../lib/data/navigation.js";

const expandedKey = "algorithm-studio-navigation-expanded";
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
  const [expanded, setExpanded] = useState(() => lessonAncestors(lessonId));
  const [navigationReady, setNavigationReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);
  const browseTop = useRef(0);
  const restored = useRef(false);
  const term = query.trim().toLowerCase();
  const sections = navigationSections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group, index) => ({
          ...group,
          index,
          ids: group.ids.filter((id) =>
            (names[id] || lessons[id].label)
              .concat(
                " ",
                group.title,
                " ",
                section.title,
                " ",
                lessons[id].problem?.name || "",
              )
              .toLowerCase()
              .includes(term),
          ),
        }))
        .filter((group) => group.ids.length),
    }))
    .filter((section) => section.groups.length);
  useLayoutEffect(() => {
    let saved = [];
    try {
      const value = JSON.parse(sessionStorage.getItem(expandedKey));
      if (Array.isArray(value))
        saved = value.filter((key) => typeof key === "string");
    } catch {}
    const next = [...new Set([...saved, ...lessonAncestors(lessonId)])];
    setExpanded(next);
    setNavigationReady(true);
    try {
      sessionStorage.setItem(expandedKey, JSON.stringify(next));
    } catch {}
  }, [lessonId]);
  function toggleGroup(key) {
    setExpanded((previous) => {
      const next = previous.includes(key)
        ? previous.filter((k) => k !== key)
        : [...previous, key];
      try {
        sessionStorage.setItem(expandedKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }
  const isOpen = (key) => !!term || expanded.includes(key);

  useLayoutEffect(() => {
    if (!navigationReady) return;
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
  }, [term, mobileOpen, navigationReady]);

  function rememberScroll(event) {
    if (term || !navigationReady) return;
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
          aria-label="Learning library"
          ref={navRef}
          onScroll={rememberScroll}
        >
          {sections.map((section) => (
            <section className="library-section" key={section.id}>
              <button
                className="library-section-toggle"
                aria-expanded={isOpen(section.id)}
                aria-controls={"nav-" + section.id}
                onClick={() => toggleGroup(section.id)}
              >
                <span>{section.title}</span>
                <span className="nav-chevron" aria-hidden="true">
                  {isOpen(section.id) ? "⌄" : "›"}
                </span>
              </button>
              <div id={"nav-" + section.id} hidden={!isOpen(section.id)}>
                {section.groups.map((group) => {
                  const key = groupKey(section, group),
                    open = isOpen(key),
                    contentId = "nav-" + section.id + "-" + group.index;
                  return (
                    <section
                      className="library-group"
                      key={key}
                      aria-label={group.title}
                    >
                      <h2>
                        <button
                          className="library-group-toggle"
                          aria-expanded={open}
                          aria-controls={contentId}
                          onClick={() => toggleGroup(key)}
                        >
                          <CategoryIcon
                            index={group.index % iconPaths.length}
                          />
                          <span>{group.title}</span>
                          <span className="nav-chevron" aria-hidden="true">
                            {open ? "⌄" : "›"}
                          </span>
                        </button>
                      </h2>
                      <div
                        className="library-links"
                        id={contentId}
                        hidden={!open}
                      >
                        {group.ids.map((id) => (
                          <Link
                            key={id}
                            href={"/lessons/" + id}
                            scroll={false}
                            aria-current={id === lessonId ? "page" : undefined}
                            className={
                              "library-link " +
                              (id === lessonId ? "is-current" : "")
                            }
                            onClick={() => setMobileOpen(false)}
                          >
                            <span
                              className="lesson-indicator"
                              aria-hidden="true"
                            />
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
                  );
                })}
              </div>
            </section>
          ))}
          {!sections.length && (
            <div className="library-empty" role="status">
              <strong>No lessons found</strong>
              <p>Try a topic like graphs, SOLID, or Strategy.</p>
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
