"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1.6,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / (duration * 1000));
      setN(Math.floor(easeOut(p) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
