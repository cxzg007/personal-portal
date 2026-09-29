import type { CSSProperties } from "react";

import type { OpenSourceProject } from "@/content/schema";

import styles from "./contribution-map.module.css";

// Source locations checked against the PR's changed files on 2026-09-29.
// Each link is pinned to its merge commit (or reviewed head for an open PR).
const contributionAreas = [
  {
    id: "execution",
    name: "执行与查询",
    label: "EXECUTION",
    nodes: [
      {
        name: "Pipeline 执行",
        summary: "让独立任务按依赖分层并行执行。",
        prNumber: 1226,
        file: "pipeline/execution_engine.py",
        revision: "cce5ea177cbac29a526effa546219c48f8ec36f4",
      },
      {
        name: "SPARQL 查询",
        summary: "补齐查询执行、存储委托与回退路径。",
        prNumber: 1243,
        file: "reasoning/sparql_reasoner.py",
        revision: "7996d1ab4bd0c96ea7e3d91a4ce70fe5881d224b",
      },
    ],
  },
  {
    id: "reasoning",
    name: "规则与证据",
    label: "REASONING",
    nodes: [
      {
        name: "RETE 规则推理",
        summary: "实现基于 Token 的 alpha / beta 匹配。",
        prNumber: 1077,
        file: "reasoning/rete_engine.py",
        revision: "0384a8de306477332fabbd2de82d7de157a2c5f0",
      },
      {
        name: "时态真值维护",
        summary: "将双时态图证据投影到真值维护系统。",
        prNumber: 1675,
        file: "reasoning/temporal_truth_maintenance.py",
        revision: "b14a2b8d2f989c8c3deca107a21d1da93ee2a506",
      },
    ],
  },
  {
    id: "context",
    name: "Agent 上下文",
    label: "AGENT CONTEXT",
    nodes: [
      {
        name: "检索证据校验",
        summary: "在排序前过滤失效事实与来源支持。",
        prNumber: 1556,
        file: "context/truth_maintenance_filter.py",
        revision: "d46529adb316829bdc75b8467278f3f0ccb310f7",
      },
      {
        name: "RAG 上下文组装",
        summary: "围绕一致快照组织依赖、引用与预算。",
        prNumber: 1731,
        file: "context/grounded_context.py",
        revision: "340eb0c31cca25029cbf8bb5fbbec6703645b06b",
      },
    ],
  },
];

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
  if (project.repositoryUrl !== "https://github.com/semantica-agi/semantica") return null;

  const contributions = new Map(project.contributions.map((pr) => [pr.number, pr]));
  const areas = contributionAreas
    .map((area) => ({
      ...area,
      nodes: area.nodes.flatMap((node) => {
        const contribution = contributions.get(node.prNumber);
        return contribution ? [{ ...node, contribution }] : [];
      }),
    }))
    .filter(({ nodes }) => nodes.length > 0);
  const nodeCount = areas.reduce((count, area) => count + area.nodes.length, 0);
  if (nodeCount === 0) return null;

  return (
    <figure aria-labelledby="contribution-map-heading" aria-describedby="contribution-map-caption" className={styles.map}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>CONTRIBUTION MAP</p>
          <h4 id="contribution-map-heading">贡献落点图</h4>
        </div>
        <p className={styles.intro}>从工程执行到可信上下文，<br />看我的代码落在哪里。</p>
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
                <span className={styles.areaLabel}>{area.label}</span>
              </div>
              <ul aria-label={`${area.name}的贡献落点`} className={styles.nodes}>
                {area.nodes.map((node) => {
                  const { contribution } = node;
                  const status = contribution.status === "merged" ? "已合并" : "进行中";
                  return (
                    <li className={styles.node} data-status={contribution.status} key={node.prNumber}>
                      <div className={styles.nodeHeading}>
                        <h6>{node.name}</h6>
                        <span className={styles.status}><span aria-hidden="true">{contribution.status === "merged" ? "✓" : "◌"}</span>{status}</span>
                      </div>
                      <p className={styles.summary}>{node.summary}</p>
                      <a
                        aria-label={`${node.name} · 查看源码 ${node.file}`}
                        className={styles.source}
                        href={`${project.repositoryUrl}/blob/${node.revision}/semantica/${node.file}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <code>{node.file}</code><span aria-hidden="true">↗</span>
                      </a>
                      <a
                        aria-label={`贡献落点 · ${status} · PR #${contribution.number} · ${contribution.title}`}
                        className={styles.pr}
                        href={contribution.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span>{`PR #${contribution.number}`}</span><span>查看贡献 <span aria-hidden="true">↗</span></span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className={styles.caption} id="contribution-map-caption">
        <p>按 PR 变更文件整理；连线表示贡献归类。<br />{`贡献状态截至 ${project.snapshotDate}。`}</p>
        <a href="https://gitdiagram.com/semantica-agi/semantica" rel="noreferrer" target="_blank">项目架构参考 · GitDiagram <span aria-hidden="true">↗</span></a>
      </figcaption>
    </figure>
  );
}
