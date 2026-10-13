import { sequence } from "./spring-lessons.js";
const foundation = (label, topic, subtitle, scenarios = []) => ({
  kind: "foundation",
  section: "Important Concepts",
  tag: "FOUNDATIONS LAB",
  label,
  title: label,
  topic,
  subtitle,
  scenarios,
});
export const foundationLessons = {
  concurrency: foundation(
    "Concurrency & race conditions",
    "Runtime & concurrency",
    "Interleave two increments to lose an update, then protect the critical section with a lock.",
  ),
  isolation: foundation(
    "Database isolation anomalies",
    "Data & storage",
    "Compare dirty reads, changing reads, and write skew; identify what stronger isolation must prevent.",
    [
      sequence(
        "Dirty read",
        ["Transaction A", "Database", "Transaction B"],
        [
          [
            0,
            1,
            "A writes balance 50 but has not committed.",
            "UPDATE balance=50; -- uncommitted",
            "working 50",
          ],
          [
            1,
            2,
            "At READ UNCOMMITTED in engines that permit dirty reads, B can observe 50.",
            "SELECT balance; -- 50",
            "observed 50",
          ],
          [
            0,
            1,
            "A rolls back; the committed value remains 100.",
            "ROLLBACK",
            "committed 100",
          ],
          [
            1,
            2,
            "B made a decision using a value that never committed.",
            "dirty read discovered",
            "invalid assumption",
          ],
        ],
        "READ COMMITTED prevents dirty reads. PostgreSQL maps READ UNCOMMITTED to READ COMMITTED.",
      ),
      sequence(
        "Non-repeatable read",
        ["Transaction A", "Database", "Transaction B"],
        [
          [0, 1, "A reads committed balance 100.", "SELECT balance", "100"],
          [
            2,
            1,
            "B changes the balance and commits.",
            "UPDATE balance=80; COMMIT",
            "80 committed",
          ],
          [
            0,
            1,
            "A reads again under statement-level READ COMMITTED snapshots.",
            "SELECT balance",
            "80",
          ],
          [
            1,
            0,
            "The two reads in A disagree.",
            "100 != 80",
            "non-repeatable read",
          ],
        ],
        "A stable transaction snapshot can make repeated reads consistent, with engine-specific semantics.",
      ),
      sequence(
        "Write skew",
        ["Doctor A transaction", "Roster DB", "Doctor B transaction"],
        [
          [
            0,
            1,
            "A sees two on-call doctors in its snapshot.",
            "SELECT count(on_call) -- 2",
            "A sees 2",
          ],
          [
            2,
            1,
            "B sees the same initial snapshot.",
            "SELECT count(on_call) -- 2",
            "B sees 2",
          ],
          [
            0,
            1,
            "A updates only its own row and commits.",
            "A.on_call=false; COMMIT",
            "B still on call",
          ],
          [
            2,
            1,
            "B updates a different row based on the stale predicate.",
            "B.on_call=false; COMMIT",
            "zero on call",
          ],
          [
            1,
            0,
            "Snapshot isolation can allow this cross-row invariant violation.",
            "require count(on_call) >= 1",
            "invariant broken",
          ],
        ],
        "Serializable execution must prevent this outcome, commonly by aborting a conflicting transaction; retry the whole transaction.",
      ),
    ],
  ),
  networking: foundation(
    "DNS → TLS → HTTP",
    "Networking",
    "Follow a request from a hostname to application bytes, including cache and connection reuse.",
    [
      sequence(
        "New HTTPS connection",
        ["Browser", "DNS resolver", "Server / edge", "Application"],
        [
          [
            0,
            1,
            "Resolve a hostname; local and recursive caches may avoid upstream queries.",
            "resolve api.example.com",
            "IP address",
          ],
          [
            0,
            2,
            "For this HTTP/1.1 or HTTP/2 example, establish TCP.",
            "SYN → SYN-ACK → ACK",
            "TCP connected",
          ],
          [
            0,
            2,
            "Negotiate TLS, authenticate the server certificate, and establish traffic keys.",
            "TLS handshake",
            "encrypted channel",
          ],
          [
            0,
            2,
            "Send method, path, headers, and optional body inside TLS.",
            "GET /items HTTP/2",
            "request received",
          ],
          [
            2,
            3,
            "A reverse proxy/load balancer forwards to an application instance.",
            "route to healthy upstream",
            "handling",
          ],
          [
            3,
            2,
            "The application produces a status, headers, and body.",
            "200 application/json",
            "response",
          ],
          [
            2,
            0,
            "The browser receives and interprets the representation.",
            "decode response body",
            "response available",
          ],
        ],
        "HTTP/3 uses QUIC over UDP with TLS integrated; this diagram intentionally shows the TCP path.",
      ),
      sequence(
        "Reuse a connection",
        ["Browser cache", "Connection pool", "Server"],
        [
          [
            0,
            1,
            "A fresh cache miss still may reuse a live connection.",
            "reuse existing connection",
            "connection found",
          ],
          [
            1,
            2,
            "Send another request without repeating DNS/TCP/TLS establishment.",
            "HTTP request on existing connection",
            "response",
          ],
          [
            2,
            0,
            "Cache only when response rules permit it.",
            "apply Cache-Control / validators",
            "stored or bypassed",
          ],
        ],
        "Caching and connection reuse save different work; a conditional request can return 304 without a full body.",
      ),
    ],
  ),
  reliability: foundation(
    "Retries, breakers & backpressure",
    "Reliability & traffic",
    "Inject failures, observe retry amplification, and compare bounded retries with a circuit breaker.",
  ),
  memory: foundation(
    "Memory & the event loop",
    "Runtime & concurrency",
    "Inspect stack frames, object references, reachability, tasks, and microtasks. These models use JavaScript semantics.",
  ),
};
export const foundationSources={
 isolation:{label:'PostgreSQL · Transaction isolation',url:'https://www.postgresql.org/docs/current/transaction-iso.html'},
 memory:{label:'MDN · JavaScript execution model',url:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model'},
 networking:{label:'MDN · How browsers work',url:'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work'}
};
