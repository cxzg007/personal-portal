import { ContactStage } from "@/components/home/contact-stage";
import { OpenSourceShowcase } from "@/components/home/open-source-showcase";
import { PageMotionController } from "@/components/home/page-motion-controller";
import { ProfileHero } from "@/components/home/profile-hero";
import { ProfileInfo } from "@/components/home/profile-info";
import { StickyInternshipStack } from "@/components/home/sticky-internship-stack";
import { SystemProjectTabs } from "@/components/home/system-project-tabs";
import { WritingStage } from "@/components/home/writing-stage";
import { Header } from "@/components/shell/header";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts } from "@/content/posts";
import { serializeJsonLd } from "@/lib/discovery";
import { fetchGitHubStars } from "@/lib/github-stars";
import { getSiteUrl } from "@/lib/site-url";

export default async function HomePage() {
  const content = loadSiteContent();
  const stars = await fetchGitHubStars(content.openSource.starsSnapshot);
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
    <div className="profile-shell">
      <Header />
      <PageMotionController />
      <main id="main-content" tabIndex={-1}>
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <ProfileHero profile={content.profile} />
        <section aria-labelledby="info-heading" className="profile-stage" id="info">
          <h2 id="info-heading">个人信息</h2>
          <ProfileInfo about={content.about} profile={content.profile} />
        </section>
        <section aria-labelledby="internships-heading" className="profile-stage" id="internships">
          <h2 id="internships-heading">实习内容落在真实系统里。</h2>
          <StickyInternshipStack internships={content.internships} />
        </section>
        <section aria-labelledby="systems-heading" className="profile-stage" id="systems">
          <h2 id="systems-heading">项目按工程问题组织。</h2>
          <SystemProjectTabs projects={content.caseStudies} />
        </section>
        <section aria-labelledby="open-source-heading" className="profile-stage" id="open-source">
          <h2 id="open-source-heading">开源贡献与公开影响力。</h2>
          <OpenSourceShowcase project={content.openSource} stars={stars} />
        </section>
        <section aria-labelledby="writing-heading" className="profile-stage" id="writing">
          <h2 id="writing-heading">技术写作与工程复盘。</h2>
          <WritingStage posts={featuredPosts} />
        </section>
        <section aria-labelledby="contact-heading" className="profile-stage" id="contact">
          <h2 id="contact-heading">Build reliable agent systems together.</h2>
          <ContactStage profile={content.profile} />
        </section>
      </main>
    </div>
  );
}