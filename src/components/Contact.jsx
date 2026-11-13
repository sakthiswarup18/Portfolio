"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CONTACT, SITE } from "@/content/site";

gsap.registerPlugin(ScrollTrigger);

const boxInput =
  "contact-field w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b1a]/60 transition-colors duration-300 text-sm";

const formEndpoint = "/__forms.html";

function emailDraft(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message").replace(/\r\n?|\n/g, "\r\n");
  const body = `From: ${name} (${email})\r\n\r\n${message}`;
  return `mailto:${SITE.email}?subject=Portfolio%20inquiry&body=${encodeURIComponent(body)}`;
}

// Netlify registers the form from public/__forms.html at deploy time.
export default function Contact({ standalone = false }) {
  const ref = useRef(null);
  const submitting = useRef(false);
  const [status, setStatus] = useState("idle");
  const [fallbackHref, setFallbackHref] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;

    const form = e.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setStatus("sending");
    try {
      const res = await fetch(formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (res.ok) {
        form.reset();
        setFallbackHref("");
        setStatus("sent");
        return;
      }
    } catch {
      // Keep the message available if the request fails.
    } finally {
      submitting.current = false;
    }

    setFallbackHref(emailDraft(data));
    setStatus("error");
  };

  const handleInput = (e) => {
    if (status === "error") setFallbackHref(emailDraft(new FormData(e.currentTarget)));
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (standalone) {
        gsap.from(".contact-label", { y: 25, opacity: 0, duration: 0.5, delay: 0.4 });
        gsap.from(".contact-h", { y: 70, opacity: 0, duration: 0.9, ease: "power4.out", delay: 0.6 });
        gsap.from(".contact-field", { y: 35, opacity: 0, stagger: 0.12, duration: 0.65, delay: 0.8 });
        gsap.from(".contact-btn", { y: 20, opacity: 0, duration: 0.5, delay: 1.2 });
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: "top bottom", toggleActions: "play none none none", once: true },
      });
      tl.from(".contact-label", { y: 14, opacity: 0, duration: 0.3, ease: "power3.out" })
        .from(".contact-h", { y: 35, opacity: 0, duration: 0.4, ease: "power4.out" }, 0.05)
        .from(".contact-divider", { scaleY: 0, opacity: 0, duration: 0.5, ease: "power3.out" }, 0.1)
        .from(".contact-field", { y: 25, opacity: 0, stagger: 0.08, duration: 0.35, ease: "power3.out" }, 0.18)
        .from(".contact-btn", { y: 15, opacity: 0, duration: 0.3, ease: "power2.out" }, 0.45);
      setTimeout(() => ScrollTrigger.refresh(), 300);
    }, ref);
    return () => ctx.revert();
  }, [standalone]);

  return (
    <section
      id="contact-section"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center px-10 md:px-20 pt-28 md:pt-24 pb-24"
    >
      <p className="contact-label w-full max-w-[1500px] mx-auto text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-12 font-medium">
        {CONTACT.label}
      </p>

      <div className="flex flex-col md:flex-row items-stretch gap-0 w-full max-w-[1500px] mx-auto min-h-[60vh]">
        {/* LEFT: form */}
        <div className="w-full md:w-[42%] pr-0 md:pr-12">
          <form
            onSubmit={handleSubmit}
            onChange={handleInput}
            name="contact"
            method="post"
            action={formEndpoint}
            className="flex flex-col gap-5"
            aria-label="Contact form"
          >
            <input type="hidden" name="form-name" value="contact" />
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Name</span>
              <input className={boxInput} type="text" name="name" placeholder="Your full name" required autoComplete="name" readOnly={status === "sending"} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Email</span>
              <input className={boxInput} type="email" name="email" placeholder="email@example.com" required autoComplete="email" readOnly={status === "sending"} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Message</span>
              <textarea className={boxInput + " resize-none"} rows={4} name="message" required readOnly={status === "sending"}
                placeholder="The role, the team, or the data problem you're working on…" />
            </label>
            {/* honeypot: hidden from people, tempting to bots */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

            {status === "error" && (
              <p className="text-red-400 text-sm" role="alert">
                That didn’t send. Try again or{" "}
                <a className="underline" href={fallbackHref}>open a prefilled email draft</a>.
              </p>
            )}

            {status === "sent" ? (
              <p className="contact-btn text-[#ff6b1a] text-sm uppercase tracking-widest font-bold" role="status">
                Message submitted. Thanks for reaching out.
              </p>
            ) : (
              <button type="submit" disabled={status === "sending"}
                className="contact-btn w-full font-bold py-4 rounded-full text-sm uppercase tracking-widest transition-colors duration-300 disabled:opacity-60 bg-[#ff6b1a] text-black hover:bg-[#ff8c42]">
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
            )}
          </form>

          <div className="contact-field flex flex-wrap gap-x-8 gap-y-3 mt-10 text-[11px] uppercase tracking-[0.3em] font-medium">
            <a href={`mailto:${SITE.email}`} className="text-white/40 hover:text-[#ff6b1a] transition-colors duration-300">Email ↗</a>
            <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#ff6b1a] transition-colors duration-300">LinkedIn ↗</a>
            <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#ff6b1a] transition-colors duration-300">GitHub ↗</a>
            <a href={SITE.resume} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#ff6b1a] transition-colors duration-300">Résumé ↓</a>
          </div>
        </div>

        <div className="contact-divider hidden md:block w-px self-stretch bg-white/10 mx-8 origin-top" />

        {/* RIGHT: heading pinned bottom-right */}
        <div className="w-full md:w-[58%] pl-0 md:pl-6 mt-16 md:mt-0 flex flex-col justify-end text-right">
          <h2 className="contact-h font-black tracking-tighter leading-[0.88]" style={{ fontSize: "clamp(2.6rem, 5.5vw, 6.5rem)" }}>
            <span className="block text-white">{CONTACT.heading[0]}</span>
            <span className="block text-white">{CONTACT.heading[1]}</span>
            <span className="block ghost-orange">{CONTACT.heading[2]}</span>
          </h2>
          <p className="contact-label mt-6 text-white/35 text-sm font-light leading-relaxed text-right max-w-sm ml-auto">
            {CONTACT.note}
          </p>
        </div>
      </div>
    </section>
  );
}
