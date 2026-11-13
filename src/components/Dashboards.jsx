"use client";
import { useEffect, useRef, useState } from "react";
import { DASHBOARDS } from "@/content/site";

// The three dashboards are the original hand-written SVG/JS panels, served
// untouched from /public/dashboards and framed here. The frame reports its
// own height so it sits in the page like any other section (no inner scroll).
export default function Dashboards() {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(2400);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === "dashboards-height" && Number.isFinite(e.data.height)) {
        setHeight(Math.ceil(e.data.height));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <section id="dashboards-section" className="relative w-full pt-40 pb-32">
      <div className="px-10 md:px-20 max-w-5xl mb-14">
        <p className="text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium">{DASHBOARDS.label}</p>
        <h2 className="font-black tracking-tighter text-white leading-[0.88] mb-8" style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}>
          <span className="block">{DASHBOARDS.heading[0]}</span>
          <span className="block ghost">{DASHBOARDS.heading[1]}</span>
        </h2>
        <p className="text-sm md:text-base text-white/50 font-light leading-relaxed max-w-2xl">{DASHBOARDS.intro}</p>
      </div>

      <div
        onMouseEnter={() => document.body.classList.add("cursor-out")}
        onMouseLeave={() => document.body.classList.remove("cursor-out")}
        className="mx-3 md:mx-12 rounded-3xl overflow-hidden border border-white/10 bg-[#0b0b0b]/90 backdrop-blur-md">
        <iframe
          ref={frameRef}
          src="/dashboards/index.html"
          title="Interactive dashboards: hospital operations, data job salaries, crypto forecast"
          loading="lazy"
          scrolling="no"
          className="block w-full border-0"
          style={{ height }}
        />
      </div>
    </section>
  );
}
