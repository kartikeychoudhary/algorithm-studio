"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { lessons } from "../../lib/data/lessons.js";
import { studyGoals, goalStats } from "../../lib/data/study-goals.js";
import { practiceFor } from "../../lib/data/practice.js";
import { useProgress } from "../../hooks/useProgress.js";
import { useStudyGoal } from "../../hooks/useStudyGoal.js";
export default function StudyGuides() {
  const { progress, update } = useProgress(),
    { goalId, goal, choose, ready } = useStudyGoal(),
    [filter, setFilter] = useState("all"),
    [view, setView] = useState("guides"),
    [showGoals, setShowGoals] = useState(false);
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("goal");
    if (Object.hasOwn(studyGoals, requested)) choose(requested);
  }, []);
  const stats = goal && goalStats(goal, progress);
  const toolbar = (
    <div className="concept-facets" aria-label="Study views">
      {[
        ["guides", "Learning guides"],
        ["bookmarks", "Bookmarks"],
        ["review", "Review weak topics"],
      ].map(([id, label]) => (
        <button
          key={id}
          aria-pressed={view === id}
          className={view === id ? "selected" : ""}
          onClick={() => setView(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
  if (view !== "guides") {
    const saved = Object.keys(lessons)
      .filter((id) =>
        view === "bookmarks"
          ? progress[id]?.bookmark
          : progress[id]?.status === "review",
      )
      .sort(
        (a, b) =>
          (progress[a]?.reviewedAt || 0) - (progress[b]?.reviewedAt || 0),
      );
    return (
      <div className="study-guides">
        {toolbar}
        <section className="concept-reading">
          <h2>
            {view === "bookmarks"
              ? "Your bookmarks"
              : "Review oldest marked topics first"}
          </h2>
          {saved.length ? (
            saved.map((id) => (
              <p key={id}>
                <Link href={`/lessons/${id}`}>{lessons[id].label} ↗</Link>
                {progress[id]?.completed ? " · Completed" : ""}
              </p>
            ))
          ) : (
            <p>
              Use bookmarks and confidence controls inside lessons to build this
              list.
            </p>
          )}
        </section>
      </div>
    );
  }
  return (
    <div className="study-guides">
      {toolbar}
      {goal && (
        <button
          className="button goal-change"
          onClick={() => setShowGoals(!showGoals)}
          aria-expanded={showGoals}
        >
          {showGoals ? "Keep current goal" : "Change learning goal"}
        </button>
      )}
      {(!goal || showGoals) && (
        <>
          <section className="goal-intro">
            <span className="overline">YOUR GOAL. YOUR ROUTE.</span>
            <h2>What do you want to learn?</h2>
            <p>
              Choose a focused guide. Work through the stages, experiment with
              each visualization, then check off what you have completed.
            </p>
          </section>
          <div className="goal-cards">
            {Object.entries(studyGoals).map(([id, g]) => {
              const s = goalStats(g, progress);
              return (
                <button
                  key={id}
                  className={`goal-card ${id === goalId ? "selected" : ""}`}
                  aria-pressed={id === goalId}
                  onClick={() => {
                    choose(id);
                    const url = new URL(location.href);
                    url.searchParams.set("goal", id);
                    history.replaceState(null, "", url);
                    setFilter("all");
                    setShowGoals(false);
                  }}
                >
                  <span className="overline">{g.eyebrow}</span>
                  <strong>{g.title}</strong>
                  <span>{g.description}</span>
                  <small>
                    {s.done} / {s.total} completed{" "}
                    {id === goalId ? "· Current goal" : ""}
                  </small>
                  <progress
                    value={s.done}
                    max={s.total}
                    aria-label={`${g.title} progress`}
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
      {!goal ? (
        <div className="goal-empty" role="status">
          {ready
            ? "Select a goal above to see your lesson-by-lesson guide."
            : "Loading your saved guide…"}
        </div>
      ) : (
        <section className="goal-plan" aria-label={`${goal.title} guide`}>
          <div className="goal-plan-heading">
            <div>
              <span className="overline">YOUR STUDY GUIDE</span>
              <h2>{goal.title}</h2>
              <p>{goal.audience}</p>
            </div>
            <strong>
              {stats.done} / {stats.total}
              <small> lessons complete · {stats.percent}%</small>
            </strong>
          </div>
          <progress
            value={stats.done}
            max={stats.total}
            aria-label="Selected guide progress"
          />
          <div className="goal-actions">
            {stats.next ? (
              <Link className="button primary" href={`/lessons/${stats.next}`}>
                {stats.done ? "Continue learning" : "Start this guide"} →{" "}
                {lessons[stats.next].label}
              </Link>
            ) : (
              <p role="status">
                ✓ Guide complete. Revisit any lesson or choose your next goal.
              </p>
            )}
            <label>
              Show lessons
              <select
                aria-label="Guide lesson filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All lessons</option>
                <option value="remaining">Not completed</option>
                <option value="completed">Completed</option>
                <option value="review">Needs review</option>
                <option value="bookmarks">Bookmarked</option>
              </select>
            </label>
          </div>
          <details className="study-method">
            <summary>A repeatable way to learn</summary>
            <p>
              Read the explanation → step through the example → change an input
              and predict the result → explain the mechanism → try a practice
              problem where available.
            </p>
            <p>
              Check “Done” when you have worked through the lesson. Confidence
              is separate: completed lessons can still need review. Progress is
              saved in this browser, and stages are suggestions rather than
              locks.
            </p>
          </details>
          {goal.stages.map((stage, i) => {
            const ids = stage.ids.filter((id) =>
                filter === "remaining"
                  ? !progress[id]?.completed
                  : filter === "completed"
                    ? progress[id]?.completed
                    : filter === "review"
                      ? progress[id]?.status === "review"
                      : filter === "bookmarks"
                        ? progress[id]?.bookmark
                        : true,
              ),
              done = stage.ids.filter((id) => progress[id]?.completed).length;
            return (
              <section className="goal-stage" key={stage.title}>
                <header>
                  <span className="stage-number">{i + 1}</span>
                  <div>
                    <h3>{stage.title}</h3>
                    <p>{stage.outcome}</p>
                  </div>
                  <small>
                    {done}/{stage.ids.length} done
                  </small>
                </header>
                {ids.length ? (
                  <div
                    className="goal-table-scroll"
                    tabIndex={0}
                    aria-label={`${stage.title} lesson table`}
                  >
                    <table className="goal-table">
                      <caption>{stage.title} — ordered lessons</caption>
                      <thead>
                        <tr>
                          <th scope="col">Done</th>
                          <th scope="col">Lesson</th>
                          <th scope="col">Confidence</th>
                          <th scope="col">Practice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ids.map((id) => {
                          const l = lessons[id],
                            questions = practiceFor(id, l);
                          return (
                            <tr
                              key={id}
                              className={
                                progress[id]?.completed ? "is-complete" : ""
                              }
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Complete ${l.label}`}
                                  checked={!!progress[id]?.completed}
                                  onChange={(e) =>
                                    update(id, {
                                      completed: e.target.checked,
                                      completedAt: e.target.checked
                                        ? Date.now()
                                        : null,
                                    })
                                  }
                                />
                              </td>
                              <th scope="row">
                                <Link href={`/lessons/${id}`}>
                                  {l.label} <span aria-hidden="true">↗</span>
                                </Link>
                                {id === stats.next && (
                                  <small className="goal-next">Up next</small>
                                )}
                              </th>
                              <td>
                                {progress[id]?.status === "learned"
                                  ? "Understood"
                                  : progress[id]?.status === "review"
                                    ? "Needs review"
                                    : "Not rated"}
                              </td>
                              <td>
                                {questions.length ? (
                                  questions.map((q) => (
                                    <a
                                      key={q.url}
                                      href={q.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {q.number}. {q.name}
                                      {progress[`problem:${q.number}`]?.solved
                                        ? " ✓"
                                        : ""}
                                    </a>
                                  ))
                                ) : (
                                  <span className="goal-muted">
                                    Try the lesson experiment
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="goal-empty">
                    No lessons in this stage match this filter.
                  </p>
                )}
                <div className="stage-checkpoint">
                  <strong>Before moving on</strong>
                  <p>{stage.checkpoint}</p>
                </div>
              </section>
            );
          })}
        </section>
      )}
    </div>
  );
}
