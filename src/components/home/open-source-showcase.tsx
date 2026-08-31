import Image from "next/image";

import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";
import { formatStars } from "@/lib/github-stars";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
  stars: number;
};

export function OpenSourceShowcase({ project, stars }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");

  return (
    <article aria-labelledby="open-source-showcase-heading" className="open-source-showcase">
      <header className="open-source-showcase-header">
        <BrandMark asset={project.logo} />
        <div>
          <p className="open-source-showcase-identity">{project.identity}</p>
          <h3 id="open-source-showcase-heading">{project.name}</h3>
          <p className="open-source-stars">{`${formatStars(stars)} GitHub Stars`}</p>
        </div>
      </header>

      <p className="open-source-showcase-background">{project.background}</p>

      <ul aria-label="Semantica 项目荣誉" className="open-source-honor-badges">
        {project.honors.map((honor) => (
          <li key={honor.rank}>
            <Image
              alt={`${honor.platform} ${honor.rank}`}
              height={28}
              loading="eager"
              src={`https://img.shields.io/badge/${encodeURIComponent(honor.platform)}-${encodeURIComponent(honor.rank)}-c47f17?style=flat-square`}
              unoptimized
              width={280}
            />
          </li>
        ))}
      </ul>

      <ul className="open-source-showcase-contributions">
        {project.contributions.map((contribution) => (
          <li className="open-source-showcase-contribution" key={contribution.number}>
            <a href={contribution.url} rel="noreferrer" target="_blank">
              {`PR #${contribution.number}：${contribution.summary}`}
            </a>
            <span className={`contribution-badge contribution-${contribution.status}`}>
              {contribution.status.toUpperCase()}
            </span>
          </li>
        ))}
      </ul>

      <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并，其余处于开放或审阅状态。`}</p>

      <ol aria-label="Semantica 能力链路" className="open-source-showcase-chain">
        {project.graphNodes.map((node) => (
          <li className="open-source-showcase-chain-node" key={node}>
            {node}
          </li>
        ))}
      </ol>

      <nav aria-label="Semantica 公开资料" className="open-source-showcase-links">
        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
          Semantica GitHub 仓库
        </a>
        <a href={project.articlePath}>阅读 Semantica 贡献复盘</a>
      </nav>
    </article>
  );
}