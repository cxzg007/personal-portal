import type { SiteContent } from "@/content/schema";

import { ProfileDock } from "./profile-dock";

type ProfileHeroProps = {
  profile: SiteContent["profile"];
};

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <section aria-labelledby="profile-title" className="profile-hero" id="profile">
      <div className="profile-hero-copy">
        <p className="profile-hero-kicker">RELIABLE AGENT · BACKEND SYSTEMS</p>
        <h1 id="profile-title">{profile.technicalId}</h1>
        <p>{profile.positioning}</p>
        <div className="profile-hero-actions">
          <a className="profile-cta profile-cta-primary" href="#internships">
            查看实习
          </a>
          <a
            aria-label="下载简历 PDF"
            className="profile-cta profile-cta-secondary"
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
      <ProfileDock profile={profile} />
    </section>
  );
}