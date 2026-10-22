import type { Metadata } from "next";
import { ContactStage } from "@/components/home/contact-stage";
import { OpenSourceShowcase } from "@/components/home/open-source-showcase";
import { PageMotionController } from "@/components/home/page-motion-controller";
import { ProfileHero } from "@/components/home/profile-hero";
import { StickyInternshipStack } from "@/components/home/sticky-internship-stack";
import { SystemProjectTabs } from "@/components/home/system-project-tabs";
import { WritingStage } from "@/components/home/writing-stage";
import { Header } from "@/components/shell/header";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts } from "@/content/posts";
import { loadSystemArchitectures } from "@/content/system-architectures";
import { serializeJsonLd } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site-url";

const content = loadSiteContent();

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    locale: "zh_CN",
    url: "/about",
    title: `${content.profile.name}｜${content.profile.targetRole}`,
    description: content.profile.positioning,
    images: [{ url: "/social-card.svg", width: 1200, height: 630 }],
  },
};

export default async function AboutPage() {
  const featuredPosts = getAllPosts().filter((post) => post.featured && !post.draft).slice(0, 4);
  const siteUrl = getSiteUrl();
  const personId = new URL("/about#person", siteUrl).toString();
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
        url: new URL("/about", siteUrl).toString(),
        sameAs: [content.profile.github],
        alumniOf: content.profile.education.map((education) => ({
          "@type": "CollegeOrUniversity",
          name: education.school,
        })),
        knowsAbout: Array.from(new Set(content.caseStudies.flatMap((study) => study.stack))),
      },
      {
        "@type": "ProfilePage",
        "@id": new URL("/about#profile", siteUrl).toString(),
        url: new URL("/about", siteUrl).toString(),
        name: `${content.profile.name}｜${content.profile.targetRole}`,
        description: content.profile.positioning,
        mainEntity: { "@id": personId },
      },
    ],
  };

  return (
    <div className="profile-shell">
      <Header showWriting={featuredPosts.length > 0} />
      <PageMotionController />
      <main id="main-content" tabIndex={-1}>
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <ProfileHero internships={content.internships} profile={content.profile} />
        <section aria-labelledby="internships-heading" className="profile-stage" id="internships">
          <header className="profile-section-heading profile-reveal">
            <h2 id="internships-heading">实习经历</h2>
            <p lang="en">ENGINEERING EXPERIENCE</p>
          </header>
          <StickyInternshipStack internships={content.internships} />
        </section>
        <section aria-labelledby="systems-heading" className="profile-stage" id="systems">
          <header className="profile-section-heading profile-reveal">
            <h2 id="systems-heading">系统设计</h2>
            <p lang="en">SELECTED SYSTEMS</p>
          </header>
          <SystemProjectTabs architectures={loadSystemArchitectures(content)} projects={content.caseStudies} />
        </section>
        <section aria-labelledby="open-source-heading" className="profile-stage profile-stage--open-source" id="open-source">
          <header className="profile-section-heading profile-reveal">
            <h2 id="open-source-heading">开源贡献</h2>
            <p lang="en">OPEN SOURCE</p>
          </header>
          <OpenSourceShowcase project={content.openSource} />
        </section>
        {featuredPosts.length > 0 ? (
          <section aria-labelledby="writing-heading" className="profile-stage" id="writing">
            <header className="profile-section-heading profile-reveal">
              <h2 id="writing-heading">技术博客</h2>
              <p lang="en">WRITING & NOTES</p>
            </header>
            <WritingStage posts={featuredPosts} />
          </section>
        ) : null}
        <section aria-labelledby="contact-heading" className="profile-stage profile-stage--contact" id="contact">
          <header className="profile-section-heading profile-reveal">
            <h2 id="contact-heading">一起构建可靠的 AI 系统。</h2>
            <p lang="en">LET’S BUILD TOGETHER</p>
          </header>
          <ContactStage profile={content.profile} />
        </section>
      </main>
    </div>
  );
}
