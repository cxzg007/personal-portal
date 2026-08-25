import type { AcademicHonor, OpenSourceProject } from "@/content/schema";

type HonorGalleryProps = {
  openSourceHonors: OpenSourceProject["honors"];
  academicHonors: AcademicHonor[];
};

export function HonorGallery({ openSourceHonors, academicHonors }: HonorGalleryProps) {
  return (
    <section aria-label="荣誉记录" className="honor-gallery">
      <div className="honor-gallery-column">
        <ul aria-label="开源影响力" className="honor-gallery-list">
          {openSourceHonors.map((honor) => (
            <li className="honor-gallery-item" key={honor.rank}>
              <span className="honor-gallery-platform">{honor.platform}</span>
              <strong className="honor-gallery-rank">{honor.rank}</strong>
              <span className="honor-gallery-period">{honor.period}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="honor-gallery-column">
        <ul aria-label="教育与竞赛" className="honor-gallery-list">
          {academicHonors.map((honor) => (
            <li className="honor-gallery-item" key={honor.title}>
              <strong className="honor-gallery-title">{honor.title}</strong>
              <span className="honor-gallery-source">{honor.source}</span>
              <span className="honor-gallery-period">{honor.period}</span>
              <span className="honor-gallery-note">{honor.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="honor-gallery-disclaimer">排名来自公开趋势记录,非 GitHub 官方奖项。</p>
    </section>
  );
}