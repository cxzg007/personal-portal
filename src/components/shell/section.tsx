import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export function Section({ id, title, eyebrow, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} className="content-section" id={id}>
      <header className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={headingId}>{title}</h2>
      </header>
      {children}
    </section>
  );
}
