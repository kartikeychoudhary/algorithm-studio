export const initialTraffic = {
  tick: 0,
  queue: 0,
  completed: 0,
  errors: 0,
  dropped: 0,
  failures: 0,
  retry: 0,
};
export function trafficTick(
  s,
  {
    rate = 100,
    spike = false,
    cacheDown = false,
    databaseDown = false,
    slow = false,
    paused = false,
    backoff = true,
    breaker = true,
  },
) {
  const incoming = rate * (spike ? 5 : 1),
    capacity = slow ? 60 : 200,
    open = breaker && s.failures >= 3 && databaseDown;
  const attempts =
    incoming +
    (backoff ? Math.min(s.retry, Math.ceil(incoming * 0.1)) : s.retry);
  const admitted = Math.min(attempts, capacity),
    miss = cacheDown ? 1 : 0.2;
  const success = open
    ? 0
    : Math.floor(admitted * (databaseDown ? 1 - miss : 1));
  const failed = attempts - success,
    queueIncoming = success;
  const available = s.queue + queueIncoming,
    processed = paused ? 0 : Math.min(available, 120),
    queue = Math.min(5000, available - processed),
    dropped = Math.max(0, available - processed - 5000);
  return {
    tick: s.tick + 1,
    queue,
    completed: s.completed + success,
    errors: s.errors + failed,
    dropped: s.dropped + dropped,
    failures: databaseDown ? s.failures + 1 : 0,
    retry: open
      ? 0
      : Math.min(1000, backoff ? Math.ceil(failed * 0.1) : failed),
    incoming,
    attempts,
    success,
    failed,
    processed,
    open,
    latency: Math.round(
      20 + (admitted / Math.max(1, capacity)) * 80 + (slow ? 250 : 0),
    ),
    queueDelay: paused ? null : queue / 120,
  };
}
export const initialRace = {
  value: 0,
  a: { pc: 0, local: null },
  b: { pc: 0, local: null },
  owner: null,
  history: [],
};
export function raceStep(previous, worker, locked) {
  const s = structuredClone(previous),
    w = s[worker];
  if (w.pc === 2) return s;
  if (locked && s.owner && s.owner !== worker) {
    s.history.push(`${worker.toUpperCase()} waits for the lock`);
    return s;
  }
  if (w.pc === 0) {
    if (locked) s.owner = worker;
    w.local = s.value;
    w.pc = 1;
    s.history.push(`${worker.toUpperCase()} reads ${s.value}`);
  } else {
    s.value = w.local + 1;
    w.pc = 2;
    if (locked) s.owner = null;
    s.history.push(`${worker.toUpperCase()} writes ${s.value}`);
  }
  return s;
}
export function compareSearch(values, target) {
  let linear = [],
    binary = [],
    answer = -1;
  for (let i = 0; i < values.length; i++) {
    linear.push({ index: i, value: values[i] });
    if (values[i] === target) {
      answer = i;
      break;
    }
  }
  let lo = 0,
    hi = values.length - 1,
    bAnswer = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    binary.push({ index: mid, value: values[mid], lo, hi });
    if (values[mid] === target) {
      bAnswer = mid;
      break;
    }
    if (values[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { linear, binary, answer, bAnswer };
}
export function debugSearch(values, target, inclusive) {
  let lo = 0,
    hi = values.length - 1,
    steps = [];
  while (inclusive ? lo <= hi : lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ lo, hi, mid });
    if (values[mid] === target) return { result: mid, steps };
    if (values[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { result: -1, steps };
}
