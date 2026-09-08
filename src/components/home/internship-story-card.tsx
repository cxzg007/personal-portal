import type { Internship } from "@/content/schema";

import { BrandMark } from "./brand-mark";
import { EngineeringJourney } from "./engineering-journey";
import {
  InternshipEngineeringVisual,
  type EngineeringVisualKind,
} from "./internship-engineering-visual";

type InternshipStoryCardProps = {
  internship: Internship;
  index: number;
};

/* 品牌 theme 到工程示意图的显式映射（禁用列表下标推断）。 */
const ENGINEERING_VISUAL_BY_THEME: Partial<Record<Internship["logo"]["theme"], EngineeringVisualKind>> = {
  jd: "ontology",
  agibot: "streaming",
  cssc: "communication",
};

export function InternshipStoryCard({ internship, index }: InternshipStoryCardProps) {
  const visibleOutcomes = internship.results.slice(0, 3);
  const engineeringKind = ENGINEERING_VISUAL_BY_THEME[internship.logo.theme];

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
          <ul aria-label={`${internship.company} 核心成果`} className="internship-outcomes">
            {visibleOutcomes.map((result) => (
              <li key={result}>{result}</li>
            ))}
          </ul>
          <details className="internship-details">
            <summary>查看{internship.company}工程细节</summary>
            <ul aria-label={`${internship.company} 能力建设记录`} className="capability-records">
              {internship.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </details>
        </div>
        <div className="internship-visual-column">
          <BrandMark asset={internship.logo} />
          <p className="internship-status">{internship.status}</p>
          {engineeringKind ? (
            <InternshipEngineeringVisual
              kind={engineeringKind}
              label={`${internship.company} 工程示意`}
            />
          ) : null}
          <EngineeringJourney label={`${internship.company} 工程旅程`} nodes={internship.journey} />
        </div>
      </div>
    </article>
  );
}