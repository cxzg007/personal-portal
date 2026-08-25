import type { Internship } from "@/content/schema";

import { InternshipStoryCard } from "./internship-story-card";

type StickyInternshipStackProps = {
  internships: Internship[];
};

export function StickyInternshipStack({ internships }: StickyInternshipStackProps) {
  return (
    <section className="sticky-internship-stack" id="internships">
      <ol className="sticky-internship-list">
        {internships.map((internship, index) => (
          <li key={internship.id}>
            <InternshipStoryCard index={index} internship={internship} />
          </li>
        ))}
      </ol>
    </section>
  );
}