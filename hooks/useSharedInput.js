"use client";
import { useEffect, useState } from "react";
import { useLessonState } from "../components/layout/StudioProvider.jsx";
import { decodeTrace } from "../lib/learning/sharing.js";
export function useSharedInput(id, initial, validate) {
  const [input, save] = useLessonState(id, initial);
  const [start, setStart] = useState(0),
    [shareError, setShareError] = useState("");
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get("trace");
    if (raw)
      try {
        const d = decodeTrace(raw, id);
        save(validate(d.input));
        setStart(d.index);
      } catch {
        setShareError(
          "This shared trace could not be loaded. The default example is available.",
        );
      }
  }, [id]);
  return {
    input,
    start,
    shareError,
    setInput: (p) => {
      setStart(0);
      save(p);
    },
  };
}
