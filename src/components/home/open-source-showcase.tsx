import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");

  return (
    <article aria-labelledby="open-source-showcase-heading" className="open-source-showcase">
      <header className="open-source-showcase-header">
        <BrandMark asset={project.logo} />
        <div>
          <p className="open-source-showcase-identity">{project.identity}</p>
          <h3 id="open-source-showcase-heading">{project.name}</h3>
        </div>
      </header>

      <p className="open-source-showcase-background">{project.background}</p>

      <ul aria-label="Semantica 已合并贡献" className="pr-list">
        {merged.map((contribution) => (
          <li key={contribution.number}>
            <a className="pr-link" href={contribution.url} rel="noreferrer" target="_blank">{`PR #${contribution.number} · ${contribution.title}`}</a>
          </li>
        ))}
      </ul>

      <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并`}</p>

      <nav aria-label="Semantica 公开资料" className="open-source-showcase-links">
        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
          Semantica GitHub repository
        </a>
        <a href={project.articlePath}>阅读 Semantica 贡献复盘</a>
      </nav>
    </article>
  );
}