"use client";
import Cursor     from "./Cursor";
import Navbar     from "./Navbar";
import useSmoothScroll from "./useSmoothScroll";

export default function PageShell({ children }) {
  useSmoothScroll();

  return (
    <main>
      <div className="grain-overlay" />
      <Cursor />
      <Navbar />
      <div className="relative z-10">{children}</div>
    </main>
  );
}
