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
const libraryKey = "algorithm-studio-library-focus";
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
const symbols = ["⌘", "◇", "▧", "◈"];
const subtitles = [
  "Solve & trace",
  "Build understanding",
  "Shape your code",
  "Connect the pieces",
];
export default function Sidebar({ lessonId }) {
  const ancestors = lessonAncestors(lessonId);
  const [library, setLibrary] = useState(ancestors[0] || "algorithms");
  const [expanded, setExpanded] = useState(ancestors);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null),
    lastLesson = useRef(lessonId),
    positions = useRef({});
  const term = query.trim().toLowerCase();
  const sections = navigationSections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group, index) => ({
          ...group,
          index,
          ids: group.ids.filter((id) =>
            `${names[id] || lessons[id].label} ${group.title} ${section.title} ${lessons[id].problem?.name || ""}`
              .toLowerCase()
              .includes(term),
          ),
        }))
        .filter((g) => g.ids.length),
    }))
    .filter((s) => s.groups.length);
  useLayoutEffect(() => {
    let saved = [];
    try {
      const data = JSON.parse(sessionStorage.getItem(expandedKey));
      if (Array.isArray(data))
        saved = data.filter((x) => typeof x === "string");
    } catch {}
    const next = [...new Set([...saved, ...lessonAncestors(lessonId)])];
    setExpanded(next);
    let nextLibrary = lessonAncestors(lessonId)[0] || "algorithms";
    if (!ready) {
      try {
        const savedFocus = JSON.parse(sessionStorage.getItem(libraryKey));
        if (
          savedFocus?.lesson === lessonId &&
          navigationSections.some((s) => s.id === savedFocus.library)
        )
          nextLibrary = savedFocus.library;
      } catch {}
    }
    if (!ready || lastLesson.current !== lessonId) setLibrary(nextLibrary);
    lastLesson.current = lessonId;
    setReady(true);
    try {
      sessionStorage.setItem(expandedKey, JSON.stringify(next));
    } catch {}
  }, [lessonId]);
  useLayoutEffect(() => {
    if (!ready) return;
    if (positions.current[library] === undefined) {
      try {
        positions.current[library] = Math.max(
          0,
          Number(sessionStorage.getItem(`${scrollKey}:${library}`)) || 0,
        );
      } catch {
        positions.current[library] = 0;
      }
    }
    navRef.current.scrollTop = term ? 0 : positions.current[library];
    try {
      sessionStorage.setItem(
        libraryKey,
        JSON.stringify({ lesson: lessonId, library }),
      );
    } catch {}
  }, [library, term, ready, mobileOpen, lessonId]);
  function saveExpanded(next) {
    setExpanded(next);
    try {
      sessionStorage.setItem(expandedKey, JSON.stringify(next));
    } catch {}
  }
  function toggle(key) {
    saveExpanded(
      expanded.includes(key)
        ? expanded.filter((k) => k !== key)
        : [...expanded, key],
    );
  }
  function rememberScroll(event) {
    if (!ready || term) return;
    positions.current[library] = event.currentTarget.scrollTop;
    try {
      sessionStorage.setItem(
        `${scrollKey}:${library}`,
        String(event.currentTarget.scrollTop),
      );
    } catch {}
  }
  const currentSection = navigationSections.find((s) => s.id === library);
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
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? "Close" : "Lessons"}
          <span aria-hidden="true">{mobileOpen ? "−" : "+"}</span>
        </button>
      </div>
      <div className="library-body" id="lesson-library">
        <div className="library-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Find a lesson"
            placeholder="Search every library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
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
        <div className="library-switcher" aria-label="Choose a library">
          {navigationSections.map((section, i) => (
            <button
              key={section.id}
              className={library === section.id ? "selected" : ""}
              aria-label={section.title}
              aria-pressed={library === section.id}
              onClick={() => {
                setLibrary(section.id);
                setQuery("");
              }}
            >
              <span className="library-symbol" aria-hidden="true">
                {symbols[i]}
              </span>
              <span>
                <strong>{section.shortTitle || section.title}</strong>
                <small>{subtitles[i]}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="library-caption">
          <span>{term ? "SEARCH RESULTS" : currentSection?.title}</span>
          {!term && (
            <button
              className="collapse-topics"
              onClick={() =>
                saveExpanded(
                  expanded.filter((key) => !key.startsWith(`${library}:`)),
                )
              }
            >
              Collapse all
            </button>
          )}
        </div>
        <nav
          className="library-nav"
          aria-label="Learning library"
          ref={navRef}
          onScroll={rememberScroll}
        >
          {sections.map((section) => (
            <section
              className="library-section"
              key={section.id}
              hidden={!term && section.id !== library}
            >
              {term && <p className="search-section-label">{section.title}</p>}
              {section.groups.map((group) => {
                const key = groupKey(section, group),
                  open = !!term || expanded.includes(key),
                  contentId = `nav-${section.id}-${group.index}`;
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
                        disabled={!!term}
                        onClick={() => toggle(key)}
                      >
                        <span className="topic-dot" aria-hidden="true" />
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
                          href={`/lessons/${id}`}
                          scroll={false}
                          aria-current={id === lessonId ? "page" : undefined}
                          className={`library-link ${id === lessonId ? "is-current" : ""}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span
                            className="lesson-indicator"
                            aria-hidden="true"
                          />
                          <span>{names[id] || lessons[id].label}</span>
                          {id === lessonId && (
                            <span className="current-arrow" aria-hidden="true">
                              ↗
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </section>
          ))}
          {!sections.length && (
            <div className="library-empty" role="status">
              <strong>No lessons found</strong>
              <p>Try caching, a problem name, or a design pattern.</p>
              <button onClick={() => setQuery("")}>Show all lessons</button>
            </div>
          )}
        </nav>
        <div className="library-now">
          <span className="overline">YOU ARE EXPLORING</span>
          <Link
            aria-label={`Return to ${names[lessonId] || lessons[lessonId].label}`}
            href={`/lessons/${lessonId}`}
            scroll={false}
            onClick={() => {
              setLibrary(lessonAncestors(lessonId)[0]);
              saveExpanded([
                ...new Set([...expanded, ...lessonAncestors(lessonId)]),
              ]);
              setQuery("");
              setMobileOpen(false);
            }}
          >
            {names[lessonId] || lessons[lessonId].label}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
