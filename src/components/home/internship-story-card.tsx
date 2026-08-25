import type { Internship } from "@/content/schema";

import { BrandMark } from "./brand-mark";
import { EngineeringJourney } from "./engineering-journey";

type InternshipStoryCardProps = {
  internship: Internship;
  index: number;
};

export function InternshipStoryCard({ internship, index }: InternshipStoryCardProps) {
  const capabilityRecords = internship.highlights.slice(0, 3);

  return (
    <article
      className="sticky-internship-card"
      data-brand={internship.logo.theme}
      data-card-index={index}
      data-layout={index % 2 === 0 ? "copy-visual" : "visual-copy"}
    >
      <header className="internship-card-header">
        <p className="internship-card-meta">
          <span className="internship-company">{internship.company}</span>
          <span className="internship-team">{internship.team}</span>
          <span className="internship-role">{internship.role}</span>
          <span className="internship-period">{internship.period}</span>
        </p>
      </header>
      <div className="internship-card-columns">
        <div className="internship-copy-column">
          <h3 className="internship-value-headline">{internship.valueHeadline}</h3>
          <p className="internship-context">{internship.context}</p>
          <p className="internship-ownership">{internship.ownership}</p>
          <p className="internship-stack">{internship.stack.join("、")}</p>
          <p className="internship-result">{internship.results[0]}</p>
        </div>
        <div className="internship-visual-column">
          <BrandMark asset={internship.logo} />
          <p className="internship-status">{internship.status}</p>
          <EngineeringJourney label={`${internship.company} 工程旅程`} nodes={internship.journey} />
          <ul aria-label={`${internship.company} 能力建设记录`} className="capability-records">
            {capabilityRecords.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}