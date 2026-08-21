import { CaseStudies } from "@/components/home/case-studies";
import { Contact } from "@/components/home/contact";
import { FeaturedWriting } from "@/components/home/featured-writing";
import { Hero } from "@/components/home/hero";
import { ImpactMetrics } from "@/components/home/impact-metrics";
import { InternshipTimeline } from "@/components/home/internship-timeline";
import { Header } from "@/components/shell/header";
import { Section } from "@/components/shell/section";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts } from "@/content/posts";
import { serializeJsonLd } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site-url";

export default function HomePage() {
  const content = loadSiteContent();
  const featuredPosts = getAllPosts().filter((post) => post.featured && !post.draft).slice(0, 4);
  const siteUrl = getSiteUrl();
  const personId = new URL("/#person", siteUrl).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: content.profile.name,
        alternateName: content.profile.technicalId,
        description: content.profile.positioning,
        email: `mailto:${content.profile.email}`,
        url: siteUrl.origin,
        sameAs: [content.profile.github],
        alumniOf: content.profile.education.map((education) => ({
          "@type": "CollegeOrUniversity",
          name: education.school,
        })),
        knowsAbout: Array.from(new Set(content.caseStudies.flatMap((study) => study.stack))),
      },
      {
        "@type": "ProfilePage",
        "@id": new URL("/#profile", siteUrl).toString(),
        url: siteUrl.origin,
        name: `${content.profile.name}｜${content.profile.targetRole}`,
        description: content.profile.positioning,
        mainEntity: { "@id": personId },
      },
    ],
  };

  return (
    <div className="page-shell">
      <Header />
      <main id="main-content" tabIndex={-1}>
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <Hero profile={content.profile} />
        <ImpactMetrics metrics={content.metrics} />

        <Section eyebrow="01 / EXPERIENCE" id="internships" title="实习经历">
          <InternshipTimeline internships={content.internships} />
        </Section>

        <Section eyebrow="02 / SYSTEM DESIGN" id="case-studies" title="后端工程与系统设计">
          <CaseStudies caseStudies={content.caseStudies} />
        </Section>

        <FeaturedWriting posts={featuredPosts} />

        <Section eyebrow="04 / ABOUT" id="about" title="关于我">
          <Contact about={content.about} profile={content.profile} />
        </Section>
      </main>
    </div>
  );
}
