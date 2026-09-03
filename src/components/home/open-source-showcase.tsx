import Image from "next/image";

import { BrandMark } from "@/components/home/brand-mark";
import { OpenSourceSpotlight } from "@/components/home/open-source-spotlight";
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

      <section aria-label="Semantica 双层能力地图" className="open-source-capability-map">
        <h4>项目工作链与贡献覆盖</h4>
        <p>选择工作链节点可强调相关贡献；全部内容始终保留。</p>
        <OpenSourceSpotlight
          contributions={project.contributions}
          contributionDomains={project.contributionDomains}
          graphNodes={project.graphNodes}
        />
      </section>

      <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并，其余处于开放或审阅状态。`}</p>

      <nav aria-label="Semantica 公开资料" className="open-source-showcase-links">
        <a href={project.repositoryUrl} rel="noreferrer" target="_blank">
          Semantica GitHub repository
        </a>
        <a href={project.articlePath}>阅读 Semantica 贡献复盘</a>
      </nav>
    </article>
  );
}