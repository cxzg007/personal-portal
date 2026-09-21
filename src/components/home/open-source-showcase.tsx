import { BrandMark } from "@/components/home/brand-mark";
import type { OpenSourceContributionTheme, OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

type Contribution = OpenSourceProject["contributions"][number];

export type ContributionThemeGroup = {
  theme: OpenSourceContributionTheme;
  contributions: Contribution[];
};

const OTHER_CONTRIBUTIONS_THEME_ID = "other-contributions";

export function groupContributionsByTheme(project: OpenSourceProject): ContributionThemeGroup[] {
  const mergedByNumber = new Map(
    project.contributions
      .filter(({ status }) => status === "merged")
      .map((contribution) => [contribution.number, contribution] as const),
  );

  return project.contributionThemes
    .map((theme) => ({
      theme,
      contributions: theme.prNumbers
        .map((number) => mergedByNumber.get(number))
        .filter((contribution): contribution is Contribution => contribution !== undefined),
    }))
    .filter(({ contributions }) => contributions.length > 0);
}

function prLinkLabel(contribution: Contribution) {
  return `已合并 · PR #${contribution.number} · ${contribution.title}`;
}

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const groups = groupContributionsByTheme(project);
  const themeGroups = groups.filter(({ theme }) => theme.id !== OTHER_CONTRIBUTIONS_THEME_ID);
  const otherGroup = groups.find(({ theme }) => theme.id === OTHER_CONTRIBUTIONS_THEME_ID);
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

      <ul aria-label="Semantica 贡献主题" className="open-source-theme-grid">
        {themeGroups.map(({ theme, contributions }, index) => (
          <li className="open-source-theme-item" data-theme-id={theme.id} key={theme.id}>
            <div className="open-source-theme-card">
              <div className="open-source-theme-header">
                <span aria-hidden="true" className="open-source-theme-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h5 className="open-source-theme-name">{theme.name}</h5>
                <span className="open-source-theme-count">{`${contributions.length} 个已合并 PR`}</span>
              </div>
              <p className="open-source-theme-summary">{theme.summary}</p>
              <ul aria-label={`${theme.name}相关 PR`} className="open-source-theme-prs">
                {contributions.map((contribution) => (
                  <li key={contribution.number}>
                    <a
                      aria-label={prLinkLabel(contribution)}
                      className="open-source-pr-chip"
                      href={contribution.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>{`PR #${contribution.number}`}</span>
                      <span aria-hidden="true" className="open-source-link-arrow">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      {otherGroup ? (
        <details className="open-source-showcase-details">
          <summary><span>{`查看其他 ${otherGroup.contributions.length} 个已合并 PR`}</span><span className="open-source-disclosure-icon" aria-hidden="true">+</span></summary>
          <p className="open-source-theme-summary open-source-other-summary">{otherGroup.theme.summary}</p>
          <ul aria-label="Semantica 其余已合并贡献" className="pr-list">
            {otherGroup.contributions.map((contribution) => (
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
          <a href={project.articlePath}>阅读相关技术文章</a>
        </nav>
      </footer>
    </article>
  );
}
