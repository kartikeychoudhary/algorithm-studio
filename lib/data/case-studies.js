import { moreCaseStudies } from "./more-case-studies.js";
const flow = (label, nodes, steps, idea, analogy) => ({
  label,
  nodes,
  steps,
  idea,
  analogy,
  edges: [
    ...new Map(steps.map((s) => [`${s[0]}-${s[1]}`, [s[0], s[1]]])).values(),
  ],
});
const shortNodes = [
  "Edge + Link API",
  "Cache",
  "Link database",
  "Event queue",
  "Analytics worker",
];
const checkoutNodes = [
  "Order API",
  "Order database",
  "Outbox relay",
  "Payment provider",
  "Order consumer",
];
export const caseStudies = {
  ...moreCaseStudies,
  shortener: {
    kind: "case-study",
    section: "Case Studies",
    topic: "Read-heavy systems",
    label: "URL shortener",
    title: "Design a URL shortener.",
    tag: "SYSTEM DESIGN CASE STUDY",
    subtitle:
      "From a short code to a resilient redirect service. Follow the request, estimate load, and test failures.",
    brief:
      "Create short links, redirect visitors, expire or revoke links, and collect approximate click analytics. Start in one region; expand only when latency or recovery requirements justify it.",
    requirements: [
      "Create a link and return a unique opaque code; authorized owners can revoke it.",
      "Redirects target 99.9% availability and p95 under 100 ms within the serving region (design targets, not measured results).",
      "Analytics may lag by minutes and may lose events during overload; redirects should not wait for aggregation.",
      "Revocation may remain stale for the 60-second cache TTL plus replication lag unless explicit invalidation succeeds. A strict bound requires bounded lag or primary reads on refill; immediate takedown needs a strongly checked denylist.",
    ],
    apis: [
      [
        "POST /v1/links",
        "{url, expiresAt}; Idempotency-Key header → 201 {code}. Authenticate creators and validate http(s) URLs.",
      ],
      [
        "GET /:code",
        "302 Location for an active link; 404 unknown, 410 expired/revoked. A temporary redirect allows destination changes.",
      ],
      [
        "DELETE /v1/links/:code",
        "Authorize ownership, mark revoked in storage, invalidate caches; repeated deletion is safe.",
      ],
    ],
    schema:
      "links(code PRIMARY KEY, destination, owner_id, created_at, expires_at, revoked_at)\nrequest_keys(owner_id, key, request_hash, response, UNIQUE(owner_id,key))\nclick_events(event_id, code, time_bucket, coarse_region)",
    decisions: [
      [
        "Code generation",
        "Generate an 8-character random base62 code; enforce database uniqueness and retry a collision. The namespace is 62⁸, but randomness alone never guarantees uniqueness.",
      ],
      [
        "Read path",
        "Stateless API replicas sit behind a load balancer. Cache-aside reduces database reads; protect storage with a timeout, concurrency limit, and request coalescing.",
      ],
      [
        "Storage",
        "Begin with an indexed relational table and a primary/replica setup. Use primary fallback for a just-created link if a lagging replica misses.",
      ],
      [
        "Scale-out",
        "If measurements demand sharding, partition by a hash of code and replicate each shard. Popular links still require caching because one hot key stays on one shard.",
      ],
      [
        "Analytics",
        "Queue compact click events after the response-critical work. Deduplicate by event ID when useful; explicitly accept sampling/drops during overload.",
      ],
    ],
    failures: [
      [
        "Cache outage",
        "Fall back to storage within a strict concurrency budget; shed excess load instead of overwhelming the database.",
        "Cache hit ratio, database QPS, timeout rate",
      ],
      [
        "Replica lag / primary failure",
        "Use the primary for fresh misses. Automated failover requires fencing; async replication has a nonzero data-loss window.",
        "Replication lag, failover time, recovery-point objective",
      ],
      [
        "Hot link / traffic spike",
        "Coalesce concurrent misses, spread cache replicas, and rate-limit abusive clients.",
        "Per-key demand, p95/p99 latency, rejected requests",
      ],
      [
        "Queue unavailable",
        "Continue redirects and count dropped or sampled analytics. If clicks are billing-critical, choose a durable ingestion path instead.",
        "Queue age, publish failures, event loss",
      ],
      [
        "Abusive destinations",
        "Validate schemes; apply phishing checks and takedown controls. Do not fetch arbitrary targets without SSRF defenses.",
        "Abuse reports, denied schemes, revocation delay",
      ],
    ],
    security:
      "Use TLS, authenticate management APIs, authorize owner actions, cap URL length, and avoid logging full destination URLs or raw visitor identifiers. Rate limits and opaque codes do not replace access control.",
    concepts: [
      ["caching", "Absorb repeated redirects; define TTL and invalidation."],
      ["indexes", "Unique code lookup and collision enforcement."],
      [
        "replication",
        "Copies improve availability with an explicit freshness policy.",
      ],
      [
        "sharding",
        "Distribute independent keys only when one storage group becomes a bottleneck.",
      ],
      ["queues", "Decouple click aggregation from redirects."],
      ["ratelimit", "Bound abuse and preserve storage headroom."],
      ["idempotency", "Avoid duplicate link creation on client retries."],
      [
        "cap",
        "State the behavior of isolated regions rather than promising all guarantees.",
      ],
      ["proxy", "The edge mediates requests to the backing service."],
    ],
    scenarios: [
      flow(
        "Cache hit",
        shortNodes,
        [
          [
            0,
            1,
            "The edge accepts a valid request within the rate limit.",
            "value = cache.get(code)",
            "active destination",
          ],
          [
            1,
            0,
            "An unexpired entry resolves the redirect without a database query.",
            "return 302 Location(value)",
            "redirect ready",
          ],
          [
            0,
            3,
            "Best-effort analytics stays off the response-critical path.",
            "enqueue(clickEvent)",
            "click queued",
          ],
          [
            3,
            4,
            "Aggregate the event asynchronously.",
            "incrementBucket(code, hour)",
            "click counted",
          ],
        ],
        "Separate the fast redirect path from analytics.",
        "A receptionist uses a directory at the desk, then records statistics later.",
      ),
      flow(
        "Cache miss",
        shortNodes,
        [
          [0, 1, "A new or evicted key misses.", "cache.get(code)", "miss"],
          [
            0,
            2,
            "Read by the indexed code, checking expiry and revocation.",
            "db.findActive(code)",
            "active destination",
          ],
          [
            0,
            1,
            "Populate the cache with a bounded lifetime.",
            "cache.set(code, url, ttl=60s)",
            "entry filled",
          ],
          [
            1,
            0,
            "Return a temporary redirect to the caller.",
            "return 302 Location(url)",
            "redirect ready",
          ],
        ],
        "Cache misses are normal; capacity planning must include them.",
        "Fetch a missing directory entry from the archive and keep a temporary copy.",
      ),
      flow(
        "Cache unavailable",
        shortNodes,
        [
          [
            0,
            1,
            "The cache times out; stop waiting after a small timeout budget.",
            "cache.get(code, timeout)",
            "timeout",
          ],
          [
            0,
            2,
            "A bounded fallback protects the database; excess requests would receive 503.",
            "if dbBudget.available: db.findActive(code)",
            "fallback read",
          ],
          [
            2,
            0,
            "Return the successful result, without retrying the failed cache repeatedly.",
            "return 302; recordDegradedMode()",
            "redirect · degraded",
          ],
        ],
        "Graceful degradation needs a resource budget.",
        "A closed front desk cannot send an unlimited crowd into the archive.",
      ),
    ],
  },
  checkout: {
    kind: "case-study",
    section: "Case Studies",
    topic: "Reliable workflows",
    label: "Order & payment system",
    title: "Design an order & payment system.",
    tag: "SYSTEM DESIGN CASE STUDY",
    subtitle:
      "Connect transactions, idempotency, outbox delivery, and compensation without pretending a network call is atomic.",
    brief:
      "Accept an order, reserve inventory, request payment, and eventually confirm or cancel. Treat an external payment provider as a separate failure domain. This model omits shipping, tax, refunds policy, and multi-currency settlement.",
    requirements: [
      "Never charge twice for one intended order, even if the client or queue retries.",
      "Reserve stock without overselling using a conditional database update in a local transaction.",
      "Return a durable order ID quickly; payment outcome may remain pending. Target 99.9% order-acceptance availability, excluding invalid/out-of-stock requests.",
      "An unknown payment outcome stays pending for reconciliation. A timeout alone must not be treated as a definite payment failure.",
    ],
    apis: [
      [
        "POST /v1/orders",
        "{items}; Idempotency-Key → 202 {orderId, status:'pending'}. Same key/body replays the result; changed body returns 409.",
      ],
      [
        "GET /v1/orders/:id",
        "Authorize the owner; return pending, paid, or canceled with the latest version.",
      ],
      [
        "POST /v1/payment-events",
        "Verify provider signature, validate event identity, and deduplicate before changing order state.",
      ],
    ],
    schema:
      "orders(id PRIMARY KEY, owner_id, status, amount_minor, version)\ninventory(sku PRIMARY KEY, available)\nrequest_keys(owner_id, key, request_hash, response, UNIQUE(owner_id,key))\noutbox(event_id PRIMARY KEY, order_id, payload, published_at)\nprocessed_events(consumer, event_id, PRIMARY KEY(consumer,event_id))",
    decisions: [
      [
        "Transaction boundary",
        "In one local transaction: reserve the request key, decrement available stock conditionally, insert pending order, and insert an outbox event. Roll back every change on failure.",
      ],
      [
        "Outbox relay",
        "Publish committed outbox rows and mark them afterward. A crash between publishing and marking causes duplicate delivery, so consumers must be idempotent.",
      ],
      [
        "Payment boundary",
        "Use the stable order ID as the provider idempotency key. Persist the provider reference and reconcile unknown results; local deduplication cannot make an external call atomic.",
      ],
      [
        "State transitions",
        "Apply guarded transitions with version checks. A paid event cannot blindly overwrite a canceled order; contradictory events require reconciliation or refund handling.",
      ],
      [
        "Compensation",
        "A definitive decline releases the stock reservation in a transaction. A pending/unknown payment is reconciled before deciding whether to release stock.",
      ],
      [
        "Scaling",
        "Partition processing by order ID for per-order sequencing, keep consumer work bounded, and use a DLQ for investigation. Global message ordering is unnecessary.",
      ],
    ],
    failures: [
      [
        "Client timeout after commit",
        "Retry the same idempotency key; return the stored order ID and response.",
        "Replay rate, key conflicts",
      ],
      [
        "Relay crash after publish",
        "Republish on restart. Consumer deduplication and provider idempotency prevent repeated effects.",
        "Oldest outbox row, redelivery count",
      ],
      [
        "Payment timeout",
        "Leave the order pending; query the provider by stable reference/key and reconcile.",
        "Pending-order age, provider error rate",
      ],
      [
        "Definitive payment decline",
        "Cancel with a guarded transition and restore inventory exactly once in the local transaction.",
        "Decline rate, reservation age",
      ],
      [
        "Poison event / consumer crash",
        "Retry transient errors with backoff and jitter; bound attempts and dead-letter permanent failures.",
        "Queue age, DLQ depth, processing lag",
      ],
    ],
    security:
      "Authenticate customers, enforce order ownership, verify webhook signatures and timestamps, and never store raw card details. Use the provider's hosted/tokenized payment flow, redact logs, and separate access to payment configuration from normal application access.",
    concepts: [
      ["acid", "Commit inventory, order, request key, and outbox together."],
      [
        "idempotency",
        "Replay requests and coordinate external payment retries.",
      ],
      ["queues", "Expect at-least-once delivery and bound retries."],
      ["indexes", "Unique keys enforce request and consumer deduplication."],
      [
        "replication",
        "Read consistency matters when polling immediately after creation.",
      ],
      ["ratelimit", "Bound checkout and provider-facing request pressure."],
      ["state", "Guard transitions between pending, paid, and canceled."],
      ["adapter", "Isolate the provider API behind a payment interface."],
      [
        "solid",
        "Separate order policy, persistence, and provider integration.",
      ],
    ],
    scenarios: [
      flow(
        "Successful payment",
        checkoutNodes,
        [
          [
            0,
            1,
            "Commit inventory reservation, pending order, request key, and outbox in one transaction.",
            "transaction: reserveStock(); insertOrder(); insertOutbox()",
            "order 73 · pending",
          ],
          [
            1,
            2,
            "The relay reads only committed outbox records.",
            "pollUnpublishedOutbox()",
            "payment job ready",
          ],
          [
            2,
            3,
            "A payment worker uses the order ID as the provider key.",
            "charge(order, idempotencyKey=73)",
            "charge approved",
          ],
          [
            3,
            4,
            "A verified result reaches the order consumer.",
            "deliverPaymentResult(eventId)",
            "success received",
          ],
          [
            4,
            1,
            "Deduplicate and update state atomically.",
            "transaction: claimEvent(); pendingToPaid()",
            "order 73 · paid",
          ],
        ],
        "Local atomicity plus reliable messaging coordinates a multi-step process.",
        "Record an order before sending the payment request, then file the receipt.",
      ),
      flow(
        "Duplicate client request",
        checkoutNodes,
        [
          [
            0,
            1,
            "The original request committed before its response was lost.",
            "lookupRequestKey(owner, K)",
            "K → order 73",
          ],
          [
            1,
            0,
            "The retry has the same fingerprint; replay the stored response.",
            "return storedResponse(K)",
            "same order 73",
          ],
          [
            0,
            1,
            "No second order, reservation, or outbox event is created.",
            "assert noNewBusinessEffect",
            "one order only",
          ],
        ],
        "One business intent keeps one identity across retries.",
        "A second copy of a receipt is not a second sale.",
      ),
      flow(
        "Payment declined",
        checkoutNodes,
        [
          [
            0,
            1,
            "Reserve inventory and persist the pending order and outbox.",
            "commitPendingOrder()",
            "stock reserved",
          ],
          [
            1,
            2,
            "Dispatch the committed job.",
            "publishOutbox()",
            "job dispatched",
          ],
          [
            2,
            3,
            "The provider returns a definitive decline, not a timeout.",
            "charge(order, key=73)",
            "declined",
          ],
          [
            3,
            4,
            "Handle a verified failure event.",
            "consumeDecline(eventId)",
            "failure received",
          ],
          [
            4,
            1,
            "Claim the event, cancel pending order, and release stock in one transaction.",
            "transaction: dedupe(); cancel(); releaseStock()",
            "canceled · stock restored",
          ],
        ],
        "Compensation is a new business transaction, not a rollback of the entire network.",
        "If payment is refused, put the reserved item back on the shelf.",
      ),
    ],
  },
};
