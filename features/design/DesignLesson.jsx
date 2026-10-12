import { designLessons } from "../../lib/data/design-patterns.js";
import Walkthrough from "../../components/learning/Walkthrough.jsx";
export default function DesignLesson({ id, tab }) {
  const lesson = designLessons[id];
  return (
    <>
      <div className="concept-banner-note">
        <strong>{lesson.category} patterns</strong>
        <span>
          {lesson.category === "Creational"
            ? "How objects are created."
            : lesson.category === "Structural"
              ? "How objects and classes fit together."
              : "How objects communicate and share responsibilities."}{" "}
          These are software design patterns, one part of the wider
          system-design toolkit.
        </span>
      </div>
      {tab === "learn" ? (
        <div className="concept-reading">
          <h2>{lesson.label} in everyday terms</h2>
          <p>{lesson.analogy}</p>
          <h3>Use it when</h3>
          <p>{lesson.when}</p>
          <h3>What it costs</h3>
          <p>{lesson.cost}</p>
          <h3>Follow the example</h3>
          <ol>
            {lesson.steps.map((step, i) => (
              <li key={i}>{step[2]}</li>
            ))}
          </ol>
        </div>
      ) : (
        <Walkthrough scenario={lesson} />
      )}
      <div className="learning-takeaways">
        <section>
          <span className="overline">USE IT WHEN</span>
          <p>{lesson.when}</p>
        </section>
        <section>
          <span className="overline">TRADEOFF / INTERVIEW TRAP</span>
          <p>{lesson.cost}</p>
        </section>
      </div>
      <p className="small-note">
        The diagram is a conceptual walkthrough; arrows show calls, responses,
        or relationships, not deployment topology.
      </p>
    </>
  );
}
