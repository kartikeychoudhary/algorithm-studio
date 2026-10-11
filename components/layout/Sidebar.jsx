import Link from "next/link";
import { graphLessons, lessons } from "../../lib/data/lessons.js";
import {
  interviewLessons,
  interviewGroups,
} from "../../lib/data/interview-lessons.js";

export default function Sidebar({ lessonId }) {
  const item = (id, label) => (
    <Link
      key={id}
      href={`/lessons/${id}`}
      className={id === lessonId ? "active" : ""}
      aria-current={id === lessonId ? "page" : undefined}
    >
      <span className="nav-dot" />
      {label}
    </Link>
  );
  return (
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Algorithm Studio home">
        <span className="brand-mark">A</span>
        <span>
          algorithm<span className="brand-studio">studio</span>
        </span>
      </Link>
      <div className="sidebar-caption">YOUR LEARNING SPACE</div>
      <div className="nav-label">
        ▦ The playground{" "}
        <span className="count">{Object.keys(lessons).length}</span>
      </div>
      <nav className="lesson-nav" aria-label="Algorithm lessons">
        {interviewGroups.map((group) => (
          <details
            key={group}
            className="lesson-group"
            open={interviewLessons[lessonId]?.topic === group}
          >
            <summary>
              {group}
              <span>
                {
                  Object.values(interviewLessons).filter(
                    (lesson) => lesson.topic === group,
                  ).length
                }
              </span>
            </summary>
            <div className="subnav">
              {Object.entries(interviewLessons)
                .filter(([, lesson]) => lesson.topic === group)
                .map(([id, lesson]) => item(id, lesson.label))}
            </div>
          </details>
        ))}
        <div
          className={`nav-section ${["ttt", "chess"].includes(lessonId) ? "active-section" : ""}`}
        >
          <Link className="module" href="/lessons/ttt">
            <span className="module-index">01</span>
            <span>
              Minimax algorithm<small>Think like your opponent</small>
            </span>
          </Link>
          <div className="subnav">
            {item("ttt", "Tic-tac-toe")}
            {item("chess", "Chess")}
          </div>
        </div>
        <div
          className={`nav-section ${lessonId === "knapsack" ? "active-section" : ""}`}
        >
          <Link className="module" href="/lessons/knapsack">
            <span className="module-index">02</span>
            <span>
              Knapsack algorithm<small>Choose what matters</small>
            </span>
          </Link>
        </div>
        <div
          className={`nav-section ${graphLessons[lessonId] ? "active-section" : ""}`}
        >
          <Link className="module" href="/lessons/bfs">
            <span className="module-index">03</span>
            <span>
              Graphs & pathfinding<small>Find your way through</small>
            </span>
          </Link>
          <div className="subnav graph-nav">
            {Object.entries(graphLessons).map(([id, lesson]) =>
              item(
                id,
                id === "bfs"
                  ? "BFS · Traversal"
                  : id === "dfs"
                    ? "DFS · Traversal"
                    : lesson.label,
              ),
            )}
            {item("topo", "Topological sort")}
          </div>
        </div>
      </nav>
      <div className="sidebar-note">
        <span className="note-spark">✳</span>
        <strong>
          Less memorizing.
          <br />
          More understanding.
        </strong>
        <p>
          Change an input. Follow a decision.
          <br />
          Let the idea click.
        </p>
      </div>
      <div className="sidebar-bottom">
        <span className="status-dot" />A playground for curious minds
      </div>
    </aside>
  );
}
