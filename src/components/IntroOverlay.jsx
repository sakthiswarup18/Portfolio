"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Full-screen intro video shown when the home page opens.
// Browsers only let a video start by itself when it is muted, so it opens
// silent (the captions are part of the video) with a button for sound.
const SEEN_KEY = "intro-seen";
const SRC = "/videos/intro.mp4?v=2";

export default function IntroOverlay() {
  const videoRef = useRef(null);
  const [open, setOpen] = useState(true);       // in the page at all
  const [leaving, setLeaving] = useState(false); // fading out
  const [muted, setMuted] = useState(true);
  const [needsTap, setNeedsTap] = useState(false); // autoplay was refused

  const close = useCallback(() => {
    setLeaving((already) => {
      if (already) return already;
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
      const v = videoRef.current;
      if (v) v.pause();
      setTimeout(() => setOpen(false), 600);
      return true;
    });
  }, []);

  // Once per browser tab: coming back to the home page doesn't replay it.
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (seen) { setOpen(false); return; }

    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const started = v.play();
    if (started && started.catch) started.catch(() => setNeedsTap(true));
  }, []);

  // Keep the page still underneath while the intro is up; Esc skips.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  const playWithSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      v.currentTime = 0; // start over so the hello isn't missed
      v.muted = false;
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
    setNeedsTap(false);
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };

  const btn =
    "px-5 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors duration-300";

  return (
    <div
      data-lenis-prevent
      role="dialog"
      aria-label="Intro video"
      className={`fixed inset-0 z-[9000] bg-[#07070a] flex items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <video
        ref={videoRef}
        src={SRC}
        poster="/photo/intro-poster.jpg"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={close}
        onError={close}
        className="w-full h-full object-contain"
      />

      {needsTap && (
        <button
          type="button"
          onClick={playWithSound}
          className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-[#ff6b1a] text-black text-3xl font-black flex items-center justify-center hover:bg-white transition-colors duration-300"
          aria-label="Play intro"
        >
          ▶
        </button>
      )}

      <div className="absolute left-0 right-0 bottom-6 md:bottom-auto md:top-6 md:left-auto md:right-8 flex justify-center gap-3 px-4">
        <button type="button" onClick={playWithSound} className={`${btn} bg-[#ff6b1a] text-black hover:bg-white`}>
          {muted ? "Play with sound" : "Mute"}
        </button>
        <button type="button" onClick={close} className={`${btn} border border-white/30 text-white/80 bg-black/40 hover:border-[#ff6b1a] hover:text-[#ff6b1a]`}>
          Skip intro →
        </button>
      </div>
    </div>
  );
}
