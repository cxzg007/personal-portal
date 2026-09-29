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
import "./showcase.css";

export default async function HomePage() {
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
    <div className="profile-shell engineering-showcase">
      <Header showWriting={featuredPosts.length > 0} />
      <PageMotionController />
      <main id="main-content" tabIndex={-1}>
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <ProfileHero internships={content.internships} profile={content.profile} />
        <section aria-labelledby="internships-heading" className="profile-stage" id="internships">
          <header className="showcase-section-heading profile-reveal">
            <div><p className="showcase-eyebrow">SELECTED EXPERIENCE</p><h2 id="internships-heading">实习经历</h2></div>
            <p>本体建模、实时数据与多智能体。<br />从业务约束出发，把系统做扎实。</p>
          </header>
          <StickyInternshipStack internships={content.internships} />
        </section>
        <section aria-labelledby="systems-heading" className="profile-stage" id="systems">
          <header className="showcase-section-heading profile-reveal">
            <div><p className="showcase-eyebrow">UNDER THE SURFACE</p><h2 id="systems-heading">系统设计</h2></div>
            <p>沿着数据流，理解每一次设计取舍。<br />选择一个节点，查看它的职责与边界。</p>
          </header>
          <SystemProjectTabs architectures={loadSystemArchitectures(content)} projects={content.caseStudies} />
        </section>
        <section aria-labelledby="open-source-heading" className="profile-stage profile-stage--open-source" id="open-source">
          <header className="showcase-section-heading profile-reveal">
            <div><p className="showcase-eyebrow">BUILT IN THE OPEN</p><h2 id="open-source-heading">开源贡献</h2></div>
            <p>从代码贡献到持续维护。<br />让每一项工作，都有可追溯的记录。</p>
          </header>
          <OpenSourceShowcase project={content.openSource} />
        </section>
        {featuredPosts.length > 0 ? (
          <section aria-labelledby="writing-heading" className="profile-stage" id="writing">
            <header className="showcase-section-heading profile-reveal">
              <div><p className="showcase-eyebrow">FIELD NOTES</p><h2 id="writing-heading">技术博客</h2></div>
              <p>写下实践中的问题，<br />也写下尚在形成的理解。</p>
            </header>
            <WritingStage posts={featuredPosts} />
          </section>
        ) : null}
        <section aria-labelledby="contact-heading" className="profile-stage profile-stage--contact" id="contact">
          <div className="showcase-contact-inner">
            <p className="showcase-eyebrow">LET’S BUILD SOMETHING THAT WORKS.</p>
            <h2 id="contact-heading">一起构建<br />可靠的 AI 系统<span>。</span></h2>
            <ContactStage profile={content.profile} />
            <footer className="showcase-footer">
              <p><strong>{content.profile.technicalId}</strong><span>{content.profile.name} · 同济大学</span></p>
              <a href="#top">回到顶部 <span aria-hidden="true">↑</span></a>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
