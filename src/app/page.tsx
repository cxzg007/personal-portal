import { CaseStudies } from "@/components/home/case-studies";
import { Contact } from "@/components/home/contact";
import { Hero } from "@/components/home/hero";
import { ImpactMetrics } from "@/components/home/impact-metrics";
import { InternshipTimeline } from "@/components/home/internship-timeline";
import { Header } from "@/components/shell/header";
import { Section } from "@/components/shell/section";
import { loadSiteContent } from "@/content/load-site-content";

export default function HomePage() {
  const content = loadSiteContent();

  return (
    <div className="page-shell">
      <Header />
      <main id="main-content">
        <Hero profile={content.profile} />
        <ImpactMetrics metrics={content.metrics} />

        <Section eyebrow="01 / EXPERIENCE" id="internships" title="实习经历">
          <InternshipTimeline internships={content.internships} />
        </Section>

        <Section eyebrow="02 / SYSTEM DESIGN" id="case-studies" title="后端工程与系统设计">
          <CaseStudies caseStudies={content.caseStudies} />
        </Section>

        <Section eyebrow="03 / ABOUT" id="about" title="关于我">
          <Contact about={content.about} profile={content.profile} />
        </Section>
      </main>
    </div>
  );
}
