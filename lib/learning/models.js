import { recorder } from "../algorithms/recorder.js";
export function walkthrough(scenario) {
  const states = scenario.nodes.map(() => "Ready");
  const code = scenario.steps.map((step) => step[3]);
  const r = recorder(code);
  scenario.steps.forEach(([from, to, message, , value, updates = {}], line) => {
    states[to] = value;
    for (const [node, state] of Object.entries(updates))
      states[Number(node)] = state;
    r.emit(line, message, {
      from,
      to,
      states,
      vars: {
        step: line + 1,
        from: scenario.nodes[from],
        to: scenario.nodes[to],
      },
      done: line === scenario.steps.length - 1,
    });
  });
  return r.finish(states);
}
export function transactionTrace(amount, mode = "success") {
  const code = [
    "BEGIN; copy committed balances",
    "CHECK amount > 0 and accountA >= amount",
    "working.A -= amount",
    "working.B += amount",
    "CHECK working.A + working.B == originalTotal",
    "COMMIT: persist both balances, then acknowledge",
    "ROLLBACK: discard uncommitted changes",
    "RESTART: reload last durable commit",
  ];
  const r = recorder(code);
  let working = [100, 50],
    committed = [100, 50],
    journal = "No committed transfer";
  const emit = (line, message, done = false) =>
    r.emit(line, message, {
      working,
      committed,
      journal,
      vars: { amount, total: working[0] + working[1] },
      done,
    });
  emit(
    0,
    "Begin with an isolated working copy. Other readers still see [100, 50].",
  );
  if (!Number.isInteger(amount) || amount <= 0 || amount > 100) {
    emit(
      1,
      "The transfer violates the positive amount or non-negative balance rule.",
    );
    emit(
      6,
      "Reject the transaction; both committed balances are unchanged.",
      true,
    );
    return r.finish(committed);
  }
  emit(1, "The requested transfer satisfies the declared rules.");
  working[0] -= amount;
  emit(
    2,
    "Debit only the private working copy. A concurrent reader still sees the old committed balances.",
  );
  if (mode === "rollback") {
    working = [...committed];
    emit(
      6,
      "A failure occurred before crediting B. Roll back the entire transfer.",
      true,
    );
    return r.finish(committed);
  }
  working[1] += amount;
  emit(3, "Credit B in the same transaction.");
  emit(4, "The total is 150 and neither balance is negative.");
  committed = [...working];
  journal = `Committed [${committed.join(", ")}]`;
  emit(
    5,
    "Persist both balances before acknowledging success. Readers can now see the new committed state.",
    mode !== "recovery",
  );
  if (mode === "recovery") {
    working = [...committed];
    emit(
      7,
      "After a simulated process restart, recover the acknowledged transfer from durable state.",
      true,
    );
  }
  return r.finish(committed);
}
export const initialReplicas = {
  a: 1,
  b: 1,
  partition: false,
  policy: "cp",
  reply: "No read yet",
  message: "Both replicas start at version 1.",
  line: 0,
};
export function replicaAction(state, action) {
  const s = { ...state };
  if (action === "split") {
    s.partition = true;
    s.message =
      "The replication link is broken. A remains the fixed writer; B is isolated.";
    s.line = 1;
  }
  if (action === "heal") {
    s.partition = false;
    s.b = s.a;
    s.message =
      "Restore communication and copy the authoritative value from A to B.";
    s.line = 0;
  }
  if (action === "write") {
    s.a++;
    if (!s.partition) s.b = s.a;
    s.message = `Write version ${s.a} on A.${s.partition ? " B has not received it." : " Replicate it to B."}`;
    s.line = 0;
  }
  if (action === "read") {
    const blocked = s.partition && s.policy === "cp";
    s.reply = blocked
      ? "Unavailable · retry"
      : `Version ${s.b}${s.b !== s.a ? " · stale" : ""}`;
    s.message = blocked
      ? "B refuses a read it cannot validate against the fixed writer."
      : "B answers with its local value; a partition may make it stale.";
    s.line = blocked ? 2 : 3;
  }
  if (action === "cp" || action === "ap") {
    s.policy = action;
    s.reply = "No read yet";
    s.message =
      action === "cp"
        ? "Prioritize a single up-to-date order; isolated reads may fail."
        : "Prioritize an answer from B even when it cannot contact A.";
  }
  return s;
}
