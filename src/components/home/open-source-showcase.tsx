import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

type Contribution = OpenSourceProject["contributions"][number];

const PREFERRED_FEATURED_PR_NUMBERS = [1226, 1081, 1094] as const;
const CAPABILITY_LABELS = ["图数据适配", "规则推理", "执行链路"] as const;

export function selectFeaturedContributions(project: OpenSourceProject): {
  featured: Contribution[];
  remaining: Contribution[];
} {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const mergedByNumber = new Map(merged.map((contribution) => [contribution.number, contribution]));
  const selected = new Set<number>();
  const featured: Contribution[] = [];

  for (const number of PREFERRED_FEATURED_PR_NUMBERS) {
    const contribution = mergedByNumber.get(number);
    if (contribution && !selected.has(number)) {
      selected.add(number);
      featured.push(contribution);
    }
  }

  for (const contribution of merged) {
    if (featured.length >= PREFERRED_FEATURED_PR_NUMBERS.length) {
      break;
    }
    if (selected.has(contribution.number)) {
      continue;
    }
    selected.add(contribution.number);
    featured.push(contribution);
  }

  const remaining = merged.filter(({ number }) => !selected.has(number));
  return { featured, remaining };
}

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const { featured, remaining } = selectFeaturedContributions(project);

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

      <div className="open-source-showcase-stats">
        <p className="open-source-stat">
          <span className="open-source-stat-value">{merged.length}</span>
          <span className="open-source-stat-label">已合并 PR</span>
        </p>
        <ul aria-label="Semantica 能力标签" className="open-source-capabilities">
          {CAPABILITY_LABELS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>

      <ul aria-label="Semantica 代表性贡献" className="pr-list">
        {featured.map((contribution) => (
          <li key={contribution.number}>
            <a
              className="pr-link"
              href={contribution.url}
              rel="noreferrer"
              target="_blank"
            >{`PR #${contribution.number} · ${contribution.title}`}</a>
          </li>
        ))}
      </ul>

      {remaining.length > 0 ? (
        <details className="open-source-showcase-details">
          <summary>{`查看其余 ${remaining.length} 个已合并 PR`}</summary>
          <ul aria-label="Semantica 其余已合并贡献" className="pr-list">
            {remaining.map((contribution) => (
              <li key={contribution.number}>
                <a
                  className="pr-link"
                  href={contribution.url}
                  rel="noreferrer"
                  target="_blank"
                >{`PR #${contribution.number} · ${contribution.title}`}</a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

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