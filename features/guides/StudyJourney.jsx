"use client";
import Link from "next/link";
import { useProgress } from "../../hooks/useProgress.js";
import { useStudyGoal } from "../../hooks/useStudyGoal.js";
import {
  goalIds,
  goalPosition,
  goalStats,
} from "../../lib/data/study-goals.js";
import { lessons } from "../../lib/data/lessons.js";
export default function StudyJourney({ id }) {
  const { goal, goalId } = useStudyGoal(),
    { progress, update } = useProgress();
  if (!goal || id === "roadmap") return null;
  const position = goalPosition(goal, id);
  if (!position)
    return (
      <div className="study-journey outside-goal">
        <span>This lesson is outside your current guide: {goal.title}.</span>
        <Link href={`/lessons/roadmap?goal=${goalId}`}>Return to guide →</Link>
      </div>
    );
  const ids = goalIds(goal),
    next =
      ids.slice(position.index + 1).find((x) => !progress[x]?.completed) ||
      ids.find((x) => x !== id && !progress[x]?.completed),
    stats = goalStats(goal, progress);
  return (
    <section className="study-journey" aria-label="Guided learning">
      <div>
        <span className="overline">
          {goal.title} · LESSON {position.index + 1} OF {ids.length}
        </span>
        <strong>{position.stage.title}</strong>
        <span>
          {stats.done} completed · {position.stage.outcome}
        </span>
      </div>
      <div className="journey-actions">
        <Link href={`/lessons/roadmap?goal=${goalId}`}>View checklist</Link>
        {position.index > 0 && (
          <Link href={`/lessons/${ids[position.index - 1]}`}>
            ← Previous lesson
          </Link>
        )}
        <Link
          className="button primary"
          href={next ? `/lessons/${next}` : `/lessons/roadmap?goal=${goalId}`}
          onClick={() =>
            update(id, { completed: true, completedAt: Date.now() })
          }
        >
          {next
            ? "Mark complete & continue →"
            : "Mark complete & finish guide ✓"}
        </Link>
      </div>
    </section>
  );
}
