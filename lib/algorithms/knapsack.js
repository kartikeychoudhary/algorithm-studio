export function solveKnapsack(items, capacity) {
  const table = Array.from({ length: items.length + 1 }, () =>
    Array(capacity + 1).fill(0),
  );
  const steps = [];
  for (let i = 1; i <= items.length; i++) {
    const item = items[i - 1];
    for (let c = 0; c <= capacity; c++) {
      const skip = table[i - 1][c];
      const take =
        item.weight <= c ? item.value + table[i - 1][c - item.weight] : null;
      table[i][c] = Math.max(skip, take ?? -Infinity);
      steps.push({
        i,
        c,
        skip,
        take,
        value: table[i][c],
        chosen: take !== null && take > skip,
      });
    }
  }
  const selected = [];
  let c = capacity;
  for (let i = items.length; i > 0; i--) {
    if (table[i][c] !== table[i - 1][c]) {
      selected.push(i - 1);
      c -= items[i - 1].weight;
    }
  }
  return {
    table,
    steps,
    selected: selected.reverse(),
    value: table[items.length][capacity],
    weight: capacity - c,
  };
}
