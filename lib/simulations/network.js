import { trace, node, bars, bounded, choice, flow } from "./trace.js";
export function tcp(p) {
  const packets = bounded(p.packets, 3, 8, "packets"),
    drop = bounded(p.drop, 0, packets, "drop"),
    r = trace(),
    received = new Set();
  let ack = 0,
    transmissions = 0;
  const send = (i, retry = false) => {
    transmissions++;
    const lost = !retry && i + 1 === drop;
    if (!lost) received.add(i);
    while (received.has(ack)) ack++;
    r.step(
      retry
        ? "timeout → retransmit missing segment"
        : "send segment; receiver returns cumulative ACK",
      `Segment ${i + 1} carries bytes ${i * 100}–${i * 100 + 99}: ${lost ? "dropped" : retry ? "retransmitted successfully" : "received"}. ACK ${ack * 100} is the next expected byte.`,
      {
        nodes: [
          node("Sender", `sent ${transmissions}`),
          node(
            "Network",
            lost ? "loss" : "delivered",
            lost ? "error" : "active",
          ),
          node("Receiver", `ACK ${ack * 100}`),
        ],
        links: lost
          ? [[0, 1]]
          : [
              [0, 1],
              [1, 2],
            ],
        columns: ["Segment", "Received", "Delivery"],
        rows: Array.from({ length: packets }, (_, j) => [
          j + 1,
          received.has(j) ? "yes" : "no",
          j < ack ? "in-order bytes delivered" : "waiting",
        ]),
        metrics: { Transmissions: transmissions, "ACK byte": ack * 100 },
      },
    );
  };
  r.step(
    "assume an established TCP connection",
    "Data sequence numbers start at 0 in this model; SYN negotiation, congestion and real retransmission timers are omitted.",
    {
      nodes: [node("Sender", "connected"), node("Receiver", "connected")],
      links: [[0, 1]],
    },
  );
  for (let i = 0; i < packets; i++) send(i);
  if (drop) send(drop - 1, true);
  return r.finish({ ack: ack * 100, transmissions });
}
export function congestion(p) {
  const rounds = bounded(p.rounds, 3, 10, "rounds"),
    loss = bounded(p.lossRound, 0, rounds, "lossRound"),
    r = trace(),
    history = [];
  let cwnd = 1,
    threshold = 8;
  for (let round = 1; round <= rounds; round++) {
    const sent = cwnd;
    if (round === loss) {
      threshold = Math.max(2, Math.floor(cwnd / 2));
      cwnd = 1;
    } else cwnd = cwnd < threshold ? Math.min(threshold, cwnd * 2) : cwnd + 1;
    history.push(cwnd);
    r.step(
      round === loss
        ? "timeout: ssthresh=max(2,flight/2); cwnd=1"
        : "ACK round: slow start or additive increase",
      `RTT ${round}: sent up to ${sent} segment(s). ${round === loss ? "Timeout reduces the window." : cwnd <= threshold ? "Slow start grows toward the threshold." : "Congestion avoidance grows by about one segment per RTT."}`,
      {
        bars: bars(
          history,
          history.map((_, i) => `RTT ${i + 1}`),
        ),
        metrics: { cwnd, "Slow-start threshold": threshold, RTT: round },
      },
    );
  }
  return r.finish({ cwnd, threshold, history });
}
export function httpCache(p) {
  const age = bounded(p.age, 0, 10, "age"),
    changed = choice(p.origin, ["same", "changed"], "origin") === "changed";
  const fresh = age < 3;
  return flow(
    ["Browser cache", "Origin", "Application"],
    [
      [
        1,
        0,
        "200 OK; Cache-Control:max-age=3; ETag:v1",
        "Store a cacheable public representation with a validator.",
        "v1; age 0",
      ],
      [
        2,
        0,
        "GET resource",
        `Request at age ${age}s. The freshness lifetime is 3 seconds.`,
        fresh ? "fresh" : "stale",
      ],
      ...(fresh
        ? [
            [
              0,
              2,
              "reuse fresh cached response",
              "Serve the stored body without contacting the origin.",
              "cached v1",
            ],
          ]
        : [
            [
              0,
              1,
              "GET; If-None-Match:v1",
              "A stale representation can be revalidated; no-cache would require validation even while fresh.",
              "compare ETag",
            ],
            [
              1,
              0,
              changed ? "200 + new body + ETag:v2" : "304 Not Modified",
              changed
                ? "The representation changed; replace the cached body."
                : "The representation is unchanged; update freshness metadata and reuse the cached body.",
              changed ? "v2 cached" : "v1 revalidated",
            ],
            [
              0,
              2,
              "return usable representation",
              changed
                ? "A 200 response replaces the cached body and validator with the new representation."
                : "A 304 response has no replacement representation body; the cache supplies its existing body.",
              changed ? "body v2" : "body v1",
            ],
          ]),
    ],
    { networkRequests: fresh ? 0 : 1, version: !fresh && changed ? 2 : 1 },
  );
}
export function sessions(p) {
  const expired =
    choice(p.session, ["valid", "expired"], "session") === "expired";
  return flow(
    ["Browser", "Server", "Session store"],
    [
      [
        0,
        1,
        "POST login over HTTPS",
        "The server verifies credentials. This diagram uses fictional state and sends no network requests.",
        "authenticated",
      ],
      [
        1,
        2,
        "create unpredictable session ID",
        "Store user identity and expiry server-side. The browser receives an opaque identifier, not the whole session.",
        "sid→user42",
      ],
      [
        1,
        0,
        "Set-Cookie: sid; Secure; HttpOnly; SameSite=Lax",
        "Secure restricts sending to HTTPS; HttpOnly prevents script access to this cookie. SameSite is one layer of CSRF defense.",
        "cookie stored",
      ],
      [
        0,
        1,
        "GET account; Cookie:sid",
        "The browser attaches an eligible cookie. Possessing a cookie does not itself prove the server session is still valid.",
        "lookup required",
      ],
      [
        1,
        2,
        "validate session and expiry",
        expired
          ? "The session expired or was revoked."
          : "The session maps to an authenticated user. ",
        expired ? "invalid" : "user42",
      ],
      [
        2,
        1,
        expired ? "reject 401" : "authorize requested resource",
        expired
          ? "Ask the client to authenticate again."
          : "Authentication identifies the user; authorization separately checks account access.",
        expired ? "401" : "authorized response",
      ],
    ],
    { authenticated: !expired },
  );
}
export function oauth(p) {
  const mismatch =
    choice(p.callback, ["valid", "wrong-state"], "callback") === "wrong-state";
  return flow(
    ["Browser", "Client app", "Identity provider", "API"],
    [
      [
        1,
        0,
        "create state, nonce, PKCE verifier/challenge",
        "Bind this authorization request to the browser session and keep the verifier secret.",
        "request prepared",
      ],
      [
        0,
        2,
        "authorize(code_challenge, state, nonce)",
        "The identity provider authenticates the user and handles requested consent. OAuth delegates access; OIDC adds an identity layer.",
        "authorization code",
      ],
      [
        2,
        1,
        "redirect(code, state)",
        "The callback contains an authorization code, not the user password.",
        mismatch ? "wrong state" : "matching state",
      ],
      ...(mismatch
        ? [
            [
              1,
              0,
              "reject mismatched state",
              "Stop: the callback is not bound to the expected authorization request.",
              "callback rejected",
            ],
          ]
        : [
            [
              1,
              2,
              "exchange code + PKCE verifier",
              "The token endpoint validates the code, redirect binding, verifier, and client authentication where applicable.",
              "tokens returned",
            ],
            [
              2,
              1,
              "validate ID token signature, issuer, audience, expiry, nonce",
              "Use a validated OIDC ID token for the client’s login session; an access token is intended for the resource server.",
              "identity established",
            ],
            [
              1,
              3,
              "Bearer access_token",
              "The API validates the access token and permissions; do not substitute the ID token for API authorization.",
              "authorized API call",
            ],
          ]),
    ],
    { authorized: !mismatch },
  );
}
export function cors(p) {
  const allow =
    choice(p.policy, ["allow-origin", "deny-origin"], "policy") ===
    "allow-origin";
  return flow(
    ["Page: app.example", "Browser", "API: api.example"],
    [
      [
        0,
        1,
        "fetch with custom header + credentials",
        "This cross-origin request needs a preflight because it uses a non-safelisted header.",
        "preflight required",
      ],
      [
        1,
        2,
        "OPTIONS: Origin + requested method/headers",
        "The browser asks whether the actual request is permitted.",
        "check CORS policy",
      ],
      [
        2,
        1,
        allow
          ? "allow exact origin, headers, method; credentials=true"
          : "omit matching allow-origin",
        allow
          ? "For credentialed reads, use the explicit allowed origin and allow credentials; wildcard is insufficient."
          : "The response does not grant the requesting origin permission.",
        allow ? "preflight accepted" : "preflight rejected",
      ],
      ...(allow
        ? [
            [
              1,
              2,
              "send actual request",
              "The actual request still needs server authentication and authorization.",
              "actual request handled",
            ],
            [
              2,
              0,
              "expose allowed response to JavaScript",
              "The browser exposes the response because CORS permits it.",
              "response readable",
            ],
          ]
        : [
            [
              1,
              0,
              "block actual preflighted request",
              "This preflighted example stops before the actual request. Some simple cross-origin requests can still be sent; CORS is not general CSRF protection.",
              "CORS error",
            ],
          ]),
    ],
    { sent: allow, readable: allow },
  );
}
export function csrf(p) {
  const protection = choice(p.protection, ["token", "none"], "protection");
  return flow(
    ["Untrusted page", "Victim browser", "Application server"],
    [
      [
        0,
        1,
        "submit a cross-site form",
        "A malicious page attempts to trigger a state-changing operation in the user’s browser. This is a local fictional walkthrough.",
        "form submission",
      ],
      [
        1,
        2,
        "POST with eligible session cookie",
        "Assume cookie policy allows this request, so authentication alone does not establish user intent. SameSite can block some such requests but is not modeled here.",
        "authenticated request",
      ],
      [
        2,
        2,
        "check request-bound CSRF token",
        protection === "token"
          ? "The form lacks the required unpredictable token; reject before changing state."
          : "The server checks only the session and incorrectly treats this cross-site operation as intended.",
        protection === "token" ? "403; unchanged" : "state changed",
      ],
    ],
    { changed: protection === "none" },
  );
}
export const networkModels = {
  "web-tcp": tcp,
  "web-congestion": congestion,
  "web-cache": httpCache,
  "web-sessions": sessions,
  "web-oauth": oauth,
  "web-cors": cors,
  "web-csrf": csrf,
};
