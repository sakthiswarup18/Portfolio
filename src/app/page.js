"use client";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import dynamic from "next/dynamic";
import Cursor from "../components/Cursor";
import IntroOverlay from "../components/IntroOverlay";
import Navbar from "../components/Navbar";
const VideoScrub = dynamic(() => import("../components/VideoScrub"), { ssr: false });
import Hero from "../components/Hero";
import About from "../components/About";
import Work from "../components/Work";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Experience from "../components/Experience";
import Dashboards from "../components/Dashboards";
import Credentials from "../components/Credentials";
import useSmoothScroll from "../components/useSmoothScroll";

export default function Home() {
  const blurWrapRef = useRef(null);
  const footerRef   = useRef(null);
  useSmoothScroll();

  useEffect(() => {
    const updateBlur = () => {
      if (blurWrapRef.current && footerRef.current) {
        const footerTop = footerRef.current.getBoundingClientRect().top;
        const vh = window.innerHeight;
        // opacity = 1 while footer is below viewport, fades as footer enters
        const opacity = footerTop >= vh ? 1 : Math.max(0, footerTop / vh);
        blurWrapRef.current.style.opacity = opacity;
      }
    };
    window.addEventListener("scroll", updateBlur, { passive: true });
    updateBlur();

    // Sections change height after load (the dashboards frame, expanding
    // roles), so scroll-linked effects re-measure whenever the page resizes.
    let refreshTimer;
    const resize = new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
        updateBlur();
      }, 200);
    });
    resize.observe(document.body);

    return () => {
      resize.disconnect();
      clearTimeout(refreshTimer);
      window.removeEventListener("scroll", updateBlur);
    };
  }, []);

  return (
    <main>
      {/* grain */}
      <div className="grain-overlay" />

      {/* intro video — covers the page on first load, then fades into it */}
      <IntroOverlay />

      {/* difference cursor */}
      <Cursor />

      {/* sticky scrubbed video — lives behind everything */}
      <VideoScrub />

      {/* scroll progress indicator */}

      {/* fixed nav */}
      <Navbar />

      {/* bottom blur — fixed to viewport, fades when footer arrives */}
      <div ref={blurWrapRef} className="bottom-blur" />

      {/* scrollable sections */}
      <div className="relative z-10">
        <Hero />
        <About />
        <Experience />
        <Dashboards />
        <Work />
        <Credentials />
        <Contact />
        <div ref={footerRef}><Footer /></div>
      </div>
    </main>
  );
}
