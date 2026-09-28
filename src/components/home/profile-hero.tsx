import type { SiteContent } from "@/content/schema";

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
          <p className="profile-dock-name">{profile.name} / Jiang Junjie</p>
          <h1 id="profile-title">{profile.technicalId}</h1>
          <p className="profile-hero-lead">构建可靠的 Agent 系统</p>
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
        </div>
        <HeroExperienceIndex internships={internships} />
        <ProfileDock profile={profile} />
      </div>
    </section>
  );
}
