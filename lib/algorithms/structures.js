import { recorder } from "./recorder.js";
import { decodeTree } from "./tree-input.js";

export function reverseList(values) {
  const r = recorder([
    "prev = null; current = head",
    "while current != null:",
    "  following = current.next",
    "  current.next = prev",
    "  prev = current; current = following",
    "return prev  // new head",
  ]);
  const next = values.map((_, i) => (i + 1 < values.length ? i + 1 : null));
  let prev = null,
    current = values.length ? 0 : null,
    following = null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values,
      next,
      active: current === null ? [] : [current],
      vars: { prev, current, following },
      ...extra,
    });
  emit(0, "Node positions stay fixed; watch their next arrows change.");
  while (current !== null) {
    emit(1, "There is another node to reverse.");
    following = next[current];
    emit(2, "Save the old next pointer before overwriting it.");
    next[current] = prev;
    emit(
      3,
      `Point node ${current} to ${prev === null ? "null" : `node ${prev}`}.`,
    );
    prev = current;
    current = following;
    emit(4, "Move both pointers one step forward.");
  }
  const result = [];
  for (let node = prev; node !== null; node = next[node])
    result.push(values[node]);
  emit(5, "The previous pointer is now the reversed list’s head.", {
    done: true,
    result,
    selected: values.map((_, i) => i),
  });
  return r.finish(result);
}

export function inorderTree(input) {
  const treeNodes = decodeTree(input),
    values = treeNodes.map((node) => node.value);
  const r = recorder([
    "stack = []; current = root; output = []",
    "while current != null or stack:",
    "  while current != null:",
    "    stack.push(current); current = current.left",
    "  current = stack.pop()",
    "  output.append(current.value)",
    "  current = current.right",
    "return output",
  ]);
  const stack = [],
    output = [],
    visited = [];
  let current = values.length ? 0 : null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values,
      tree: true,
      treeNodes,
      active: current === null ? [] : [current],
      selected: visited,
      stack: stack.map((i) => `${i}: ${values[i]}`),
      output,
      vars: { current, stackSize: stack.length },
      ...extra,
    });
  emit(
    0,
    "Read level-order input. Null slots are missing children, not nodes.",
  );
  while (current !== null || stack.length) {
    emit(1, "Continue while a subtree or an ancestor remains.");
    while (current !== null) {
      emit(2, "Descend into the left subtree.");
      stack.push(current);
      current = treeNodes[current].left;
      emit(3, "Save the ancestor, then follow its left child.");
    }
    current = stack.pop();
    emit(4, "Return to the nearest unvisited ancestor.");
    output.push(values[current]);
    visited.push(current);
    emit(5, `Visit ${values[current]} after its left subtree.`);
    current = treeNodes[current].right;
    emit(6, "Explore the right subtree next.");
  }
  emit(7, "Inorder traversal is left → node → right.", {
    done: true,
    result: output,
  });
  return r.finish(output);
}

export function topologicalSort(count, edges) {
  const r = recorder([
    "indegree = count incoming edges; queue = zero-degree nodes",
    "while queue not empty:",
    "  node = queue.shift(); order.append(node)",
    "  for next in outgoing[node]:",
    "    indegree[next] -= 1",
    "    if indegree[next] == 0: queue.push(next)",
    "if length(order) < V: return CYCLE",
    "return order",
  ]);
  const adj = Array.from({ length: count }, () => []),
    indegree = Array(count).fill(0),
    order = [],
    queue = [];
  for (const [from, to] of edges) {
    adj[from].push(to);
    indegree[to]++;
  }
  for (let i = 0; i < count; i++) if (!indegree[i]) queue.push(i);
  let current = null,
    edge = null,
    head = 0;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: Array.from({ length: count }, (_, i) => i),
      graph: true,
      edges,
      edge,
      indegree,
      queue: queue.slice(head),
      output: order,
      active: current === null ? [] : [current],
      selected: order,
      vars: {
        current,
        processed: order.length,
        remaining: count - order.length,
      },
      ...extra,
    });
  emit(0, "Only courses with no remaining prerequisites enter the queue.");
  while (head < queue.length) {
    emit(1, "There is a course ready to take.");
    current = queue[head++];
    edge = null;
    order.push(current);
    emit(2, `Take course ${current}.`);
    for (const to of adj[current]) {
      edge = [current, to];
      emit(3, `Inspect dependency ${current} → ${to}.`);
      indegree[to]--;
      emit(4, `Course ${to} has ${indegree[to]} prerequisites remaining.`);
      if (!indegree[to]) {
        queue.push(to);
        emit(5, `Course ${to} is now ready.`);
      }
    }
  }
  const cycle = order.length < count;
  current = null;
  edge = null;
  emit(
    cycle ? 6 : 7,
    cycle
      ? "A directed cycle blocks the remaining courses. No complete order exists."
      : "All prerequisites are respected by this course order.",
    { done: true, result: cycle ? null : order },
  );
  return r.finish(cycle ? null : order.slice());
}
