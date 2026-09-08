import type { SiteContent } from "@/content/schema";

import { HeroSemanticNetwork } from "./hero-semantic-network";
import { ProfileDock } from "./profile-dock";

type ProfileHeroProps = {
  profile: SiteContent["profile"];
};

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <section aria-labelledby="profile-title" className="profile-hero" id="profile">
      <div className="profile-hero-copy">
        <div className="profile-hero-intro">
          <p className="profile-hero-kicker">RELIABLE AGENT · BACKEND SYSTEMS</p>
          <h1 id="profile-title">{profile.technicalId}</h1>
          <p className="profile-hero-lead">构建可靠的 Agent 系统</p>
          <p className="profile-hero-positioning">
            从语义建模到执行约束，关注 AI 应用与后端系统的可靠落地。
          </p>
          <div className="profile-hero-actions">
            <a className="profile-cta profile-cta-primary" href="#internships">
              查看实习
            </a>
            <a
              aria-label="下载简历 PDF"
              className="profile-cta profile-cta-secondary"
              download
              href="/resume.pdf"
            >
              下载简历 PDF
            </a>
            <a
              className="profile-cta profile-cta-secondary"
              href={profile.github}
              rel="noreferrer"
              target="_blank"
            >
              GitHub ↗
            </a>
          </div>
        </div>
        <HeroSemanticNetwork />
        <ProfileDock profile={profile} />
      </div>
    </section>
  );
}