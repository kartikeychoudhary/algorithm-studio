"use client";
import { useState } from "react";
import { initialTraffic, trafficTick } from "../../lib/learning/experiments.js";
export default function FailureLab({ title = "Break the system" }) {
  const [s, setS] = useState(initialTraffic),
    [config, setConfig] = useState({
      rate: 100,
      spike: false,
      cacheDown: false,
      databaseDown: false,
      slow: false,
      paused: false,
      backoff: true,
      breaker: true,
    });
  return (
    <section className="failure-lab">
      <span className="overline">FAILURE EXPERIMENT</span>
      <h2>{title}</h2>
      <p>
        This shared capacity model abstracts the case study to API →
        cache/database → background queue. It is an illustrative stress
        experiment, not a forecast for that architecture.
      </p>
      <div className="experiment-controls">
        <label>
          New requests / second{" "}
          <input
            type="range"
            aria-label="Incoming request rate"
            min="10"
            max="200"
            step="10"
            value={config.rate}
            onChange={(e) => setConfig({ ...config, rate: +e.target.value })}
          />
          {config.rate}
        </label>
        {[
          ["spike", "5× traffic spike"],
          ["cacheDown", "Cache unavailable"],
          ["databaseDown", "Database unavailable"],
          ["slow", "Slow dependency"],
          ["paused", "Pause workers"],
          ["backoff", "Bound retries with backoff"],
          ["breaker", "Open circuit after 3 failed ticks"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={config[key]}
              onChange={(e) =>
                setConfig({ ...config, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div
        className="system-pipeline"
        role="img"
        aria-label="API cache database queue worker pipeline"
      >
        {[
          ["API", s.open ? "circuit open" : `${s.attempts ?? 0} attempts/s`],
          ["Cache / DB", config.databaseDown ? "DB unavailable" : "available"],
          ["Queue", `${s.queue} events`],
          [
            "Workers",
            config.paused ? "paused" : `${s.processed ?? 0} events/s`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{label}</strong>
            <span>{value}</span>
            <b aria-hidden="true">→</b>
          </div>
        ))}
      </div>
      <div className="metric-grid" aria-live="polite">
        {[
          ["Time", `${s.tick}s`],
          ["Successful attempts", s.completed],
          ["Failed attempts", s.errors],
          ["Dropped events", s.dropped],
          ["Estimated API latency", `${s.latency ?? 20} ms`],
          [
            "Queue drain delay",
            s.queueDelay === null
              ? "workers paused"
              : `${(s.queueDelay ?? 0).toFixed(1)}s`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <button
        className="button primary"
        onClick={() => setS((p) => trafficTick(p, config))}
      >
        Advance 1 second
      </button>
      <button className="button" onClick={() => setS(initialTraffic)}>
        Reset simulation
      </button>
      <p className="small-note">
        Assumptions: API limit 200 attempts/s (60 when slow); 80% cache hits;
        120 background events/s; queue cap 5,000. Every success emits one event.
        Retries count as attempts, not new users. The toy circuit protects the
        whole API and resumes once the database is marked available; real
        circuits use timed half-open probes. Backoff is aggregated per tick and
        omits jitter.
      </p>
    </section>
  );
}
