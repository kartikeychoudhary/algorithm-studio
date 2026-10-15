const item = (label, subtitle) => ({
  kind: "practice",
  section: "Practice",
  topic: "Active learning",
  tag: "PRACTICE STUDIO",
  label,
  title: label,
  subtitle,
});
export const practiceLessons = {
  roadmap: item(
    "Goal-based study guides",
    "Choose your goal, follow an ordered lesson checklist, and continue where you left off.",
  ),
  compare: item(
    "Compare approaches",
    "Run the same input through a linear scan and binary search; inspect actual comparisons and modeled auxiliary state.",
  ),
  debug: item(
    "Find the bug",
    "Repair a boundary condition and run examples that expose the error. No arbitrary code execution is used.",
  ),
};
