import type { Internship } from "@/content/schema";

import { BrandMark } from "./brand-mark";

type InternshipStoryCardProps = {
  internship: Internship;
  index: number;
};

export function InternshipStoryCard({ internship, index }: InternshipStoryCardProps) {
  const { title, contribution, outcome, technologies, details } = internship.presentation;

  return (
    <article
      className="sticky-internship-card"
      data-brand={internship.logo.theme}
      data-card-index={index}
    >
      <header className="internship-card-header">
        <div className="internship-identity">
          <span className="internship-brand-slot">
            <BrandMark asset={internship.logo} />
          </span>
          <span className="internship-identity-text">
            <span className="internship-company">{internship.company}</span>
          </span>
        </div>
        <p className="internship-card-meta">
          <span className="internship-chip internship-role">{internship.role}</span>
          <span className="internship-chip internship-period">{internship.period}</span>
        </p>
      </header>
      <div className="internship-copy-column">
        <h3 className="internship-value-headline">{title}</h3>
        <p className="internship-contribution">{contribution}</p>
        <p className="internship-outcome-text">{outcome}</p>
        <ul aria-label={`${internship.company} 技术栈`} className="internship-stack">
          {technologies.map((item) => (
            <li className="internship-stack-chip" key={item}>
              {item}
            </li>
          ))}
        </ul>
        <details className="internship-details">
          <summary>查看{internship.company}工程细节</summary>
          <p className="internship-team">{internship.team}</p>
          <ul aria-label={`${internship.company} 能力建设记录`} className="capability-records">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </details>
      </div>
    </article>
  );
}