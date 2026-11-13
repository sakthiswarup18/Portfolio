"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EXPERIENCE } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  const ref = useRef(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".exp-item").forEach((item) => {
        gsap.from(item, {
          scrollTrigger: { trigger: item, start: "top 90%", toggleActions: "play none none none" },
          y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Page height changes when a role expands — let scroll effects re-measure.
  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 350);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <section ref={ref} id="experience-section" className="relative w-full px-10 md:px-20 pt-40 pb-40">
      <div className="max-w-5xl w-full">
        <p className="text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium">Experience</p>
        <h2 className="font-black tracking-tighter text-white leading-[0.88] mb-16" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
          <span className="block">Where I've</span>
          <span className="block ghost">worked.</span>
        </h2>

        <div className="flex flex-col">
          {EXPERIENCE.map((job) => {
            const isOpen = open === job.num;
            return (
              <article key={job.num} className="exp-item group relative flex items-start gap-6 md:gap-8 py-10 md:py-12 border-b border-white/8 hover:border-white/20 transition-colors duration-500">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[#ff6b1a] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out" />
                <div className="pl-3 shrink-0 w-8 pt-1">
                  <span className="font-mono text-[10px] text-white/20 group-hover:text-[#ff6b1a] tracking-widest transition-colors duration-300">{job.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/35 tracking-[0.35em] uppercase mb-2">
                    {job.period} · {job.place}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{job.company}</h3>
                  <p className="text-[11px] text-[#ff6b1a]/80 tracking-[0.3em] uppercase mt-1 mb-4">{job.role}</p>
                  <p className="text-sm text-white/55 font-light leading-relaxed max-w-3xl">{job.summary}</p>

                  {job.points.length > 0 && (
                    <ul className="mt-5 flex flex-col gap-2.5 max-w-3xl">
                      {job.points.map((p) => (
                        <li key={p} className="flex gap-3 text-sm text-white/45 font-light leading-relaxed">
                          <span className="text-[#ff6b1a] shrink-0">—</span>{p}
                        </li>
                      ))}
                    </ul>
                  )}

                  {isOpen && (
                    <div className="mt-6 max-w-3xl">
                      <ul className="flex flex-col gap-2.5">
                        {job.more.map((p) => (
                          <li key={p} className="flex gap-3 text-sm text-white/40 font-light leading-relaxed">
                            <span className="text-white/25 shrink-0">—</span>{p}
                          </li>
                        ))}
                      </ul>
                      {job.awards && (
                        <div className="mt-8">
                          <p className="text-[10px] text-white/40 tracking-[0.4em] uppercase mb-4">Recognition</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {job.awards.map((a, i) => (
                              <a key={i} href={a.href} target="_blank" rel="noopener noreferrer"
                                className="block border border-white/10 rounded-xl p-4 hover:border-[#ff6b1a]/60 transition-colors duration-300">
                                <p className="text-sm font-bold text-white/85">{a.title}</p>
                                <p className="text-xs text-white/40 font-light leading-relaxed mt-1">{a.note}</p>
                                <p className="text-[10px] text-[#ff6b1a] tracking-widest uppercase mt-3">Certificate ↗</p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : job.num)}
                    aria-expanded={isOpen}
                    className="mt-6 text-[10px] text-white/35 hover:text-[#ff6b1a] tracking-widest uppercase transition-colors duration-200"
                  >
                    {isOpen ? "Show less −" : job.awards ? "More + awards +" : "More from this role +"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
