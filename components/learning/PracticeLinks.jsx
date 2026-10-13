import { practiceFor } from "../../lib/data/practice.js";
import { useProgress } from "../../hooks/useProgress.js";
export default function PracticeLinks({ id, lesson }) {
  const { progress, update } = useProgress();
  const problems = practiceFor(id, lesson);
  if (!problems.length) return null;
  return (
    <section className="practice-section" aria-label="LeetCode practice">
      <div className="practice-heading">
        <div>
          <span className="overline">PUT THE IDEA TO WORK</span>
          <h2>Practice on LeetCode</h2>
        </div>
        <span>Coding exercises · external links</span>
      </div>
      <div className="practice-grid">
        {problems.map((p) => (
          <div key={p.url}>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="practice-card"
            >
              <span className="practice-meta">
                {p.number} · {p.difficulty}
                <span aria-hidden="true">↗</span>
              </span>
              <h3>{p.name}</h3>
              <p>{p.reason}</p>
            </a>
            <label className="problem-solved">
              <input
                type="checkbox"
                checked={!!progress[`problem:${p.number}`]?.solved}
                onChange={(e) =>
                  update(`problem:${p.number}`, { solved: e.target.checked })
                }
              />{" "}
              I solved this problem
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
