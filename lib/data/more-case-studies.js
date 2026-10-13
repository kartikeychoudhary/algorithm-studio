import { sequence } from "./spring-lessons.js";
const study = (
  label,
  topic,
  brief,
  workloadLabel,
  requirements,
  apis,
  schema,
  decisions,
  failures,
  concepts,
  scenarios,
) => ({
  kind: "case-study",
  section: "Case Studies",
  tag: "SYSTEM DESIGN CASE STUDY",
  label,
  title: `Design ${label.toLowerCase()}.`,
  topic,
  subtitle: brief,
  brief,
  workloadLabel,
  requirements,
  apis,
  schema,
  decisions,
  failures,
  concepts,
  scenarios,
  security:
    "Use TLS, authenticate callers, enforce ownership at every resource boundary, apply quotas, and redact sensitive payloads from logs. Authorize both the initial operation and subsequent reads; opaque identifiers are not access control.",
});
export const moreCaseStudies = {
  chat: study(
    "A chat application",
    "Real-time systems",
    "Persist messages, deliver them to online recipients, and recover gaps after reconnects. Scope: one-to-one text chat with eventual device synchronization.",
    "Messages",
    [
      "Acknowledge a send after durable acceptance. Target p95 online delivery under 300 ms in one region (an illustrative objective).",
      "Preserve per-conversation order with a sequence assigned by its owning partition; no global order is promised.",
      "Reconnect from the last received sequence; duplicates can arrive and must be deduplicated by message ID.",
      "Presence is approximate and expires by heartbeat TTL. Offline delivery must not depend on presence being accurate.",
    ],
    [
      [
        "POST /conversations/:id/messages",
        "{clientMessageId,text}; return persisted message ID and sequence. Retry with the same client ID.",
      ],
      [
        "WS /events",
        "Authenticated connection; server pushes events. Reauthorize conversation subscriptions.",
      ],
      [
        "GET /conversations/:id/messages?after=seq",
        "Fetch missing history with keyset pagination.",
      ],
    ],
    "messages(conversation_id, seq, message_id, sender_id, client_message_id, body, UNIQUE(conversation_id,seq), UNIQUE(sender_id,client_message_id))\nreceipts(user_id, conversation_id, last_read_seq)\npresence(user_id, connection_id, expires_at)",
    [
      [
        "Connection gateway",
        "Keep long-lived sockets on horizontally scaled gateways. A connection directory locates online devices; it is ephemeral.",
      ],
      [
        "Durable acceptance",
        "Append the message and an outbox event atomically. Assign ordering within the conversation partition.",
      ],
      [
        "Delivery",
        "Consume at least once, route to recipient gateways, and accept client acknowledgments. Offline clients replay from durable history.",
      ],
      [
        "Hot conversations",
        "A single conversation owner simplifies ordering but caps throughput. Batch and shard other conversations; group-chat fan-out is a separate extension.",
      ],
      [
        "Capacity",
        "Estimate concurrent connections from active users, not message rate alone. At 100,000 connections and an assumed 32 KiB connection footprint, connection state alone is about 3.3 GB before overhead.",
      ],
    ],
    [
      [
        "Socket disconnect",
        "Reconnect with exponential backoff and fetch after the last confirmed sequence.",
        "Reconnect rate, missing-sequence count",
      ],
      [
        "Delivery duplicated",
        "Use stable IDs at storage and clients; update receipts monotonically.",
        "Dedup hits, delivery lag",
      ],
      [
        "Partition unavailable",
        "Stop acknowledging new durable writes for that partition; recover/fail over with explicit data-loss policy.",
        "Partition errors, replication lag",
      ],
    ],
    [
      ["queues", "Separate durable acceptance from online delivery."],
      ["idempotency", "Deduplicate repeated client sends."],
      ["sharding", "Own ordering per conversation partition."],
      ["replication", "Keep durable history replicated."],
      ["networking", "Manage connection establishment and reuse."],
      ["reliability", "Reconnect and recover without retry storms."],
    ],
    [
      sequence(
        "Send and deliver",
        ["Sender", "Gateway", "Message store", "Delivery queue", "Recipient"],
        [
          [
            0,
            1,
            "Send a stable client message ID on an authenticated connection.",
            "send(clientId,text)",
            "accepted for processing",
          ],
          [
            1,
            2,
            "Commit message, conversation sequence, and outbox.",
            "transaction: insert message + outbox",
            "durable seq 81",
          ],
          [
            2,
            0,
            "Acknowledge durable acceptance, not recipient delivery.",
            "ACK messageId, seq=81",
            "send accepted",
          ],
          [
            2,
            3,
            "Relay the committed event; retries may duplicate it.",
            "publish outbox",
            "event available",
          ],
          [
            3,
            4,
            "Route to an online recipient device and deduplicate by message ID.",
            "deliver(messageId,81)",
            "displayed",
          ],
          [
            4,
            2,
            "Advance the receipt when the recipient acknowledges.",
            "last_received = max(last_received,81)",
            "receipt saved",
          ],
        ],
        "A send acknowledgment and a delivery receipt are different events.",
      ),
      sequence(
        "Reconnect after a gap",
        ["Recipient", "Gateway", "Message store"],
        [
          [
            0,
            1,
            "Reconnect with last received sequence 79.",
            "resume(after=79)",
            "resume requested",
          ],
          [
            1,
            2,
            "Read persisted messages after the cursor.",
            "SELECT seq > 79 ORDER BY seq",
            "80,81 returned",
          ],
          [
            2,
            0,
            "Deduplicate, display in sequence order, and advance the cursor.",
            "mergeById(); cursor=81",
            "caught up",
          ],
        ],
        "Durable history repairs gaps that transient sockets cannot prevent.",
      ),
    ],
  ),
  feed: study(
    "A news feed",
    "Read-heavy systems",
    "Combine fan-out on write for ordinary authors with fan-out on read for very large audiences. Scope: chronological following feed.",
    "Feed reads",
    [
      "Support publishing posts, following authors, and fetching a cursor-paginated home feed.",
      "Target p95 feed reads below 250 ms in the serving region; propagation may lag seconds.",
      "A user must never gain access to private posts merely because an ID exists in a cached feed.",
      "Deletes and privacy changes must invalidate or filter cached candidates before rendering.",
    ],
    [
      [
        "POST /posts",
        "{clientId,body,visibility}; store an immutable post ID.",
      ],
      ["POST /follows", "{authorId}; authorize and rate-limit follow changes."],
      [
        "GET /feed?cursor=...",
        "Return a stable (createdAt,id) cursor plus visible posts; avoid offset paging.",
      ],
    ],
    "posts(id, author_id, created_at, visibility, body)\nfollows(follower_id, author_id)\nfeed_entries(user_id, created_at, post_id)\nfanout_jobs(post_id, cursor, status)",
    [
      [
        "Hybrid fan-out",
        "Push IDs into follower inboxes for ordinary authors; merge recent celebrity posts at read time.",
      ],
      [
        "Ranking boundary",
        "Start chronological. A ranking service adds model versions, candidate retrieval, and observability beyond this example.",
      ],
      [
        "Storage and cache",
        "Store post bodies once, cache hot bodies, and keep feed entries as IDs. Batch hydration avoids one query per post.",
      ],
      [
        "Pagination",
        "Use a stable compound cursor and define behavior when new posts arrive between pages.",
      ],
      [
        "Capacity",
        "Fan-out writes per second ≈ ordinary posts/s × average followers. At 100 posts/s and 200 followers, that is 20,000 inbox insertions/s before retries.",
      ],
    ],
    [
      [
        "Celebrity publishes",
        "Avoid a massive synchronous push; fetch and merge that author on read.",
        "Fan-out amplification, read merge cost",
      ],
      [
        "Fan-out worker stops",
        "Durable jobs resume from checkpoints and deduplicate (user,post) entries.",
        "Queue age, oldest missing post",
      ],
      [
        "Private/deleted content cached",
        "Recheck access and deletion state before serving a body.",
        "Revocation delay, authorization failures",
      ],
    ],
    [
      ["queues", "Spread fan-out over asynchronous workers."],
      ["caching", "Cache bodies and feed candidates."],
      ["indexes", "Seek compound pagination cursors."],
      ["sharding", "Partition inbox entries by reader."],
      ["idempotency", "Repeated fan-out jobs do not duplicate entries."],
    ],
    [
      sequence(
        "Publish and fan out",
        ["Author", "Post store", "Fan-out queue", "Inbox store", "Reader"],
        [
          [
            0,
            1,
            "Persist a post and durable fan-out intent.",
            "save post + outbox",
            "post committed",
          ],
          [1, 2, "Publish the fan-out task.", "enqueue(postId)", "queued"],
          [
            2,
            3,
            "Insert post IDs into ordinary followers’ inboxes.",
            "upsert(userId,postId)",
            "inboxes updated",
          ],
          [
            4,
            3,
            "Read candidate IDs after a compound cursor.",
            "read inbox(cursor)",
            "candidates",
          ],
          [
            3,
            1,
            "Batch-load visible, nondeleted posts.",
            "hydrate + authorize",
            "visible posts",
          ],
          [
            1,
            4,
            "Return chronological posts and the next cursor.",
            "200 feed + cursor",
            "page delivered",
          ],
        ],
        "Separate cheap feed-ID storage from post-body hydration.",
      ),
      sequence(
        "Celebrity read merge",
        ["Reader", "Inbox store", "Celebrity posts", "Merge service"],
        [
          [
            0,
            1,
            "Read precomputed ordinary-author candidates.",
            "read inbox",
            "ordinary candidates",
          ],
          [
            0,
            2,
            "Read recent posts for followed high-fan-out authors.",
            "read celebrity timelines",
            "celebrity candidates",
          ],
          [
            1,
            3,
            "Merge streams and deduplicate by post ID.",
            "merge by (createdAt,id)",
            "merged",
          ],
          [
            3,
            0,
            "Filter visibility and return a stable page cursor.",
            "authorize; paginate",
            "feed page",
          ],
        ],
        "The hybrid design moves expensive celebrity fan-out to bounded read-time work.",
      ),
    ],
  ),
  storage: study(
    "A file storage service",
    "Data-intensive systems",
    "Upload large files in parts, finalize metadata safely, and download through short-lived authorization. Scope: user-owned files.",
    "Metadata requests",
    [
      "Support resumable multipart uploads, checksums, ownership, download, and deletion.",
      "File bytes go directly to object storage; API servers handle metadata and authorization.",
      "Incomplete uploads expire and are cleaned up. Only completed, verified objects become downloadable.",
      "Targets depend on object size; measure metadata latency separately from byte throughput.",
    ],
    [
      [
        "POST /uploads",
        "{name,size,checksum}; authorize quota and return upload ID plus scoped part URLs.",
      ],
      [
        "POST /uploads/:id/complete",
        "Verify owner and expected parts/checksums, finalize object, then mark metadata ready.",
      ],
      [
        "GET /files/:id/download",
        "Authorize ownership; issue short-lived signed access or stream through an authorized gateway.",
      ],
    ],
    "files(id, owner_id, object_key, size, checksum, state, version)\nuploads(id, file_id, provider_upload_id, expires_at, status)\nparts(upload_id, part_number, checksum, etag)",
    [
      [
        "Data plane",
        "Object storage handles byte transfer while stateless APIs issue narrowly scoped temporary capabilities.",
      ],
      [
        "Completion",
        "Object finalization and metadata commit are separate operations. Reconcile an object completed before an API crash.",
      ],
      [
        "Distribution",
        "A CDN caches permitted content near readers. Define how private content and signed access interact with cache keys.",
      ],
      [
        "Cleanup",
        "Lifecycle policies and reconciliation remove abandoned parts and orphaned objects; deletion may be asynchronous.",
      ],
      [
        "Capacity",
        "At an illustrative 10,000 uploads/day × 20 MB, raw growth is 200 GB/day before replication, versions, and retention. Egress can dominate stored-byte cost.",
      ],
    ],
    [
      [
        "Part upload interrupted",
        "Retry just that part under its upload ID; verify checksums.",
        "Part failures, incomplete bytes",
      ],
      [
        "Crash after object completion",
        "Reconcile storage state with the metadata record; retry finalization idempotently.",
        "Stuck pending files, orphan objects",
      ],
      [
        "Signed URL disclosed",
        "Scope capabilities narrowly and keep expiry short; assess revocation requirements.",
        "Unusual downloads, expired signature errors",
      ],
    ],
    [
      ["idempotency", "Make upload creation and completion safe to retry."],
      ["indexes", "Look up user-owned metadata efficiently."],
      ["queues", "Run scanning, thumbnails, and cleanup asynchronously."],
      ["networking", "Separate API requests from large byte transfers."],
      [
        "replication",
        "Define object durability and metadata recovery together.",
      ],
    ],
    [
      sequence(
        "Multipart upload",
        ["Client", "Metadata API", "Object storage", "Metadata DB", "Scanner"],
        [
          [
            0,
            1,
            "Request an upload for a bounded file size.",
            "POST /uploads",
            "authorized",
          ],
          [
            1,
            3,
            "Reserve quota and create pending metadata.",
            "insert pending upload",
            "pending",
          ],
          [
            1,
            0,
            "Return upload ID and scoped part URLs.",
            "signed part URLs",
            "upload capability",
          ],
          [
            0,
            2,
            "Upload independently retryable parts and verify checksums.",
            "PUT part 1..N",
            "parts stored",
          ],
          [
            0,
            1,
            "Ask to complete the upload.",
            "POST complete(parts)",
            "finalization requested",
          ],
          [
            1,
            2,
            "Finalize the object from the validated part list.",
            "complete multipart upload",
            "object assembled",
          ],
          [
            1,
            3,
            "Mark uploaded; scanning policy decides when ready.",
            "state=uploaded",
            "scan pending",
          ],
          [
            2,
            4,
            "Scan content and process derivative files.",
            "scan object",
            "scan passed",
          ],
          [
            4,
            3,
            "Publish a ready state after the policy succeeds.",
            "state=ready",
            "download permitted",
          ],
        ],
        "Upload completion is a workflow with reconciliation, not a cross-service atomic transaction.",
      ),
      sequence(
        "Authorized download",
        ["Client", "Metadata API", "Object storage / CDN"],
        [
          [
            0,
            1,
            "Request access to a ready file.",
            "GET /files/id/download",
            "authorization checked",
          ],
          [
            1,
            0,
            "Issue an expiring capability for this specific object.",
            "return signed URL",
            "temporary access",
          ],
          [
            0,
            2,
            "Download bytes directly while the signature is valid.",
            "GET signed URL",
            "bytes delivered",
          ],
        ],
        "A signed URL grants possession-based access until expiry or another enforced revocation mechanism.",
      ),
    ],
  ),
  scheduler: study(
    "A distributed job scheduler",
    "Reliable workflows",
    "Schedule work, lease it to workers, survive crashes, and prevent stale owners from corrupting state. Scope: durable background jobs.",
    "Job submissions",
    [
      "Persist immediate or future jobs and expose status; accept at-least-once attempts.",
      "Lease work to workers for a bounded time with heartbeat renewal.",
      "Retry transient failures with backoff and a maximum attempt count; quarantine poison jobs.",
      "External side effects require idempotency; a lease alone cannot promise exactly-once effects.",
    ],
    [
      [
        "POST /jobs",
        "{clientKey,type,payload,runAt}; return a durable job ID.",
      ],
      [
        "GET /jobs/:id",
        "Return pending, running, succeeded, failed, or dead-letter status.",
      ],
      [
        "POST /jobs/:id/cancel",
        "Best-effort cancellation; already executed external effects require compensation.",
      ],
    ],
    "jobs(id, client_key UNIQUE, run_at, state, attempt, lease_owner, lease_until, fencing_token, payload_ref)\nattempts(job_id, attempt, started_at, ended_at, error)\ndead_letters(job_id, reason, payload_ref)",
    [
      [
        "Claiming",
        "Claim ready jobs atomically, such as a guarded update or database locking. Use database time for lease comparisons.",
      ],
      [
        "Lease and fencing",
        "Increment a fencing token on each ownership change. Guard completion writes by that token so a stale worker cannot overwrite the new owner.",
      ],
      [
        "Retry policy",
        "Classify failures, exponentially delay transient retries with jitter, and cap attempts. Permanent errors go to a dead-letter workflow.",
      ],
      [
        "Ordering",
        "Partition only where order matters. A single global queue can create head-of-line blocking.",
      ],
      [
        "Capacity",
        "Required concurrency ≈ jobs/s × mean service seconds. At 50 jobs/s and 2 s average execution, 100 busy workers are needed before headroom.",
      ],
    ],
    [
      [
        "Worker dies",
        "Lease expires and another worker reclaims; effects may be retried.",
        "Expired leases, oldest job age",
      ],
      [
        "Old worker wakes up",
        "Reject status writes with an old fencing token; external effects still need idempotency.",
        "Stale completion rejection",
      ],
      [
        "Poison payload",
        "Stop retrying after the configured limit and retain diagnostic context in a DLQ.",
        "DLQ depth, attempt count",
      ],
    ],
    [
      ["queues", "Bound pending work and monitor job age."],
      ["idempotency", "Deduplicate submissions and external effects."],
      [
        "concurrency",
        "Atomic claiming prevents simultaneous owners within a lease.",
      ],
      [
        "reliability",
        "Backoff and backpressure protect workers and dependencies.",
      ],
      ["indexes", "Index ready jobs by state and run time."],
    ],
    [
      sequence(
        "Lease and execute",
        ["Client", "Job store", "Scheduler", "Worker", "External service"],
        [
          [
            0,
            1,
            "Submit a job with a stable client key.",
            "insert job if absent",
            "pending",
          ],
          [
            2,
            1,
            "Atomically claim a due job and advance its token.",
            "claim lease; token=7",
            "leased",
          ],
          [
            1,
            3,
            "Deliver job ID, payload, and fencing token.",
            "execute(job,7)",
            "running",
          ],
          [
            3,
            4,
            "Perform the external effect with a stable idempotency key.",
            "call(key=jobId)",
            "effect recorded",
          ],
          [
            3,
            1,
            "Complete only if token 7 is still the owner.",
            "UPDATE ... WHERE token=7",
            "succeeded",
          ],
        ],
        "The lease coordinates ownership; idempotency protects business effects.",
      ),
      sequence(
        "Lease expires",
        ["Old worker", "Job store", "New worker"],
        [
          [
            0,
            1,
            "The worker stops renewing its lease.",
            "lease expires",
            "reclaimable",
          ],
          [
            2,
            1,
            "A new owner claims with token 8.",
            "claim token=8",
            "new owner",
          ],
          [
            0,
            1,
            "The old worker resumes and tries to complete token 7.",
            "complete WHERE token=7",
            "rejected",
          ],
          [
            2,
            1,
            "The new owner completes with its current token.",
            "complete WHERE token=8",
            "succeeded",
          ],
        ],
        "Every protected storage write must enforce the fencing token.",
      ),
    ],
  ),
};
