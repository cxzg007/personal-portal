import type { SiteContent } from "@/content/schema";

type ProfileDockProps = {
  profile: SiteContent["profile"];
};

const GROWTH_PATH = "通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程";

export function ProfileDock({ profile }: ProfileDockProps) {
  return (
    <aside className="profile-dock">
      <p className="profile-dock-name">{profile.name} / Jiang Junjie</p>
      <p className="profile-dock-role">{profile.targetRole}</p>
      <p className="profile-dock-status">{profile.recruitingStatus}</p>

      <ul aria-label="教育经历" className="profile-dock-education">
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

      <div className="profile-dock-contacts" aria-label="联系方式">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <span aria-hidden="true">·</span>
        <a href={profile.github} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </div>

      <p className="profile-dock-growth">{GROWTH_PATH}</p>
    </aside>
  );
}