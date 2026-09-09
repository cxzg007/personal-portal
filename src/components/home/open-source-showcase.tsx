import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

type Contribution = OpenSourceProject["contributions"][number];

const PREFERRED_FEATURED_PR_NUMBERS = [1077, 1226, 1096] as const;

const FEATURED_TITLE_ALIASES: Record<number, string> = {
  1077: "RETE 规则匹配与链式一致性",
  1226: "按依赖分层并行执行",
  1096: "规则驱动动作与执行溯源",
};

// Editorial summaries are grounded in the linked, merged PR descriptions.
const FEATURED_SUMMARIES: Record<number, { category: string; summary: string; detail: string }> = {
  1077: {
    category: "推理内核",
    summary: "实现 Alpha 条件匹配与 Beta Token 合并，修复多条件链式推理中的绑定丢失与错误触发，让规则匹配保持一致。",
    detail: "条件统一 · Token 绑定 · 链式一致性",
  },
  1226: {
    category: "并发调度",
    summary: "让并行配置真正贯通构建、序列化与执行引擎；独立步骤按依赖层并发执行，同时保留安全回退。",
    detail: "显式安全声明 · 输入隔离 · 确定性合并",
  },
  1096: {
    category: "规则动作",
    summary: "引入结构化 Action 层，将规则命中连接到事实增删、函数调用与事件发送，并支持可选的动作溯源记录。",
    detail: "四类动作 · 可选溯源 · 兼容旧接口",
  },
};

function ReteMatchingDiagram() {
  return (
    <svg
      aria-label="RETE 多条件匹配示意：Alpha 节点产生 Token，Beta 逐层合并并检查共享变量，绑定一致时命中规则"
      className="open-source-rete"
      role="img"
      viewBox="0 0 480 206"
    >
      <g className="open-source-rete-paths" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M116 28H148Q158 28 158 38V52Q158 62 174 62H190" />
        <path d="M116 88H148Q158 88 158 78V72Q158 62 174 62" />
        <path d="M296 62H308Q322 62 322 76V102Q322 116 338 116" />
        <path d="M116 148H308Q322 148 322 134V130Q322 116 338 116" />
        <path d="M398 138V166" />
      </g>
      <g className="open-source-rete-nodes">
        <rect x="12" y="10" width="104" height="36" rx="10" />
        <rect x="12" y="70" width="104" height="36" rx="10" />
        <rect x="12" y="130" width="104" height="36" rx="10" />
        <rect className="open-source-rete-join" x="190" y="40" width="106" height="44" rx="12" />
        <rect className="open-source-rete-join" x="338" y="94" width="120" height="44" rx="12" />
        <rect x="350" y="166" width="96" height="32" rx="10" />
      </g>
      <g className="open-source-rete-labels" textAnchor="middle" dominantBaseline="central">
        <text x="64" y="28">Alpha A</text>
        <text x="64" y="88">Alpha B</text>
        <text x="64" y="148">Alpha C</text>
        <text x="243" y="62">Beta A+B</text>
        <text x="398" y="116">Beta A+B+C</text>
        <text x="398" y="182">规则命中</text>
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
                {contribution.number === 1077 ? <ReteMatchingDiagram /> : null}
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
