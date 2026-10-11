/** LeetCode's compact level-order format: null slots have no children. */
export function decodeTree(input) {
  const nodes = [];
  if (!input.length || input[0] === null) {
    if (input.slice(1).some((v) => v !== null))
      throw new Error("An empty root cannot have children.");
    return nodes;
  }
  nodes.push({ value: input[0], left: null, right: null, depth: 0 });
  let cursor = 1;
  for (
    let parent = 0;
    parent < nodes.length && cursor < input.length;
    parent++
  ) {
    for (const side of ["left", "right"]) {
      if (cursor >= input.length) break;
      const value = input[cursor++];
      if (value !== null) {
        nodes[parent][side] = nodes.length;
        nodes.push({
          value,
          left: null,
          right: null,
          depth: nodes[parent].depth + 1,
        });
      }
    }
  }
  if (input.slice(cursor).some((v) => v !== null))
    throw new Error("These values have no parent. Check the null positions.");
  return nodes;
}
