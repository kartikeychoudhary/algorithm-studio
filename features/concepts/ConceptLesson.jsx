"use client";
import { useState } from "react";
import { conceptLessons } from "../../lib/data/concepts.js";
import Walkthrough from "../../components/learning/Walkthrough.jsx";
import TransactionLab from "./TransactionLab.jsx";
import PartitionLab from "./PartitionLab.jsx";
import GrowthLab from "./GrowthLab.jsx";
export default function ConceptLesson({ id, tab }) {
  const lesson = conceptLessons[id];
  const [selected, setSelected] = useState(0);
  const facet = lesson.facets[selected];
  return (
    <>
      <div
        className="concept-facets"
        role="tablist"
        aria-label={`${lesson.label} topics`}
      >
        {lesson.facets.map((f, i) => (
          <button
            role="tab"
            id={`facet-${i}`}
            aria-controls="facet-content"
            aria-selected={selected === i}
            className={selected === i ? "selected" : ""}
            key={f.label}
            onClick={() => setSelected(i)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <section
        id="facet-content"
        role="tabpanel"
        aria-labelledby={`facet-${selected}`}
      >
        <div className="concept-intuition">
          <span className="overline">{facet.label}</span>
          <h2>{facet.idea}</h2>
          <p>{facet.analogy}</p>
        </div>
        {tab === "learn" ? (
          <div className="concept-reading">
            <h3>Connect the ideas</h3>
            {lesson.facets.map((f) => (
              <section key={f.label}>
                <h4>{f.label}</h4>
                <p>
                  {f.idea} {f.analogy}
                </p>
              </section>
            ))}
            <p>
              Open the Playground tab and change the scenario to test your
              understanding.
            </p>
          </div>
        ) : id === "acid" ? (
          <TransactionLab />
        ) : id === "cap" ? (
          <PartitionLab />
        ) : id === "complexity" ? (
          <GrowthLab />
        ) : (
          <Walkthrough key={selected} scenario={facet} />
        )}
      </section>
      {lesson.source && (
        <p className="learning-source">
          Read further:{" "}
          <a href={lesson.source.url} target="_blank" rel="noreferrer">
            {lesson.source.label} ↗
          </a>
        </p>
      )}
    </>
  );
}
