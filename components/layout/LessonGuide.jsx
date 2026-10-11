import { graphGuides } from "../../lib/data/guides.js";
import { lessons } from "../../lib/data/lessons.js";
import { interviewLessons } from "../../lib/data/interview-lessons.js";
const guides = {
  ttt: [
    [
      "Define the score",
      "X maximizes and O minimizes. A terminal board scores +1 for X winning, −1 for O winning, or 0 for a draw. Equally good scores tie.",
    ],
    [
      "Explore every reply",
      "Try each legal move, then recursively switch players. Assume the opponent always chooses their strongest reply.",
    ],
    [
      "Bring scores back up",
      "MAX chooses the highest child score; MIN chooses the lowest. The chosen root move is best against perfect play.",
    ],
  ],
  chess: [
    [
      "Use the same decision tree",
      "White maximizes and Black minimizes. chess.js generates legal moves, including king safety, castling, and en passant.",
    ],
    [
      "Limit the search depth",
      "Chess has far more branches than tic-tac-toe. At the selected depth, estimate the position using material.",
    ],
    [
      "Read the principal variation",
      "Follow the best reply for each side. This is a teaching evaluation, not a competitive chess engine: shallow search can miss tactics beyond its horizon.",
    ],
  ],
  knapsack: [
    [
      "Define a smaller problem",
      "dp[i][w] is the best value using the first i items with at most w units of capacity. With zero items, the answer is zero.",
    ],
    [
      "Compare take and skip",
      "Skip: dp[i−1][w]. Take, if it fits: value[i] + dp[i−1][w−weight[i]]. Choose the larger answer.",
    ],
    [
      "Recover the selected items",
      "Walk backward from the final cell. When its value differs from the previous row, that item was selected. Each item can be used at most once.",
    ],
  ],
};
export default function LessonGuide({ lessonId, onOpen }) {
  const interview = interviewLessons[lessonId];
  const steps = interview
    ? [
        ["Maintain the invariant", interview.invariant],
        ["Recognize the pattern", interview.recognize],
        ["Avoid the trap", interview.pitfall],
      ]
    : graphGuides[lessonId] || guides[lessonId];
  return (
    <section className="panel article">
      <span className="overline">THE CORE IDEA</span>
      <h2>{lessons[lessonId].label}</h2>
      <div className="explain-steps">
        {steps.map(([title, body], i) => (
          <div key={title}>
            <span>0{i + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </div>
      {interview && (
        <p>
          {interview.note} Auxiliary space: {interview.space}.
        </p>
      )}
      <p>
        V = nodes, E = edges, K = maximum stops, b = branching factor, d =
        search depth, n = items, W = capacity. Complexity labels describe the
        algorithm; this teaching app also stores snapshots for backward
        playback.
      </p>
      <button className="button primary" onClick={onOpen}>
        Open the interactive lesson →
      </button>
    </section>
  );
}
