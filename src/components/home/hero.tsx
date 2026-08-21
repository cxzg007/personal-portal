import type { SiteContent } from "@/content/schema";

type HeroProps = {
  profile: SiteContent["profile"];
};

export function Hero({ profile }: HeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="hero">
      <div className="hero-copy">
        <div className="availability-badge">
          <span aria-hidden="true" className="availability-dot" />
          {profile.recruitingStatus}
        </div>

        <p className="hero-kicker">BUILDING RELIABLE AGENT SYSTEMS</p>
        <h1 id="hero-heading">{profile.name}</h1>
        <p className="hero-role">{profile.targetRole}</p>
        <p className="hero-positioning">{profile.positioning}</p>

        <ul aria-label="教育经历" className="education-summary">
          {profile.education.map((education) => (
            <li key={`${education.school}-${education.degree}-${education.graduationYear}`}>
              <span>{education.school}</span>
              <span aria-hidden="true">/</span>
              <span>{education.major}</span>
              <span aria-hidden="true">/</span>
              <span>{education.degree}</span>
              <span aria-hidden="true">/</span>
              <span>{education.graduationYear}</span>
            </li>
          ))}
        </ul>

        <div className="hero-actions" aria-label="首屏操作">
          <a className="button button-primary" href="#internships">
            查看实习经历
            <span aria-hidden="true">↘</span>
          </a>
          <a className="button button-secondary" href="/resume.pdf">
            下载简历
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="hero-contact" aria-label="联系方式">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <span aria-hidden="true">·</span>
          <a href={profile.github} rel="noreferrer" target="_blank">
            GitHub / {profile.technicalId ?? "Profile"}
          </a>
        </div>
      </div>

      <div aria-hidden="true" className="hero-visual">
        <div className="visual-orbit visual-orbit-outer" />
        <div className="visual-orbit visual-orbit-inner" />
        <div className="visual-core">
          <span>AGENT</span>
          <strong>∞</strong>
          <small>REASON · ACT · VERIFY</small>
        </div>
        <span className="visual-node visual-node-one" />
        <span className="visual-node visual-node-two" />
        <span className="visual-node visual-node-three" />
        <p className="visual-caption">SYSTEMS / KNOWLEDGE / INFRA</p>
      </div>
    </section>
  );
}
