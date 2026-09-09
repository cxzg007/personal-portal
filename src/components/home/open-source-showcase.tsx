import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

type Contribution = OpenSourceProject["contributions"][number];

const PREFERRED_FEATURED_PR_NUMBERS = [1226, 1081, 1094] as const;

const FEATURED_TITLE_ALIASES: Record<number, string> = {
  1226: "按依赖分层并行执行",
  1081: "统一 ContextGraph 数据适配",
  1094: "回溯真实 SHACL 约束",
};

// Editorial summaries are grounded in the linked, merged PR descriptions.
const FEATURED_SUMMARIES: Record<number, { category: string; summary: string; detail: string }> = {
  1226: {
    category: "执行引擎 · 并发调度",
    summary: "让并行配置真正贯通构建、序列化与执行引擎；独立步骤按依赖层并发执行，同时保留安全回退。",
    detail: "显式安全声明 · 输入隔离 · 确定性合并",
  },
  1081: {
    category: "数据契约",
    summary: "新增正式的 to_kg_dict() 适配器，打通 ContextGraph 与 RDF 导出、时间查询，减少手工字段映射。",
    detail: "统一图数据形状，保留时间语义",
  },
  1094: {
    category: "可解释性",
    summary: "从 sh:sourceShape 回溯真实约束，修正硬编码的校验解释，让错误说明与实际规则一致。",
    detail: "从占位解释，到可追溯的约束值",
  },
};

function DependencyLayerDiagram() {
  return (
    <svg
      aria-label="依赖层示意：独立步骤在同一依赖层并行，再按声明顺序合并；非安全步骤回退串行"
      className="open-source-pipeline"
      role="img"
      viewBox="0 0 480 136"
    >
      <g className="open-source-pipeline-paths" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M100 68H128Q143 68 143 53V39Q143 28 158 28H177" />
        <path d="M100 68H128Q143 68 143 83V99Q143 110 158 110H177" />
        <path d="M285 28H304Q320 28 320 44V52Q320 68 335 68H364" />
        <path d="M285 110H304Q320 110 320 94V84Q320 68 335 68H364" />
      </g>
      <g className="open-source-pipeline-nodes">
        <rect x="8" y="46" width="92" height="44" rx="12" />
        <rect className="open-source-pipeline-parallel" x="177" y="6" width="108" height="44" rx="12" />
        <rect className="open-source-pipeline-parallel" x="177" y="88" width="108" height="44" rx="12" />
        <rect x="364" y="46" width="108" height="44" rx="12" />
      </g>
      <g className="open-source-pipeline-labels" textAnchor="middle" dominantBaseline="central">
        <text x="54" y="68">输入</text>
        <text x="231" y="28">独立步骤 A</text>
        <text x="231" y="110">独立步骤 B</text>
        <text x="418" y="68">有序合并</text>
        <text className="open-source-pipeline-caption" x="231" y="68">同层并行</text>
      </g>
    </svg>
  );
}

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

function prLinkLabel(contribution: Contribution) {
  return `已合并 · PR #${contribution.number} · ${contribution.title}`;
}

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const { featured, remaining } = selectFeaturedContributions(project);
  const { recognition } = project;

  return (
    <article aria-labelledby="open-source-showcase-heading" className="open-source-showcase">
      <div className="open-source-project-overview">
        <header className="open-source-showcase-header">
          <div className="open-source-project-heading">
            <div>
              <p className="open-source-eyebrow">OPEN SOURCE / 开源共建</p>
              <h3 id="open-source-showcase-heading">{project.name}</h3>
            </div>
            <BrandMark asset={project.logo} />
          </div>
          <p className="open-source-showcase-background">{project.background}</p>
        </header>

        <section aria-label="项目影响力与荣誉" className="open-source-recognition">
          <p className="open-source-eyebrow">项目影响力与荣誉</p>
          <a aria-label={`${recognition.stars.toLocaleString("en-US")} GitHub Stars`} className="open-source-stars" href={project.repositoryUrl} rel="noreferrer" target="_blank">
            <span aria-hidden="true" className="open-source-star-icon">✧</span>
            <strong>{recognition.stars.toLocaleString("en-US")}</strong>
            <span>GitHub Stars</span>
            <span aria-hidden="true" className="open-source-link-arrow">↗</span>
          </a>
          <ul className="open-source-honors">
            {recognition.honors.map((honor) => (
              <li key={honor.sourceUrl}>
                <a aria-label={`#${honor.rank} ${honor.platform} ${honor.title} · 查看项目榜单徽章`} href={honor.sourceUrl} rel="noreferrer" target="_blank">
                  <strong className="open-source-honor-rank">#{honor.rank}</strong>
                  <span>{honor.platform}<span className="open-source-honor-title">{honor.title}</span></span>
                  <span aria-hidden="true" className="open-source-link-arrow">↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="open-source-recognition-note">{`星数快照 / 项目榜单徽章 · 核验于 ${recognition.checkedAt}`}</p>
        </section>
      </div>

      <div className="open-source-contributions-heading">
        <div>
          <p className="open-source-showcase-identity">{project.identity}</p>
          <h4>我的关键贡献</h4>
        </div>
        <p className="open-source-stat" title={`个人贡献快照：${project.snapshotDate}`}>
          <span className="open-source-stat-value">{merged.length}</span>
          <span className="open-source-stat-label">已合并 PR</span>
        </p>
      </div>

      <ul aria-label="Semantica 代表性贡献" className="open-source-feature-grid">
        {featured.map((contribution, index) => {
          const alias = FEATURED_TITLE_ALIASES[contribution.number];
          const editorial = FEATURED_SUMMARIES[contribution.number];
          const isLead = index === 0;
          return (
            <li className={isLead ? "open-source-feature-lead" : undefined} key={contribution.number}>
              <a
                aria-label={prLinkLabel(contribution)}
                className="open-source-feature-card"
                href={contribution.url}
                rel="noreferrer"
                target="_blank"
              >
                <span className="open-source-feature-meta">
                  <span className="open-source-feature-category">{isLead ? "核心贡献" : editorial?.category ?? "工程贡献"}</span>
                  <span className="open-source-feature-status">{`已合并 · PR #${contribution.number}`}</span>
                </span>
                <span className="open-source-feature-title">{alias ?? contribution.title}</span>
                <span className="open-source-feature-original">{editorial?.summary ?? contribution.title}</span>
                {contribution.number === 1226 ? <DependencyLayerDiagram /> : null}
                <span className="open-source-feature-footer">
                  <span>{editorial?.detail ?? "查看完整改动与讨论"}</span>
                  <span className="open-source-feature-arrow" aria-hidden="true">↗</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {remaining.length > 0 ? (
        <details className="open-source-showcase-details">
          <summary><span>{`查看剩余 ${remaining.length} 个已合并 PR`}</span><span className="open-source-disclosure-icon" aria-hidden="true">+</span></summary>
          <ul aria-label="Semantica 其余已合并贡献" className="pr-list">
            {remaining.map((contribution) => (
              <li key={contribution.number}>
                <a
                  className="pr-link"
                  href={contribution.url}
                  rel="noreferrer"
                  target="_blank"
                >{prLinkLabel(contribution)}</a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <footer className="open-source-showcase-footer">
        <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并`}</p>
        <nav aria-label="Semantica 公开资料" className="open-source-showcase-links">
          <a aria-label="Semantica GitHub repository" href={project.repositoryUrl} rel="noreferrer" target="_blank">访问 GitHub <span aria-hidden="true">↗</span></a>
          <a href={project.articlePath}>阅读 Semantica 贡献复盘</a>
        </nav>
      </footer>
    </article>
  );
}
