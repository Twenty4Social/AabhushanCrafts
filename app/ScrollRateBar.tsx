"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function ScrollRateBar({ children }: { children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    let compact = false;
    const update = () => {
      // Different thresholds prevent flicker when hovering around the trigger.
      const next = window.scrollY > (compact ? 40 : 110);
      if (next !== compact) {
        compact = next;
        shell.dataset.compact = String(compact);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
    };
  }, []);

  return <div ref={shellRef} className="rateBarShell" data-compact="false">{children}</div>;
}
