"use client";
import { useEffect, useState } from "react";

/** Owns playback timing; unmounting or replacing a trace always cancels its timer. */
export function usePlayback(run) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(450);
  const last = Math.max(0, run.events.length - 1);
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [run]);
  useEffect(() => {
    if (!playing || index >= last) return;
    const timer = setInterval(
      () => setIndex((i) => Math.min(last, i + 1)),
      speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, last, index, run]);
  useEffect(() => {
    if (index >= last) setPlaying(false);
  }, [index, last]);
  const go = (position) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(last, position)));
  };
  return {
    index: Math.min(index, last),
    playing,
    speed,
    total: last + 1,
    seek: go,
    restart: () => go(0),
    back: () => go(index - 1),
    step: () => go(index + 1),
    finish: () => go(last),
    toggle: () => setPlaying((value) => !value),
    changeSpeed: (value) => setSpeed(Number(value)),
  };
}
