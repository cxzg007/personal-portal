import type { SiteContent } from "@/content/schema";

export function ContactStage({ profile }: { profile: SiteContent["profile"] }) {
  return (
    <div className="profile-contact-stage">
      <p>{profile.recruitingStatus}</p>
      <nav aria-label="联系方式" className="profile-contact-links">
        <a
          aria-label={`发送邮件至 ${profile.email}`}
          href={`mailto:${profile.email}`}
        >
          发送邮件
        </a>
        <a href="/resume.pdf">下载简历 PDF</a>
        <a href={profile.github} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </div>
  );
}