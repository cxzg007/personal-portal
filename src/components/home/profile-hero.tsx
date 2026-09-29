import type { SiteContent } from "@/content/schema";

import { AgentReplay } from "./agent-replay/agent-replay";
import { HeroExperienceIndex } from "./hero-experience-index";
import { ProfileDock } from "./profile-dock";

type ProfileHeroProps = {
  profile: SiteContent["profile"];
  internships: SiteContent["internships"];
};

export function ProfileHero({ profile, internships }: ProfileHeroProps) {
  return (
    <section aria-labelledby="profile-title" className="profile-hero" id="profile">
      <div className="profile-hero-copy">
        <div className="profile-hero-intro">
          <p className="showcase-hero-eyebrow"><span aria-hidden="true" /> AI AGENT / BACKEND ENGINEER</p>
          <p className="profile-dock-name">{profile.name} / Jiang Junjie</p>
          <h1 id="profile-title">
            <span className="showcase-title-first">构建可靠的</span>{" "}
            <span className="showcase-title-last"><span>Agent</span> 系统<span className="showcase-title-period">。</span></span>
          </h1>
          <p className="profile-hero-kicker profile-dock-role">{`2027 届校招 · ${profile.targetRole}`}</p>
          <p className="profile-hero-positioning">
            从语义建模到执行约束，关注 AI 应用与后端系统的可靠落地。
          </p>
          <div className="profile-hero-actions">
            <a className="profile-cta profile-cta-primary" href="#internships">
              查看实习
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
          <p className="showcase-hero-signature"><span>{profile.technicalId}</span><span aria-hidden="true">/</span><span>从想法，到可运行的系统</span></p>
        </div>
        <div className="showcase-exhibit"><AgentReplay /></div>
      </div>
      <div className="showcase-proof-strip">
        <HeroExperienceIndex internships={internships} />
      </div>
      <div className="showcase-credentials">
        <ProfileDock profile={profile} />
      </div>
    </section>
  );
}
