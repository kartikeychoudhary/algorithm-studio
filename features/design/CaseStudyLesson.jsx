"use client";
import { useState } from "react";
import Link from "next/link";
import { caseStudies } from "../../lib/data/case-studies.js";
import { lessons } from "../../lib/data/lessons.js";
import Walkthrough from "../../components/learning/Walkthrough.jsx";
import FailureLab from "../../components/learning/FailureLab.jsx";

export function capacityEstimate(dailyMillions, peak, cacheHit) {
  const average = (dailyMillions * 1e6) / 86400;
  return {
    average,
    peak: average * peak,
    storageReads: average * peak * (1 - cacheHit / 100),
  };
}
export default function CaseStudyLesson({ id, tab }) {
  const lesson = caseStudies[id];
  const [selected, setSelected] = useState(0),
    [daily, setDaily] = useState(id === "shortener" ? 10 : 1),
    [peak, setPeak] = useState(5),
    [hit, setHit] = useState(90);
  const estimate = capacityEstimate(daily, peak, id === "shortener" ? hit : 0);
  return (
    <>
      <p className="case-brief">{lesson.brief}</p>
      <div className="case-concept-map">
        <span className="overline">CONCEPTS IN THIS DESIGN</span>
        <div>
          {lesson.concepts.map(([key]) => (
            <Link key={key} href={`/lessons/${key}`}>
              {lessons[key].label} ↗
            </Link>
          ))}
        </div>
      </div>
      {tab === "lab" && (
        <>
          <div className="case-overview">
            <section className="concept-reading">
              <h2>Clarify the requirements</h2>
              <ul>
                {lesson.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section className="concept-reading">
              <h2>Size the workload</h2>
              <p>Illustrative assumptions, not a production benchmark.</p>
              <label className="case-slider">
                {lesson.workloadLabel ||
                  (id === "shortener" ? "Redirects" : "Orders")}{" "}
                per day: {daily} million
                <input
                  aria-label="Daily requests in millions"
                  type="range"
                  min="1"
                  max="100"
                  value={daily}
                  onChange={(e) => setDaily(+e.target.value)}
                />
              </label>
              <label className="case-slider">
                Peak multiplier: {peak}×
                <input
                  aria-label="Peak multiplier"
                  type="range"
                  min="1"
                  max="10"
                  value={peak}
                  onChange={(e) => setPeak(+e.target.value)}
                />
              </label>
              {id === "shortener" && (
                <label className="case-slider">
                  Cache hit rate: {hit}%
                  <input
                    aria-label="Cache hit rate"
                    type="range"
                    min="0"
                    max="99"
                    value={hit}
                    onChange={(e) => setHit(+e.target.value)}
                  />
                </label>
              )}
              <div className="capacity-results" aria-live="polite">
                <p>
                  Average:{" "}
                  <strong>
                    {Math.ceil(estimate.average).toLocaleString("en-US")}{" "}
                    requests/s
                  </strong>
                </p>
                <p>
                  Peak:{" "}
                  <strong>
                    {Math.ceil(estimate.peak).toLocaleString("en-US")}{" "}
                    requests/s
                  </strong>
                </p>
                <p>
                  {id === "shortener"
                    ? "Estimated DB reads"
                    : lesson.workloadLabel
                      ? "Primary operations"
                      : "Order transactions"}
                  :{" "}
                  <strong>
                    {Math.ceil(estimate.storageReads).toLocaleString("en-US")}/s
                  </strong>
                </p>
              </div>
              <p className="small-note">
                Average = daily volume ÷ 86,400. Peak = average × multiplier.
                {id === "shortener"
                  ? " DB reads = peak × (1 − hit rate); excludes writes, replication, and stampedes."
                  : " A primary operation can trigger multiple reads, writes, or fan-out events. Retries, byte transfers, and background work add separate load."}
              </p>
            </section>
          </div>
          <section className="concept-reading case-block">
            <h2>API contracts & data model</h2>
            {lesson.apis.map(([api, description]) => (
              <p key={api}>
                <code>{api}</code>
                <br />
                {description}
              </p>
            ))}
            <pre className="case-schema">{lesson.schema}</pre>
          </section>
        </>
      )}
      {tab !== "learn" && (
        <>
          <div className="case-flow-heading">
            <div>
              <span className="overline">ARCHITECTURE IN MOTION</span>
              <h2>Follow one request</h2>
            </div>
            <label>
              Scenario
              <select
                aria-label="Case study scenario"
                value={selected}
                onChange={(e) => setSelected(+e.target.value)}
              >
                {lesson.scenarios.map((s, i) => (
                  <option key={s.label} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Walkthrough key={selected} scenario={lesson.scenarios[selected]} />
          <p className="small-note">
            Logical responsibilities are shown as boxes. Load balancers,
            authentication, and infrastructure replicas are described in the
            design notes rather than drawn as every deployment instance.
          </p>
        </>
      )}
      {tab !== "code" && (
        <>
          <FailureLab />
          <section className="case-block">
            <h2>Explain the decisions</h2>
            <div className="case-decision-grid">
              {lesson.decisions.map(([title, detail]) => (
                <article className="idea-card" key={title}>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="concept-reading case-block">
            <h2>What fails, and how do we notice?</h2>
            <div className="case-table-scroll">
              <table className="case-table">
                <thead>
                  <tr>
                    <th>Failure</th>
                    <th>Response</th>
                    <th>Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {lesson.failures.map(([failure, response, metric]) => (
                    <tr key={failure}>
                      <th>{failure}</th>
                      <td>{response}</td>
                      <td>{metric}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Security & privacy</h3>
            <p>{lesson.security}</p>
          </section>
          <section className="case-block">
            <h2>Connect each concept to its job</h2>
            <div className="case-decision-grid">
              {lesson.concepts.map(([key, reason]) => (
                <article className="idea-card" key={key}>
                  <Link href={`/lessons/${key}`}>{lessons[key].label} ↗</Link>
                  <p>{reason}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="idea-card">
            <span className="overline">INTERVIEW FOLLOW-UP</span>
            <p>
              {lesson.workloadLabel
                ? "Which assumption breaks first at ten times the traffic? Change the failure experiment, name the bottleneck, and explain which guarantee you would trade to recover. Would the model's cache and background-event assumptions apply unchanged to this design?"
                : id === "shortener"
                  ? "What changes if every link must be revoked worldwide immediately? Explain the latency and availability cost, then change the cache and regional read policy."
                  : "What happens when a payment succeeds but its response is lost? Describe reconciliation before releasing inventory, and how you prevent a second charge."}
            </p>
          </div>
        </>
      )}
    </>
  );
}
