import type { SiteContent } from "@/content/schema";

export function ContactStage({ profile }: { profile: SiteContent["profile"] }) {
  return (
    <section aria-labelledby="contact-stage-title">
      <h2 id="contact-stage-title">Build reliable agent systems together.</h2>
      <p>{profile.recruitingStatus}</p>
      <ul>
        <li>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <a href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href="/resume.pdf" download>
            下载简历 PDF
          </a>
        </li>
      </ul>
    </section>
  );
}