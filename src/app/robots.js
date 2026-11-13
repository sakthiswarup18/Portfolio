import { SITE } from "@/content/site";

export const dynamic = "force-static";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/__forms.html"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
