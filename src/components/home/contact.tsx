import type { SiteContent } from "@/content/schema";

type ContactProps = {
  profile: SiteContent["profile"];
  about: SiteContent["about"];
};

export function Contact({ profile, about }: ContactProps) {
  const githubIdentity = profile.technicalId ?? profile.name;

  return (
    <div className="contact-panel">
      <div className="about-copy">
        {about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <aside aria-label="求职联系" className="contact-card">
        <p className="contact-status">
          <span aria-hidden="true" />
          {profile.recruitingStatus}
        </p>
        <h3>一起构建可靠的 AI 系统</h3>
        <p>如有 AI Agent、后端开发或系统工程方向的校招机会，欢迎通过邮件联系。</p>
        <div className="contact-actions">
          <a className="button button-primary" href={`mailto:${profile.email}`}>
            发送邮件联系{profile.name}
          </a>
          <a className="contact-link" href={profile.github} rel="noreferrer" target="_blank">
            查看 {githubIdentity} 的 GitHub
            <span aria-hidden="true">↗</span>
          </a>
          <a className="contact-link" download href="/resume.pdf">
            下载 PDF 简历
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
