import PageShell from "@/components/PageShell";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { SITE } from "@/content/site";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Sakthi Swarup about data analyst and BI roles.",
  alternates: { canonical: `${SITE.url}/contact` },
};

export default function Page() {
  return (
    <PageShell>
      <Contact standalone />
      <Footer />
    </PageShell>
  );
}
