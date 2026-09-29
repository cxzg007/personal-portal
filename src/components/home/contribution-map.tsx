import type { CSSProperties } from "react";

import type { OpenSourceProject } from "@/content/schema";

import { contributionLinkLabel, getContributionPresentation } from "./contribution-map-data";

import styles from "./contribution-map.module.css";

function BranchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="2" width="6" height="5" rx="1.5" />
      <rect x="2" y="17" width="6" height="5" rx="1.5" />
      <rect x="16" y="17" width="6" height="5" rx="1.5" />
      <path d="M12 7v5M5 17v-5h14v5" />
    </svg>
  );
}

export function ContributionMap({ project }: { project: OpenSourceProject }) {
  const { areas } = getContributionPresentation(project);
  const nodeCount = areas.reduce((count, area) => count + area.nodes.length, 0);
  if (nodeCount === 0) return null;

  return (
    <figure aria-labelledby="contribution-map-heading" aria-describedby="contribution-map-caption" className={styles.map}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow} lang="en">SELECTED CONTRIBUTIONS</p>
          <h4 id="contribution-map-heading">贡献落点图</h4>
        </div>
        <p className={styles.intro}>关键改动与对应 PR，<br />按贡献方向归纳。</p>
      </header>

      <div className={styles.diagram}>
        <div className={styles.root}>
          <span className={styles.rootIcon}><BranchIcon /></span>
          <div><strong>{project.name}</strong><span>{`${areas.length} 个方向 · ${nodeCount} 个代表性落点`}</span></div>
        </div>

        <ul aria-label="贡献方向与源码落点" className={styles.areas} style={{ "--area-count": areas.length } as CSSProperties}>
          {areas.map((area) => (
            <li className={styles.area} key={area.id}>
              <div className={styles.areaHeading}>
                <span aria-hidden="true" className={styles.junction} />
                <h5>{area.name}</h5>
                <span className={styles.areaLabel} lang="en">{area.label}</span>
              </div>
              <ul aria-label={`${area.name}的贡献落点`} className={styles.nodes}>
                {area.nodes.map((node) => {
                  const source = node.contributions[0];
                  const hasOpen = node.contributions.some((pr) => pr.status === "open");
                  const allOpen = node.contributions.every((pr) => pr.status === "open");
                  const status = allOpen ? "进行中" : hasOpen ? "含进行中" : "已合并";
                  return (
                    <li className={styles.node} data-status={hasOpen ? "open" : "merged"} key={node.name}>
                      <div className={styles.nodeHeading}>
                        <h6>{node.name}</h6>
                        <span className={styles.status}><span aria-hidden="true">{hasOpen ? "◌" : "✓"}</span>{status}</span>
                      </div>
                      <p className={styles.summary}>{node.summary}</p>
                      <a
                        aria-label={`${node.name} · 查看源码 ${source.file} · PR #${source.number}`}
                        className={styles.source}
                        href={`${project.repositoryUrl}/blob/${source.revision}/semantica/${source.file}`}
                        rel="noreferrer"
                        target="_blank"
                        title={source.file}
                      >
                        <span className={styles.sourceLabel}>代表源码 <span lang="en">SOURCE</span></span>
                        <span className={styles.sourceFile}><code>{source.file.split("/").at(-1)}</code><span aria-hidden="true">↗</span></span>
                      </a>
                      <ul className={styles.prs} aria-label={`${node.name}相关 PR`}>
                        {node.contributions.map((pr) => (
                          <li key={pr.number}>
                            <a
                              aria-label={contributionLinkLabel(pr)}
                              className={styles.pr}
                              href={pr.url}
                              rel="noreferrer"
                              target="_blank"
                              title={pr.title}
                            >
                              <span>{`PR #${pr.number}`}</span>
                              {hasOpen && !allOpen ? <span>{pr.status === "open" ? "进行中" : "已合并"}</span> : null}
                              <span aria-hidden="true">↗</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className={styles.caption} id="contribution-map-caption">
        <p>连线表示贡献归类；源码链接固定到对应 PR 提交。</p>
        <a href="https://gitdiagram.com/semantica-agi/semantica" rel="noreferrer" target="_blank">项目架构参考 · GitDiagram <span aria-hidden="true">↗</span></a>
      </figcaption>
    </figure>
  );
}
