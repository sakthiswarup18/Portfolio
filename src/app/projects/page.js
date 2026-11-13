import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import ProjectsPage from "@/views/projects";
import Footer from "@/components/Footer";
import { SITE } from "@/content/site";

export const metadata = {
  title: "Projects",
  description:
    "Machine learning, visualisation, cloud pipeline and application projects by Sakthi Swarup, with how each was built.",
  alternates: { canonical: `${SITE.url}/projects` },
};

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<div className="min-h-screen" />}>
        <ProjectsPage />
      </Suspense>
      <Footer />
    </PageShell>
  );
}
