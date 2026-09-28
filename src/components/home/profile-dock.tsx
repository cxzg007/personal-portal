import Image from "next/image";

import type { SiteContent } from "@/content/schema";

type ProfileDockProps = {
  profile: SiteContent["profile"];
};

export function ProfileDock({ profile }: ProfileDockProps) {
  return (
    <aside className="profile-dock">
      <ul aria-label="教育经历" className="profile-dock-education">
        {profile.education.map((education) => (
          <li
            key={`${education.school}-${education.degree}-${education.graduationYear}`}
            className="profile-dock-education-entry"
          >
            <div className="profile-dock-education-main">
              <Image
                alt="同济大学校徽"
                className="profile-dock-education-badge"
                height={36}
                src="/brands/tongji.png"
                width={36}
              />
              <span className="profile-dock-education-school profile-dock-serif">
                {education.school}
              </span>
            </div>
            <span className="profile-dock-education-detail">{education.major}</span>
            <span className="profile-dock-education-detail">
              {`${education.degree} · ${education.graduationYear}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="profile-dock-contacts" aria-label="联系方式">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a href={profile.github} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </div>

    </aside>
  );
}
