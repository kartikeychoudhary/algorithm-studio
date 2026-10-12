"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { lessons, graphLessons } from "../../lib/data/lessons.js";
import { useStudio } from "./StudioProvider.jsx";
import LessonGuide from "./LessonGuide.jsx";
import TicTacToeLesson from "../../features/minimax/TicTacToeLesson.jsx";
import ChessLesson from "../../features/minimax/ChessLesson.jsx";
import KnapsackLesson from "../../features/knapsack/KnapsackLesson.jsx";
import GraphLesson from "../../features/graphs/GraphLesson.jsx";
import InterviewLesson from "../../features/interview/InterviewLesson.jsx";
import { interviewLessons } from "../../lib/data/interview-lessons.js";
import ConceptLesson from "../../features/concepts/ConceptLesson.jsx";
import DesignLesson from "../../features/design/DesignLesson.jsx";

export default function Studio({ lessonId }) {
  const [tab, setTab] = useState("lab");
  const { theme, toggleTheme } = useStudio();
  const router = useRouter();
  const lesson = lessons[lessonId];
  useEffect(() => {
    setTab("lab");
    // Reset the lesson document without moving the independent sidebar.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [lessonId]);
  useEffect(() => {
    const migrateHash = () => {
      const legacy = location.hash.slice(1);
      if (Object.hasOwn(lessons, legacy)) router.replace(`/lessons/${legacy}`);
    };
    migrateHash();
    window.addEventListener("hashchange", migrateHash);
    return () => window.removeEventListener("hashchange", migrateHash);
  }, [router]);
  return (
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumb">
          {lesson.section || "Algorithms"} <span>/</span>
          {lesson.topic}
          <span>/</span>
          <strong>{lesson.label}</strong>
        </div>
        <button
          className="button theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? "☀ Light theme" : "☾ Dark theme"}
        </button>
      </header>
      <main>
        <div className="lesson-heading">
          <div>
            <div className="eyebrow">
              <span>{lesson.tag}</span>
            </div>
            <h1>{lesson.title}</h1>
            <p className="intro">{lesson.subtitle}</p>
          </div>
          {lesson.complexity && (
            <div className="complexity">
              <span>TIME COMPLEXITY</span>
              <strong>{lesson.complexity}</strong>
            </div>
          )}
        </div>
        <div className="lesson-tabs">
          <div role="tablist" aria-label="Lesson view">
            {[
              ["lab", "▦ Playground"],
              ["learn", "▤ How it works"],
              ["code", lesson.kind ? "⌘ Walkthrough" : "⌘ Pseudocode"],
            ].map(([id, label]) => (
              <button
                key={id}
                id={`tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls="lesson-panel"
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="tab-note">
            <span className="status-dot" />
            Learn by doing
          </span>
        </div>
        <section
          role="tabpanel"
          id="lesson-panel"
          aria-labelledby={`tab-${tab}`}
          key={lessonId}
        >
          {lesson.kind === "concept" ? (
            <ConceptLesson id={lessonId} tab={tab} />
          ) : lesson.kind === "pattern" ? (
            <DesignLesson id={lessonId} tab={tab} />
          ) : tab === "learn" ? (
            <LessonGuide lessonId={lessonId} onOpen={() => setTab("lab")} />
          ) : interviewLessons[lessonId] ? (
            <InterviewLesson id={lessonId} key={lessonId} />
          ) : graphLessons[lessonId] ? (
            <GraphLesson algorithm={lessonId} />
          ) : lessonId === "ttt" ? (
            <TicTacToeLesson tab={tab} />
          ) : lessonId === "chess" ? (
            <ChessLesson tab={tab} />
          ) : (
            <KnapsackLesson tab={tab} />
          )}
        </section>
        <footer>
          <span>
            Built for the <strong>“oh, now I get it”</strong> moment.
          </span>
          <span>
            ALGORITHM STUDIO <span className="footer-star">✳</span>
          </span>
        </footer>
      </main>
    </div>
  );
}
