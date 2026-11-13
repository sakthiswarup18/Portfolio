// Fonts are bundled with the site (no request to Google at build or run time).
import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "./globals.css";
import { SITE } from "@/content/site";

const TITLE = `${SITE.name} — ${SITE.role}`;

export const viewport = { themeColor: "#080808" };

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: TITLE, template: `%s — ${SITE.name}` },
  description: SITE.description,
  authors: [{ name: SITE.fullName, url: SITE.url }],
  creator: SITE.fullName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: TITLE,
    title: TITLE,
    description: "Healthcare BI: Tableau and Power BI dashboards, SQL and Python.",
    images: [{ url: "/photo/sakthi-headshot-500.jpg", width: 500, height: 625, alt: SITE.name }],
  },
  twitter: { card: "summary", title: TITLE, description: SITE.description, images: ["/photo/sakthi-headshot-500.jpg"] },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  alternates: { canonical: SITE.url },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.fullName,
  jobTitle: SITE.role,
  description: "Healthcare BI specialist with expertise in Tableau, Power BI, SQL, and Python",
  url: SITE.url,
  image: `${SITE.url}/photo/sakthi-headshot-500.jpg`,
  alumniOf: [
    { "@type": "EducationalOrganization", name: "University of Massachusetts Dartmouth", url: "https://www.umassd.edu" },
    { "@type": "EducationalOrganization", name: "Jain University" },
  ],
  worksFor: { "@type": "Organization", name: "Ascension Health" },
  sameAs: [SITE.linkedin, SITE.github],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
