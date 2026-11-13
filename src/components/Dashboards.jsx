"use client";
import { useEffect, useRef, useState } from "react";
import { DASHBOARDS } from "@/content/site";

// The panels in /public/dashboards report their height so the frame can
// resize with the content and scroll with the page.
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
      <div className="px-10 md:px-20 w-full max-w-[1660px] mx-auto mb-14 grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-x-16 gap-y-8 items-end">
        <div>
        <p className="text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium">{DASHBOARDS.label}</p>
        <h2 className="font-black tracking-tighter text-white leading-[0.88]" style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}>
          <span className="block">{DASHBOARDS.heading[0]}</span>
          <span className="block ghost">{DASHBOARDS.heading[1]}</span>
        </h2>
        </div>
        <p className="text-base md:text-lg text-white/50 font-light leading-relaxed max-w-xl lg:justify-self-end lg:pb-3">{DASHBOARDS.intro}</p>
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
