import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
) as {
  profile: { education: Array<{ school: string }> };
  openSource: {
    graphNodes: Array<{ id: string }>;
    contributionDomains: Array<{ id: string; prNumbers: number[] }>;
    contributions: Array<{ number: number; status: string; summary: string; url: string }>;
  };
};

describe("site-content education copy", () => {
  it("keeps school names at the university level (no college suffix)", () => {
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });

  it("stores the fixed Semantica capability map without changing PR facts", () => {
    const project = content.openSource;
    expect(project.graphNodes.map(({ id }: { id: string }) => id)).toEqual([
      "agent-context", "context-graph", "semantic-validation", "rule-decision", "auditable-execution",
    ]);
    expect(project.contributionDomains.map(({ id, prNumbers }: { id: string; prNumbers: number[] }) => [id, prNumbers])).toEqual([
      ["graph-data-adapters", [1081, 1113, 1217]],
      ["constraint-explanation", [1094]],
      ["temporal-stability", [1143]],
      ["rule-query-reasoning", [1077, 1096, 1208, 1243]],
      ["decision-model-contracts", [1153, 1160]],
      ["execution-pipeline", [1215, 1226]],
    ]);
    expect(project.contributions.map(({ number, status, summary, url }) => ({ number, status, summary, url }))).toEqual([
      { number: 1077, status: "merged", summary: "RETE alpha/beta Token 模型：为规则匹配提供 alpha/beta Token 层级的模型支撑。", url: "https://github.com/semantica-agi/semantica/pull/1077" },
      { number: 1081, status: "merged", summary: "ContextGraph 标准适配器：通过正式的 to_kg_dict() 适配器，统一 ContextGraph 与下游 RDF、时间查询所消费的数据形状。", url: "https://github.com/semantica-agi/semantica/pull/1081" },
      { number: 1094, status: "merged", summary: "SHACL 真实约束解释：从 sh:sourceShape 回溯真实约束值，替代硬编码解释。", url: "https://github.com/semantica-agi/semantica/pull/1094" },
      { number: 1096, status: "merged", summary: "规则 Action 与 provenance：将规则执行的动作与来源追溯关联。", url: "https://github.com/semantica-agi/semantica/pull/1096" },
      { number: 1113, status: "merged", summary: "RDF name→label 规范化：统一 RDF 导出中 name 与 label 的命名。", url: "https://github.com/semantica-agi/semantica/pull/1113" },
      { number: 1143, status: "merged", summary: "时间图指标：补充时间稳定性相关的指标说明。", url: "https://github.com/semantica-agi/semantica/pull/1143" },
      { number: 1215, status: "merged", summary: "pipeline 注册 handler 接线：将 pipeline 各阶段与注册 handler 正确连接，修正阶段调度接线。", url: "https://github.com/semantica-agi/semantica/pull/1215" },
      { number: 1217, status: "merged", summary: "serializer round-trip 依赖与 delta 元数据：保证序列化往返中依赖信息与增量元数据的正确性。", url: "https://github.com/semantica-agi/semantica/pull/1217" },
      { number: 1226, status: "merged", summary: "set_parallelism 依赖层并行执行：按依赖分层调度实现图执行并行化。", url: "https://github.com/semantica-agi/semantica/pull/1226" },
      { number: 1153, status: "open", summary: "决策模型契约：补齐决策模型 auto_generate_id 相关契约。", url: "https://github.com/semantica-agi/semantica/pull/1153" },
      { number: 1160, status: "open", summary: "PolicyEngine compliance 失败处理：将合规检查失败从静默结果改为显式抛出。", url: "https://github.com/semantica-agi/semantica/pull/1160" },
      { number: 1208, status: "open", summary: "冲突解决修复：修复冲突解决路径中的 unhashable TypeError。", url: "https://github.com/semantica-agi/semantica/pull/1208" },
      { number: 1243, status: "open", summary: "SPARQLReasoner.execute_query 三路径实现：store 委托、rdflib 回退与缓存隔离。", url: "https://github.com/semantica-agi/semantica/pull/1243" },
    ]);
  });
});