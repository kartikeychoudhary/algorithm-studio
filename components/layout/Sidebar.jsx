import Link from "next/link";
import { lessons } from "../../lib/data/lessons.js";
import { navigationGroups } from "../../lib/data/navigation.js";

export default function Sidebar({ lessonId }) {
  const names = {
    bfs: "BFS · Traversal",
    dfs: "DFS · Traversal",
    stack: "Monotonic stack",
    heap: "Min-heap",
    tree: "Inorder traversal",
    hashing: "Hash map · Two Sum",
    subsets: "Subsets",
    linked: "Reverse linked list",
  };
  return (
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Algorithm Studio home">
        <span className="brand-mark">A</span>
        <span>
          algorithm<span className="brand-studio">studio</span>
        </span>
      </Link>
      <div className="sidebar-caption">YOUR LEARNING SPACE</div>
      <div className="nav-label">▦ The playground</div>
      <nav className="lesson-nav" aria-label="Algorithm lessons">
        {navigationGroups.map((group) => (
          <section
            key={group.title}
            className={`nav-section ${group.ids.includes(lessonId) ? "active-section" : ""}`}
            aria-label={group.title}
          >
            <Link className="module" href={`/lessons/${group.ids[0]}`}>
              <span>
                {group.title}
                <small>{group.description}</small>
              </span>
            </Link>
            {group.ids[0] !== "knapsack" && (
              <div className="subnav">
                {group.ids.map((id) => (
                  <Link
                    key={id}
                    href={`/lessons/${id}`}
                    className={id === lessonId ? "active" : ""}
                    aria-current={id === lessonId ? "page" : undefined}
                  >
                    <span className="nav-dot" />
                    {names[id] || lessons[id].label}
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <span className="status-dot" />A playground for curious minds
      </div>
    </aside>
  );
}
