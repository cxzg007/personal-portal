import type { SiteContent } from "@/content/schema";

type ProfileInfoProps = {
  profile: SiteContent["profile"];
  about: string[];
};

const TECHNICAL_DIRECTION = "可靠 AI 应用 / 后端系统";

export function ProfileInfo({ profile, about }: ProfileInfoProps) {
  const primaryEducation = profile.education[0];

  return (
    <section className="profile-info" id="info">
      <div className="profile-info-about">
        {about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <dl className="profile-info-facts">
        <div>
          <dt>姓名</dt>
          <dd>{profile.name}</dd>
        </div>
        <div>
          <dt>技术身份</dt>
          <dd>{profile.technicalId}</dd>
        </div>
        <div>
          <dt>学校</dt>
          <dd className="profile-dock-serif">{primaryEducation.school}</dd>
        </div>
        <div>
          <dt>学位</dt>
          <dd>{primaryEducation.degree}</dd>
        </div>
        <div>
          <dt>毕业年份</dt>
          <dd>{primaryEducation.graduationYear}</dd>
        </div>
        <div>
          <dt>目标角色</dt>
          <dd>{profile.targetRole}</dd>
        </div>
        <div>
          <dt>技术方向</dt>
          <dd>{TECHNICAL_DIRECTION}</dd>
        </div>
      </dl>
    </section>
  );
}