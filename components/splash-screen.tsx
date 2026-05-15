"use client";

import { useEffect, useState } from "react";

type Phase = "splash" | "fading" | "done";

const FADE_MS = 500;

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("splash");

  const scrollLocked = phase !== "done";

  useEffect(() => {
    if (!scrollLocked) {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
      return;
    }
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.removeProperty("overflow");
      document.body.style.removeProperty("overflow");
    };
  }, [scrollLocked]);

  useEffect(() => {
    if (phase !== "splash") return;
    const t = window.setTimeout(() => setPhase("fading"), 1500);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100000] flex items-center justify-center bg-white transition-opacity ease-out ${
        phase === "fading" ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== "opacity") return;
        if (phase !== "fading") return;
        setPhase("done");
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/doova_master.svg"
        alt="Doova"
        className="mx-auto w-[min(72vw,280px)] select-none"
        draggable={false}
      />
    </div>
  );
}
