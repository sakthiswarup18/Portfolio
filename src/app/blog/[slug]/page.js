import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import Footer from "@/components/Footer";
import { getPosts, getPost, formatDate } from "@/lib/posts";
import { SITE } from "@/content/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `${SITE.url}/blog/${post.slug}` },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <PageShell>
      <article className="relative w-full min-h-screen px-6 md:px-20 pt-36 pb-32">
        <div className="max-w-2xl w-full mx-auto">
          <p className="text-[10px] text-[#ff6b1a] tracking-[0.5em] uppercase mb-5 font-medium">{formatDate(post.date)}</p>
          <h1 className="font-black tracking-tighter text-white leading-[0.95] mb-10" style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
            {post.title}
          </h1>
          {/* Post HTML comes from your own Markdown files in /content/blog */}
          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        </div>
      </article>
      <Footer />
    </PageShell>
  );
}
