import { BrandMark } from "@/components/home/brand-mark";
import { ContributionMap } from "@/components/home/contribution-map";
import { contributionLinkLabel, getContributionPresentation } from "./contribution-map-data";
import type { OpenSourceProject } from "@/content/schema";

type OpenSourceShowcaseProps = {
  project: OpenSourceProject;
};

export function OpenSourceShowcase({ project }: OpenSourceShowcaseProps) {
  const merged = project.contributions.filter(({ status }) => status === "merged");
  const { remainingMerged, remainingOpen } = getContributionPresentation(project);
  const { recognition } = project;

  return (
    <article aria-labelledby="open-source-showcase-heading" className="open-source-showcase">
      <div className="open-source-project-overview">
        <header className="open-source-showcase-header">
          <div className="open-source-project-heading">
            <div>
              <h3 id="open-source-showcase-heading">{project.name}</h3>
            </div>
            <BrandMark asset={project.logo} />
          </div>
          <p className="open-source-showcase-background">{project.background}</p>
        </header>

        <section aria-label="项目影响力与荣誉" className="open-source-recognition">
          <p className="open-source-eyebrow">项目影响力与荣誉 <span className="profile-micro" lang="en">PROJECT REACH</span></p>
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
          <p className="open-source-recognition-note">{`星数快照 · 核验于 ${recognition.checkedAt}`}</p>
          {recognition.honors.length > 0 ? (
            <p className="open-source-recognition-note">{`历史榜单记录 · 核验于 ${recognition.honorsCheckedAt}`}</p>
          ) : null}
        </section>
      </div>

      <div className="open-source-contributions-heading">
        <div>
          <p className="open-source-showcase-identity">{project.identity}</p>
          <h4>我的关键贡献 <span className="profile-micro" lang="en">MAINTAINER NOTES</span></h4>
        </div>
        <p className="open-source-stat" title={`个人贡献快照：${project.snapshotDate}`}>
          <span className="open-source-stat-value">{merged.length}</span>
          <span className="open-source-stat-label">已合并 PR</span>
        </p>
      </div>

      <p className="open-source-role-summary">{project.roleSummary}</p>

      <ContributionMap project={project} />

      {remainingMerged.length > 0 ? (
        <details className="open-source-showcase-details">
          <summary><span>{`查看其他 ${remainingMerged.length} 个已合并 PR`}<span className="profile-micro" lang="en">MORE CONTRIBUTIONS</span></span><span className="open-source-disclosure-icon" aria-hidden="true" /></summary>
          <ul aria-label="Semantica 其余已合并贡献" className="pr-list">
            {remainingMerged.map((contribution) => (
              <li key={contribution.number}>
                <a
                  aria-label={contributionLinkLabel(contribution)}
                  className="pr-link"
                  href={contribution.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="pr-record-number">{`#${contribution.number}`}</span>
                  <span className="pr-record-title">{contribution.title}</span>
                  <span aria-hidden="true" className="open-source-link-arrow">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {remainingOpen.length > 0 ? (
        <section aria-labelledby="open-source-ongoing-heading" className="open-source-ongoing">
          <h4 id="open-source-ongoing-heading">正在推进</h4>
          <p>{`${remainingOpen.length} 个开放 PR · 尚未合并`}</p>
          <ul>
            {remainingOpen.map((contribution) => (
              <li key={contribution.number}>
                <a aria-label={`进行中 · PR #${contribution.number} · ${contribution.title}`} href={contribution.url} rel="noreferrer" target="_blank">
                  <span className="open-source-ongoing-status">{`进行中 · PR #${contribution.number} · `}</span>
                  <span>{contribution.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
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
