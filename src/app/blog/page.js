import Link from "next/link";
import PageShell from "@/components/PageShell";
import Footer from "@/components/Footer";
import { getPosts, formatDate } from "@/lib/posts";
import { SITE } from "@/content/site";

export const metadata = {
  title: "Blog",
  description: "Notes on healthcare BI, dashboards, SQL and Python by Sakthi Swarup.",
  alternates: { canonical: `${SITE.url}/blog` },
};

export default function Page() {
  const posts = getPosts();
  return (
    <PageShell>
      <section className="relative w-full min-h-screen px-6 md:px-20 pt-36 pb-32">
        <div className="max-w-4xl w-full mx-auto">
          <p className="text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-4 font-medium">Writing</p>
          <h1 className="font-black tracking-tighter text-white leading-[0.88] mb-14" style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}>
            Blog<span className="text-[#ff6b1a]">.</span>
          </h1>

          {posts.length === 0 && <p className="text-white/50">Nothing published yet.</p>}

          <div className="flex flex-col">
            {posts.map((p, i) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}
                className="group relative flex items-start gap-6 md:gap-8 py-10 border-b border-white/8 hover:border-white/20 transition-colors duration-500">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-[#ff6b1a] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-out" />
                <div className="pl-3 shrink-0 w-8 pt-1">
                  <span className="font-mono text-[10px] text-white/20 group-hover:text-[#ff6b1a] tracking-widest transition-colors duration-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0 group-hover:translate-x-1.5 transition-transform duration-500 ease-out">
                  <p className="text-[10px] text-white/35 tracking-[0.35em] uppercase mb-2">{formatDate(p.date)}</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-3">{p.title}</h2>
                  <p className="text-sm text-white/55 font-light leading-relaxed max-w-2xl">{p.summary}</p>
                  <span className="mt-4 inline-block text-[10px] text-white/30 group-hover:text-[#ff6b1a] tracking-widest uppercase transition-colors duration-200">Read ↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </PageShell>
  );
}
