export const ROWS = 7;
export const COLS = 12;
export function makeGrid(preset = "weighted") {
  const cells = Array(ROWS * COLS).fill(1);
  if (preset === "weighted")
    for (let c = 3; c <= 8; c++) cells[3 * COLS + c] = 5;
  if (preset === "maze")
    for (let r = 0; r < ROWS; r++) {
      if (r !== 5) cells[r * COLS + 4] = -1;
      if (r !== 1) cells[r * COLS + 8] = -1;
    }
  if (preset === "blocked")
    for (let r = 0; r < ROWS; r++) cells[r * COLS + 6] = -1;
  return { cells, start: 3 * COLS + 1, goal: 3 * COLS + 10 };
}
