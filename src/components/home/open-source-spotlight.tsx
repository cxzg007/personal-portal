import Link from "next/link";

import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceSpotlightProps = {
  project: OpenSourceProject;
};

export function OpenSourceSpotlight({ project }: OpenSourceSpotlightProps) {
  const mergedContributions = project.contributions.filter(
    (contribution) => contribution.status === "merged",
  );
  const otherContributions = project.contributions.filter(
    (contribution) => contribution.status !== "merged",
  );
  const mergedIds = mergedContributions.map((contribution) => `#${contribution.number}`);

  return (
    <article aria-labelledby="semantica-heading" className="open-source-spotlight">
      <header className="open-source-header">
        <BrandMark asset={project.logo} />
        <div>
          <p className="open-source-identity">{project.identity}</p>
          <h3 id="semantica-heading">{project.name}</h3>
        </div>
      </header>

      <p className="open-source-background">{project.background}</p>

      <ul aria-label="Semantica 项目荣誉" className="honor-list">
        {project.honors.map((honor) => (
          <li className="honor-card" key={honor.rank}>
            <span className="honor-platform">{honor.platform}</span>
            <strong className="honor-rank">{honor.rank}</strong>
            <span className="honor-period">{honor.period}</span>
          </li>
        ))}
      </ul>

      <dl className="contribution-metrics">
        <div className="contribution-metric">
          <dt>公开贡献</dt>
          <dd>{project.contributions.length}</dd>
        </div>
        <div className="contribution-metric">
          <dt>已合并</dt>
          <dd>{mergedContributions.length}</dd>
        </div>
      </dl>

      <ol aria-label="Semantica 图原生能力链路" className="open-source-graph">
        {project.graphNodes.map((node, index) => (
          <li className="open-source-graph-node" key={node}>
            {node}
            <span aria-hidden="true" className="open-source-graph-index">
              {String(index + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ol>

      <section aria-labelledby="merged-contributions-heading" className="merged-contributions">
        <h4 id="merged-contributions-heading">已合并贡献</h4>
        <ul>
          {mergedContributions.map((contribution) => (
            <li key={contribution.number}>{contribution.summary}</li>
          ))}
        </ul>
        <p className="open-source-attribution">{`截至 ${project.snapshotDate}：${mergedIds.join(" 与 ")} 已合并，其余贡献处于开放或审阅状态。`}</p>
      </section>

      <details className="open-source-more">
        <summary>更多贡献</summary>
        <ul>
          {otherContributions.map((contribution) => (
            <li key={contribution.number}>{contribution.summary}</li>
          ))}
        </ul>
      </details>

      <nav aria-label="Semantica 公开资料" className="open-source-links">
        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
          查看 Semantica GitHub 项目
          <span aria-hidden="true">↗</span>
        </a>
        <Link href={project.articlePath}>阅读 Semantica 贡献复盘</Link>
      </nav>
    </article>
  );
}