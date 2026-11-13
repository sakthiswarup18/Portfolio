import { SITE } from "@/content/site";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-static";

export default function sitemap() {
  const pages = ["", "/projects", "/about", "/blog", "/contact"].map((p) => ({
    url: `${SITE.url}${p}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.8,
  }));
  const posts = getPosts().map((p) => ({
    url: `${SITE.url}/blog/${p.slug}/`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));
  return [...pages, ...posts];
}
