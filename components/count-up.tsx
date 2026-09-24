"use client";

import { useEffect, useRef, useState } from "react";

// Animates every number inside a formatted string ("$588,870", "0 / 2,395", "12.5 km")
// from zero to its value, keeping commas, decimals and surrounding text. Skips animation
// when the user prefers reduced motion.
const NUM = /\d[\d,]*(?:\.\d+)?/g;
// Only values that read as numbers ("$588,870", "0 / 2,395"), not labels like "P1-B: Lower".
const NUMERIC = /^[^A-Za-z]*\d/;

function render(text: string, t: number) {
  if (t >= 1) return text;
  return text.replace(NUM, (m) => {
    const decimals = m.includes(".") ? m.split(".")[1].length : 0;
    const value = Number(m.replace(/,/g, "")) * t;
    return value.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: m.includes(",") || value >= 1000 });
  });
}

export function CountUp({ text, duration = 900 }: { text: string; duration?: number }) {
  const [t, setT] = useState(1); // server render and first paint show the real value
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !NUMERIC.test(text) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    started.current = true;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setT(1 - Math.pow(1 - p, 3)); // ease-out cubic
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, duration]);

  return <span className="tabular-nums">{render(text, t)}</span>;
}
