import type { OpenSourceProject } from "@/content/schema";

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
        summary: "按依赖分层并行调度任务，处理数据隔离、写冲突与失败传播。",
        sources: [{ number: 1226, file: "pipeline/execution_engine.py", revision: "cce5ea177cbac29a526effa546219c48f8ec36f4" }],
      },
      {
        name: "SPARQL 查询",
        summary: "贯通存储委托与本地图回退，统一返回结构，隔离查询缓存。",
        sources: [{ number: 1243, file: "reasoning/sparql_reasoner.py", revision: "7996d1ab4bd0c96ea7e3d91a4ce70fe5881d224b" }],
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
        summary: "完善多条件匹配与规则动作，让事实推导支持副作用和溯源。",
        sources: [
          { number: 1077, file: "reasoning/rete_engine.py", revision: "0384a8de306477332fabbd2de82d7de157a2c5f0" },
          { number: 1096, file: "reasoning/reasoner.py", revision: "5d54919804f81d0db03f1790e109471cb73d52a1" },
        ],
      },
      {
        name: "真值与时态维护",
        summary: "追踪结论的独立支持，支持来源撤回、双时态证据与历史查询。",
        sources: [
          { number: 1675, file: "reasoning/temporal_truth_maintenance.py", revision: "b14a2b8d2f989c8c3deca107a21d1da93ee2a506" },
          { number: 1544, file: "reasoning/truth_maintenance.py", revision: "92c2578a142a3b1e6139e6ea69fea39601a212e6" },
        ],
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
        summary: "在检索排序前校验事实与来源支持，过滤已失效的上下文。",
        sources: [{ number: 1556, file: "context/truth_maintenance_filter.py", revision: "d46529adb316829bdc75b8467278f3f0ccb310f7" }],
      },
      {
        name: "RAG 上下文组装",
        summary: "基于一致快照组装 RAG 上下文，统筹依赖、引用、摘要与预算。",
        sources: [{ number: 1731, file: "context/grounded_context.py", revision: "340eb0c31cca25029cbf8bb5fbbec6703645b06b" }],
      },
    ],
  },
];

/** Partition once so every PR is rendered in exactly one place, including future PRs. */
export function getContributionPresentation(project: OpenSourceProject) {
  const available = new Map(project.contributions.map((pr) => [pr.number, pr]));
  const claimed = new Set<number>();
  const areas = (project.repositoryUrl === "https://github.com/semantica-agi/semantica" ? contributionAreas : [])
    .map((area) => ({
      ...area,
      nodes: area.nodes.flatMap((node) => {
        const contributions = node.sources.flatMap((source) => {
          const pr = available.get(source.number);
          if (!pr || claimed.has(pr.number)) return [];
          claimed.add(pr.number);
          return [{ ...pr, file: source.file, revision: source.revision }];
        });
        return contributions.length ? [{ name: node.name, summary: node.summary, contributions }] : [];
      }),
    }))
    .filter(({ nodes }) => nodes.length > 0);
  return {
    areas,
    remainingMerged: project.contributions.filter((pr) => pr.status === "merged" && !claimed.has(pr.number)),
    remainingOpen: project.contributions.filter((pr) => pr.status === "open" && !claimed.has(pr.number)),
  };
}

export function contributionLinkLabel(pr: OpenSourceProject["contributions"][number]) {
  return `${pr.status === "merged" ? "已合并" : "进行中"} · PR #${pr.number} · ${pr.title}`;
}
