"use client";
import { useEffect, useState } from "react";
import { studyGoals } from "../lib/data/study-goals.js";
const key = "algorithm-studio-goal-v1";
export function useStudyGoal() {
  const [goalId, setGoalId] = useState(""),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const id = localStorage.getItem(key);
        setGoalId(Object.hasOwn(studyGoals, id) ? id : "");
      } catch {}
      setReady(true);
    };
    refresh();
    window.addEventListener("studio-goal", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("studio-goal", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  function choose(id) {
    if (!Object.hasOwn(studyGoals, id)) return;
    try {
      localStorage.setItem(key, id);
    } catch {}
    setGoalId(id);
    window.dispatchEvent(new Event("studio-goal"));
  }
  return { goalId, goal: studyGoals[goalId], choose, ready };
}
