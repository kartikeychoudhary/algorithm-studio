"use client";
import { useState } from "react";
import { encodeTrace } from "../../lib/learning/sharing.js";
export default function ShareTrace({ id, input, index }) {
  const [link, setLink] = useState(""),
    [message, setMessage] = useState("");
  async function share() {
    const url = new URL(`/lessons/${id}`, location.origin);
    url.searchParams.set("trace", encodeTrace(id, input, index));
    setLink(url.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage("Link copied with your input and execution step.");
    } catch {
      setMessage("Copy the link below.");
    }
  }
  return (
    <div className="idea-card">
      <button className="button" onClick={share}>
        Share this trace ↗
      </button>
      <p className="small-note">
        The URL contains your example input. Anyone with the link can read it.
      </p>
      {link && (
        <>
          <input aria-label="Shareable trace URL" readOnly value={link} />
          <p role="status">{message}</p>
        </>
      )}
    </div>
  );
}
