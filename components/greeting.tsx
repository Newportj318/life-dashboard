"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

// "Good morning, Jared" in your own timezone; plain "Home" on the server so markup matches.
export function Greeting({ name }: { name: string }) {
  const text = useSyncExternalStore(
    noop,
    () => {
      const h = new Date().getHours();
      const part = h < 5 ? "evening" : h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
      return `Good ${part}, ${name}`;
    },
    () => "Home"
  );
  return <>{text}</>;
}
