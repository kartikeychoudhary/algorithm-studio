"use client";
import { useProgress } from "../../hooks/useProgress.js";
export default function LessonProgress({ id }) {
  const { progress, update } = useProgress(),
    p = progress[id] || {};
  return (
    <div className="lesson-progress">
      <button
        className="button"
        aria-pressed={!!p.bookmark}
        onClick={() => update(id, { bookmark: !p.bookmark })}
      >
        {p.bookmark ? "★ Bookmarked" : "☆ Bookmark"}
      </button>
      <label>
        My confidence
        <select
          aria-label="Lesson confidence"
          value={p.status || "new"}
          onChange={(e) =>
            update(id, { status: e.target.value, reviewedAt: Date.now() })
          }
        >
          <option value="new">Not studied</option>
          <option value="review">Needs review</option>
          <option value="learned">Understood</option>
        </select>
      </label>
      <span className="small-note">Saved on this browser</span>
    </div>
  );
}
