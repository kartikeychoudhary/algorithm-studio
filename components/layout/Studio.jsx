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
import CaseStudyLesson from "../../features/design/CaseStudyLesson.jsx";
import PracticeLinks from "../../components/learning/PracticeLinks.jsx";
import LabLesson from "../../features/interview/LabLesson.jsx";
import FoundationLesson from "../../features/concepts/FoundationLesson.jsx";
import SpringLesson from "../../features/spring/SpringLesson.jsx";
import PracticeLesson from "../../features/practice/PracticeLesson.jsx";
import LessonProgress from "../learning/LessonProgress.jsx";

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
        <LessonProgress id={lessonId} />
        <div className="lesson-tabs">
          <div role="tablist" aria-label="Lesson view">
            {[
              [
                "lab",
                lesson.kind === "case-study"
                  ? "▦ Architecture"
                  : "▦ Playground",
              ],
              [
                "learn",
                lesson.kind === "case-study"
                  ? "▤ Decisions & failures"
                  : "▤ How it works",
              ],
              [
                "code",
                lesson.kind === "case-study"
                  ? "⌘ Request flow"
                  : lesson.kind
                    ? "⌘ Walkthrough"
                    : "⌘ Pseudocode",
              ],
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
          {lesson.kind === "spring" ? (
            <SpringLesson id={lessonId} tab={tab} />
          ) : lesson.kind === "algorithm-lab" ? (
            <LabLesson id={lessonId} tab={tab} />
          ) : lesson.kind === "foundation" ? (
            <FoundationLesson id={lessonId} tab={tab} />
          ) : lesson.kind === "practice" ? (
            <PracticeLesson id={lessonId} />
          ) : lesson.kind === "case-study" ? (
            <CaseStudyLesson id={lessonId} tab={tab} />
          ) : lesson.kind === "concept" ? (
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
        <PracticeLinks id={lessonId} lesson={lesson} />
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
