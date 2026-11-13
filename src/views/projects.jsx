"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import gsap from "gsap";
import { CATEGORIES, PROJECTS } from "@/content/site";

const FILTERS = [{ key: "all", label: "All" }, ...CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];

export default function ProjectsPage() {
  const ref = useRef(null);
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("cat");
  const cat = FILTERS.some((f) => f.key === requested) ? requested : "all";
  const [open, setOpen] = useState(null);

  const list = cat === "all" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pp-head", { y: 50, opacity: 0, duration: 0.8, ease: "power4.out", delay: 0.3, stagger: 0.1 });
    }, ref);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".pp-item", { y: 30, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.06 });
    }, ref);
    return () => ctx.revert();
  }, [cat]);

  const pick = (key) => {
    setOpen(null);
    router.replace(key === "all" ? "/projects" : `/projects?cat=${key}`, { scroll: false });
  };

  return (
    <section ref={ref} className="relative w-full min-h-screen px-6 md:px-20 pt-36 pb-32">
      <div className="max-w-5xl w-full mx-auto">
        <p className="pp-head text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium">Selected Work</p>
        <h1 className="pp-head font-black tracking-tighter text-white leading-[0.88] mb-10" style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}>
          Projects<span className="text-[#ff6b1a]">.</span>
        </h1>

        <div className="pp-head flex flex-wrap gap-2 mb-12" role="group" aria-label="Filter projects by area">
          {FILTERS.map((f) => {
            const active = f.key === cat;
            const count = f.key === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.cat === f.key).length;
            return (
              <button key={f.key} type="button" onClick={() => pick(f.key)} aria-pressed={active}
                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium tracking-widest uppercase transition-all duration-300 border ${
                  active ? "bg-[#ff6b1a] text-black border-[#ff6b1a]" : "bg-transparent text-white/45 border-white/10 hover:text-white hover:border-white/30"
                }`}>
                {f.label} <span className={active ? "opacity-60" : "opacity-40"}>{count}</span>
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">{list.length} projects shown</p>

        <div className="flex flex-col">
          {list.map((p, i) => {
            const isOpen = open === p.id;
            return (
              <article key={p.id} className="pp-item group relative flex items-start gap-3 sm:gap-6 md:gap-8 py-10 md:py-12 border-b border-white/8 hover:border-white/20 transition-colors duration-500">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[#ff6b1a] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out" />
                <div className="pl-3 shrink-0 w-8 pt-1">
                  <span className="font-mono text-[10px] text-white/20 group-hover:text-[#ff6b1a] tracking-widest transition-colors duration-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/35 tracking-[0.35em] uppercase mb-2">{p.meta}</p>
                  <h2 className="text-[1.75rem] md:text-[2.125rem] leading-tight font-black text-white tracking-tighter mb-3">{p.title}</h2>
                  <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-3xl">{p.description}</p>

                  <div className="flex gap-2 flex-wrap mt-5">
                    {p.tech.map((t) => (
                      <span key={t} className="px-3 py-1.5 border border-white/12 rounded-full text-sm text-white/65 tracking-wider uppercase">{t}</span>
                    ))}
                  </div>

                  {isOpen && (
                    <ul className="mt-6 flex flex-col gap-2.5 max-w-3xl text-lg md:text-xl leading-relaxed">
                      {p.details.map((d) => (
                        <li key={d} className="flex gap-3 text-white/70">
                          <span className="text-[#ff6b1a] shrink-0">—</span>{d}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6">
                    <a href={p.link.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs md:text-sm text-[#ff6b1a] hover:text-white tracking-widest uppercase font-bold transition-colors duration-200">
                      {p.link.label} ↗
                    </a>
                    <button type="button" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}
                      className="text-xs md:text-sm text-white/35 hover:text-white tracking-widest uppercase transition-colors duration-200">
                      {isOpen ? "Hide details −" : "How it was built +"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
