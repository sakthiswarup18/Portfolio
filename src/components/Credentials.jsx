"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PUBLICATION, EDUCATION, CERTIFICATES } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

const label = "text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium";

export default function Credentials() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".cred-item").forEach((item) => {
        gsap.from(item, {
          scrollTrigger: { trigger: item, start: "top 90%", toggleActions: "play none none none" },
          y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
        });
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} id="credentials-section" className="relative w-full px-10 md:px-20 pt-32 pb-40">
      <div className="max-w-5xl w-full flex flex-col gap-28">

        {/* Publication */}
        <div className="cred-item">
          <p className={label}>Publication</p>
          <h2 className="font-black tracking-tighter text-white leading-[0.95] mb-6" style={{ fontSize: "clamp(2rem, 4.5vw, 3.75rem)" }}>
            {PUBLICATION.title}
          </h2>
          <p className="text-[10px] text-white/35 tracking-[0.35em] uppercase mb-6">{PUBLICATION.venue}</p>
          <p className="text-sm md:text-base text-white/55 font-light leading-relaxed max-w-3xl">{PUBLICATION.summary}</p>
          <ul className="mt-5 flex flex-col gap-2.5 max-w-3xl">
            {PUBLICATION.points.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-white/45 font-light leading-relaxed">
                <span className="text-[#ff6b1a] shrink-0">—</span>{p}
              </li>
            ))}
          </ul>
          <a href={PUBLICATION.href} target="_blank" rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-[#ff6b1a]/30 text-[#ff6b1a] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#ff6b1a] hover:text-black transition-colors duration-300">
            Read the paper (PDF) →
          </a>
        </div>

        {/* Education */}
        <div>
          <p className={`cred-item ${label}`}>Education</p>
          <div className="flex flex-col">
            {EDUCATION.map((e, i) => (
              <article key={e.degree} className="cred-item group relative flex items-start gap-6 md:gap-8 py-10 border-b border-white/8">
                <div className="pl-3 shrink-0 w-8 pt-1">
                  <span className="font-mono text-[10px] text-white/20 group-hover:text-[#ff6b1a] tracking-widest transition-colors duration-300">0{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/35 tracking-[0.35em] uppercase mb-2">{e.period}</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{e.degree}</h3>
                  <p className="text-[11px] text-[#ff6b1a]/80 tracking-[0.3em] uppercase mt-1 mb-4">{e.school}</p>
                  <p className="text-sm text-white/55 font-light leading-relaxed max-w-3xl">{e.note}</p>
                  {e.coursework.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-5">
                      {e.coursework.map((c) => (
                        <span key={c} className="px-3 py-1.5 border border-white/12 rounded-full text-[10px] text-white/45 tracking-widest uppercase">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div>
          <p className={`cred-item ${label}`}>Certifications ({CERTIFICATES.length})</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CERTIFICATES.map((c) => (
              <a key={c.href} href={c.href} target="_blank" rel="noopener noreferrer"
                className="cred-item block border border-white/10 rounded-xl p-4 bg-black/20 hover:border-[#ff6b1a]/60 transition-colors duration-300">
                <p className="text-sm font-bold text-white/85 leading-snug">{c.title}</p>
                <p className="text-xs text-white/40 font-light mt-1">{c.by}</p>
                <p className="text-[10px] text-[#ff6b1a] tracking-widest uppercase mt-3">PDF ↗</p>
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
