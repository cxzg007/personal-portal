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
          <p className="showcase-hero-eyebrow"><span aria-hidden="true" /> ONTOLOGY / OPEN SOURCE / AGENT</p>
          <p className="profile-dock-name">{profile.name} / Jiang Junjie</p>
          <h1 id="profile-title" aria-label="从业务语义，到可靠执行。">
            <span className="showcase-title-first">从业务语义，</span>
            <span className="showcase-title-last">到可靠执行<span className="showcase-title-period">。</span></span>
          </h1>
          <p className="profile-hero-kicker profile-dock-role">{`2027 届校招 · ${profile.targetRole}`}</p>
          <p className="profile-hero-positioning">
            在京东参与本体与规则平台建设，作为 Semantica 维护者推进推理与执行能力。让业务语义成为 Agent 可理解、可执行的约束。
          </p>
          <ul className="showcase-focus" aria-label="工作重点"><li><span>京东</span>本体与规则平台</li><li><span>Semantica</span>Maintainer / Collaborator</li></ul>
          <div className="profile-hero-actions">
            <a className="profile-cta profile-cta-primary" href="#internships">
              京东实习
            </a>
            <a className="profile-cta profile-cta-secondary" href="#open-source">
              开源贡献 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="showcase-hero-signature"><span>{profile.technicalId}</span><span aria-hidden="true">/</span><a href={profile.github} rel="noreferrer" target="_blank">GitHub ↗</a></p>
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
