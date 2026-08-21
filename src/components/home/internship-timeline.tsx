"use client";

import { useState } from "react";

import type { Internship } from "@/content/schema";

type InternshipTimelineProps = {
  internships: Internship[];
};

export function InternshipTimeline({ internships }: InternshipTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  function toggleDetails(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="internship-timeline">
      {internships.map((internship, index) => {
        const detailsId = `internship-${internship.id}-details`;
        const headingId = `internship-${internship.id}-heading`;
        const isExpanded = expandedIds.has(internship.id);

        return (
          <article aria-labelledby={headingId} className="internship-card" key={internship.id}>
            <div aria-hidden="true" className="timeline-marker">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>

            <div className="internship-card-body">
              <header className="internship-card-header">
                <div>
                  <p className="internship-company">{internship.company}</p>
                  <h3 id={headingId}>{internship.role}</h3>
                  <p className="internship-team">{internship.team}</p>
                </div>
                <div className="internship-meta">
                  <span className={`status-badge status-${internship.status.toLowerCase()}`}>
                    {internship.status}
                  </span>
                  <time>{internship.period}</time>
                </div>
              </header>

              <p className="internship-result-summary">
                <span>核心交付</span>
                {internship.results[0]}
              </p>

              <ul aria-label={`${internship.company} 技术栈`} className="technology-list">
                {internship.stack.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>

              <button
                aria-controls={detailsId}
                aria-expanded={isExpanded}
                className="details-toggle"
                onClick={() => toggleDetails(internship.id)}
                type="button"
              >
                <span>查看技术细节</span>
                <span aria-hidden="true" className="details-toggle-icon">
                  {isExpanded ? "−" : "+"}
                </span>
              </button>

              <div className="internship-details" hidden={!isExpanded} id={detailsId}>
                <section>
                  <h4>业务背景</h4>
                  <p>{internship.context}</p>
                </section>
                <section>
                  <h4>关键行动</h4>
                  <ul>
                    {internship.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>个人贡献</h4>
                  <p>{internship.ownership}</p>
                </section>
                <section>
                  <h4>交付结果</h4>
                  <ul>
                    {internship.results.map((result) => (
                      <li key={result}>{result}</li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
