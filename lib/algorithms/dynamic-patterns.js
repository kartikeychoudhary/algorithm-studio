import { recorder } from "./recorder.js";

export function coinChange(coins, amount) {
  const r = recorder([
    "dp[0] = 0; dp[1..amount] = infinity",
    "for total = 1 to amount:",
    "  for coin in coins where coin <= total:",
    "    candidate = dp[total - coin] + 1",
    "    if candidate < dp[total]:",
    "      dp[total] = candidate; choice[total] = coin",
    "if dp[amount] is infinity: return IMPOSSIBLE",
    "follow choice[] backward; return dp[amount], coins",
  ]);
  const dp = Array(amount + 1).fill(Infinity),
    choice = Array(amount + 1).fill(null);
  dp[0] = 0;
  let total = 0,
    coin = null,
    candidate = null;
  const emit = (line, message, extra = {}) =>
    r.emit(line, message, {
      values: coins,
      dp,
      active: coin === null ? [] : [coins.indexOf(coin)],
      dpCurrent: total,
      dependency: coin === null ? null : total - coin,
      vars: { total, coin, candidate, best: dp[total] },
      ...extra,
    });
  emit(
    0,
    "Zero amount needs zero coins. Every other amount starts unreachable.",
  );
  for (total = 1; total <= amount; total++) {
    coin = null;
    emit(1, `Solve amount ${total}.`);
    for (coin of coins) {
      if (coin > total) continue;
      emit(2, `Try denomination ${coin}.`);
      candidate = dp[total - coin] + 1;
      emit(3, `Use one coin plus the best answer for amount ${total - coin}.`);
      emit(
        4,
        Number.isFinite(candidate) && candidate < dp[total]
          ? "This improves the minimum."
          : "This choice does not improve the answer.",
      );
      if (candidate < dp[total]) {
        dp[total] = candidate;
        choice[total] = coin;
        emit(5, `Store ${candidate} coins as the best for amount ${total}.`);
      }
    }
  }
  total = amount;
  coin = null;
  const selected = [];
  for (let t = amount; choice[t] !== null; t -= choice[t])
    selected.push(choice[t]);
  const result = {
    count: Number.isFinite(dp[amount]) ? dp[amount] : -1,
    coins: selected,
  };
  emit(
    result.count === -1 ? 6 : 7,
    result.count === -1
      ? "No combination makes this amount."
      : `Minimum: ${result.count} coins. Recovered denominations: ${selected.join(", ") || "none"}.`,
    { done: true, result, output: selected },
  );
  return r.finish(result);
}

export function subsets(values) {
  const r = recorder([
    "visit(start, path):",
    "  output.append(copy(path))",
    "  for i = start to n - 1:",
    "    path.push(a[i])",
    "    visit(i + 1, path)",
    "    path.pop()  // undo the choice",
    "visit(0, []); return output",
  ]);
  const output = [],
    path = [],
    selected = [];
  function visit(start, depth) {
    const emit = (line, message, extra = {}) =>
      r.emit(line, message, {
        values,
        selected,
        stack: path,
        subsets: output,
        vars: { start, depth, subsets: output.length },
        ...extra,
      });
    emit(0, `Enter depth ${depth} with [${path.join(", ")}].`);
    output.push(path.slice());
    emit(1, "Copy this subset into the answers, including the empty subset.");
    for (let i = start; i < values.length; i++) {
      emit(2, `Consider index ${i}.`, { active: [i] });
      path.push(values[i]);
      selected.push(i);
      emit(3, `Choose ${values[i]}.`, { active: [i] });
      emit(4, "Recurse using only later indices.");
      visit(i + 1, depth + 1);
      path.pop();
      selected.pop();
      emit(5, `Undo ${values[i]} before considering the next choice.`, {
        active: [i],
      });
    }
  }
  visit(0, 0);
  r.emit(6, `Generated ${output.length} subsets.`, {
    values,
    subsets: output,
    selected: [],
    vars: { subsets: output.length },
    done: true,
    result: output,
  });
  return r.finish(output);
}
