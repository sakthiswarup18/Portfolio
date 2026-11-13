"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "./BlurText";
import { HERO, STATS, SITE } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-label", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.4 });
      gsap.from(".hero-line",  { y: 90, opacity: 0, stagger: 0.1, duration: 1.1, ease: "power4.out", delay: 0.6 });
      
      // Premium staggered letter effect for the main name
      gsap.from(".hero-letter", { 
        y: 100, 
        opacity: 0, 
        rotateX: -40,
        stagger: 0.06, 
        duration: 1.2, 
        ease: "power4.out", 
        delay: 0.7 
      });

      gsap.from(".hero-sub",   { y: 30, opacity: 0, duration: 0.9, ease: "power3.out", delay: 1.4 });
      gsap.from(".hero-photo", { x: 60, opacity: 0, duration: 1.6, ease: "power3.out", delay: 0.9 });

      gsap.to(ref.current, {
        scrollTrigger: {
          trigger: ref.current,
          start: "bottom 60%",
          end:   "bottom 10%",
          scrub: 1.2,
        },
        opacity: 0,
        y: -50,
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-[135vh] flex flex-col justify-center px-10 md:px-24 overflow-hidden"
    >
      {/* Feather the portrait into the background video. */}
      <div className="hero-photo pointer-events-none absolute z-0 right-[-18%] sm:right-[-6%] lg:right-[3%] xl:right-[7%] top-[9vh] w-[min(90vw,68vh)] sm:w-[min(56vw,68vh)] lg:w-[min(44vw,68vh)] opacity-40 lg:opacity-100" aria-hidden="true">
        <div className="hero-photo-glow" />
        <img
          src="/photo/sakthi-portrait-card.jpg"
          alt=""
          width={760}
          height={1055}
          className="hero-photo-img relative w-full select-none"
          draggable="false"
        />
      </div>

      <div className="relative z-10 max-w-5xl">
        <p className="hero-label text-[10px] md:text-xs text-[#ff6b1a] tracking-[0.2em] uppercase font-bold mb-6">
          {HERO.label}
        </p>

        <h1 className="font-black tracking-tighter leading-[0.75] mb-12 flex flex-col relative z-10 hero-clamp-text">
          <span className="hero-line block ghost z-0">{HERO.greeting}</span>
          <span className="block text-white -mt-2 md:-mt-6 z-10 hero-perspective">
            {HERO.name.split("").map((char, index) => (
              <span key={index} className="hero-letter inline-block">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        </h1>

        <div className="max-w-xl hero-sub flex flex-col gap-6">
          <BlurText
            text={HERO.lines[0]}
            delay={30}
            animateBy="words"
            direction="bottom"
            stepDuration={0.22}
            className="text-base md:text-[17px] text-white/60 font-medium leading-[1.6]"
          />
          <BlurText
            text={HERO.lines[1]}
            delay={22}
            animateBy="words"
            direction="bottom"
            stepDuration={0.2}
            className="text-xs md:text-sm text-white/40 font-light leading-relaxed"
          />

          <div className="flex flex-wrap gap-3 mt-2">
            <a
              href={SITE.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#ff6b1a] text-black text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors duration-300"
            >
              Download Résumé
            </a>
            <a
              href="/videos/intro.mp4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-white/20 text-white/70 text-[11px] font-bold uppercase tracking-widest rounded-full hover:border-[#ff6b1a] hover:text-[#ff6b1a] transition-colors duration-300"
            >
              Watch Intro ▶
            </a>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5 mt-6 max-w-xl">
            {STATS.map((s) => (
              <div key={s.label}>
                <dd className="text-2xl md:text-3xl font-black tracking-tighter text-white">{s.value}</dd>
                <dt className="text-[9px] text-white/40 tracking-[0.25em] uppercase mt-1 leading-snug">{s.label}</dt>
              </div>
            ))}
          </dl>

          <p className="mt-8 text-[10px] text-white/40 tracking-[0.4em] uppercase font-medium">
            Explore ↓
          </p>
        </div>
      </div>

    </section>
  );
}
