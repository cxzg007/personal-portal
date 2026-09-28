import type { Internship } from "@/content/schema";

import { BrandMark } from "./brand-mark";

export function HeroExperienceIndex({ internships }: { internships: Internship[] }) {
  return (
    <nav aria-label="经历索引" className="hero-experience-index">
      <p className="hero-experience-heading">经历索引</p>
      <ol>
        {internships.map((internship) => (
          <li key={internship.id}>
            <a
              aria-label={`查看${internship.company}实习经历`}
              href={`#internship-${internship.id}`}
            >
              <span className="hero-experience-brand">
                <BrandMark asset={internship.logo} />
              </span>
              <span className="hero-experience-copy">
                <span className="hero-experience-company">{internship.company}</span>
                <span className="hero-experience-title">{internship.presentation.title}</span>
                <span className="hero-experience-period">{internship.period}</span>
              </span>
              <svg aria-hidden="true" className="hero-experience-arrow" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
