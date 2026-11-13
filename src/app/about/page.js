import PageShell from "@/components/PageShell";
import AboutPage from "@/views/about";
import Footer from "@/components/Footer";
import { SITE } from "@/content/site";

export const metadata = {
  title: "About",
  description: SITE.description,
  alternates: { canonical: `${SITE.url}/about` },
};

export default function Page() {
  return (
    <PageShell>
      <AboutPage />
      <Footer />
    </PageShell>
  );
}
