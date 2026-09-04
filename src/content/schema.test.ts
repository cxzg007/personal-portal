import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateCapabilityMap, validateSiteContent } from "@/content/schema";

describe("validateSiteContent", () => {
  it("rejects the legacy 13-entry open source fixture until content migration", () => {
    expect(validateSiteContent(validSiteContent)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          "openSource.contributions must contain exactly 15 entries",
        ]),
      }),
    );
  });

  it("rejects content without education", () => {
    const input = {
      ...validSiteContent,
      profile: { ...validSiteContent.profile, education: [] },
    };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "profile.education must contain at least one entry",
      ]),
    });
  });

  it("rejects content without an internship", () => {
    const input = { ...validSiteContent, internships: [] };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "internships must contain at least one entry",
      ]),
    });
  });

  it.each(["actions", "results", "stack"] as const)(
    "rejects an internship with an empty %s array",
    (field) => {
      const input = {
        ...validSiteContent,
        internships: [
          { ...validSiteContent.internships[0], [field]: [] },
          ...validSiteContent.internships.slice(1),
        ],
      };

      expect(validateSiteContent(input)).toEqual({
        ok: false,
        errors: expect.arrayContaining([
          `internships[0].${field} must contain at least 1 entry`,
        ]),
      });
    },
  );

  it.each(["constraints", "decisions", "tradeoffs", "stack"] as const)(
    "rejects a case study with an empty %s array",
    (field) => {
      const input = {
        ...validSiteContent,
        caseStudies: [
          { ...validSiteContent.caseStudies[0], [field]: [] },
          ...validSiteContent.caseStudies.slice(1),
        ],
      };

      expect(validateSiteContent(input)).toEqual({
        ok: false,
        errors: expect.arrayContaining([
          `caseStudies[0].${field} must contain at least 1 entry`,
        ]),
      });
    },
  );

  it("rejects a metric whose value is not a number", () => {
    const input = {
      ...validSiteContent,
      metrics: [{ ...validSiteContent.metrics[0], value: "3" }],
    };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["metrics[0].value must be a finite number"]),
    });
  });

  it("rejects a non-HTTPS external link", () => {
    const input = {
      ...validSiteContent,
      caseStudies: [
        {
          ...validSiteContent.caseStudies[0],
          links: [{ label: "Repository", url: "http://github.com/cxzg007" }],
        },
        ...validSiteContent.caseStudies.slice(1),
      ],
    };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "caseStudies[0].links[0].url must be an https URL",
      ]),
    });
  });

  it("rejects internal URLs in public text", () => {
    const input = {
      ...validSiteContent,
      about: ["部署说明见 http://localhost:3000/runbook。"],
    };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["about[0] contains disallowed internal URL"]),
    });
  });

  it("rejects secret-like text", () => {
    const input = {
      ...validSiteContent,
      about: ["temporary token: ghp_exampleTokenForTestingOnly"],
    };

    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["about[0] contains secret-like text"]),
    });
  });
  it.each([
    ["empty logo alt", (copy: SiteContent) => { copy.internships[0].logo.alt = ""; }],
    ["non-local logo", (copy: SiteContent) => { copy.internships[0].logo.src = "https://cdn.example/logo.png" as SiteContent["internships"][number]["logo"]["src"]; }],
    ["two-node journey", (copy: SiteContent) => { copy.internships[0].journey.pop(); }],
    ["empty highlights", (copy: SiteContent) => { copy.internships[0].highlights = []; }],
    ["project with empty highlights", (copy: SiteContent) => { copy.internships[0].projects![0].highlights = []; }],
    ["incomplete honor", (copy: SiteContent) => { copy.openSource.honors[0].rank = ""; }],
    ["only one honor", (copy: SiteContent) => { copy.openSource.honors.pop(); }],
    ["invalid snapshot date", (copy: SiteContent) => { copy.openSource.snapshotDate = "2026/08/21"; }],
    ["four graph nodes", (copy: SiteContent) => { copy.openSource.graphNodes.pop(); }],
    ["non-HTTPS repository", (copy: SiteContent) => { copy.openSource.repositoryUrl = "http://github.com/semantica-agi/semantica"; }],
    ["non-blog article path", (copy: SiteContent) => { copy.openSource.articlePath = "/articles/semantica" as SiteContent["openSource"]["articlePath"]; }],
    ["fractional stars snapshot", (copy: SiteContent) => { copy.openSource.starsSnapshot = 11400.5; }],
    ["negative stars snapshot", (copy: SiteContent) => { copy.openSource.starsSnapshot = -1; }],
  ])("rejects %s", (_label, mutate) => {
    const copy = structuredClone(validSiteContent) as SiteContent;
    mutate(copy);
    expect(validateSiteContent(copy)).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects content without the required technical identity", () => {
    const input = structuredClone(validSiteContent) as Record<string, unknown>;
    delete (input.profile as Record<string, unknown>).technicalId;
    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["profile.technicalId must be a non-empty string"]),
    });
  });

  it("rejects an invalid structured open-source contribution", () => {
    const input = structuredClone(validSiteContent);
    input.openSource.contributions[0].status = "done" as "merged";
    input.openSource.contributions[0].url = "http://github.com/example/pr/1";
    expect(validateSiteContent(input)).toEqual(expect.objectContaining({ ok: false }));
  });

  it("requires exactly four system projects", () => {
    const input = structuredClone(validSiteContent);
    input.caseStudies.pop();
    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["caseStudies must contain exactly 4 entries"]),
    });
  });

  it("rejects zero merged contributions", () => {
    const input = structuredClone(validSiteContent);
    input.openSource.contributions.forEach((contribution) => {
      contribution.status = "open";
    });
    expect(validateSiteContent(input)).toEqual(expect.objectContaining({ ok: false }));
  });

  it.each([
    ["duplicate PR numbers", (copy: SiteContent) => { copy.openSource.contributions[1].number = copy.openSource.contributions[0].number; }],
    ["non-GitHub PR url", (copy: SiteContent) => { copy.openSource.contributions[0].url = "https://example.com/semantica/pull/1081"; }],
    ["non-positive PR number", (copy: SiteContent) => { copy.openSource.contributions[0].number = 0; }],
    ["twelve contributions", (copy: SiteContent) => { copy.openSource.contributions.pop(); }],
    ["unsupported visual kind", (copy: SiteContent) => { copy.caseStudies[0].visualKind = "timeline" as SiteContent["caseStudies"][number]["visualKind"]; }],
    ["duplicate tab labels", (copy: SiteContent) => { copy.caseStudies[1].tabLabel = copy.caseStudies[0].tabLabel; }],
  ])("rejects %s", (_label, mutate) => {
    const copy = structuredClone(validSiteContent) as SiteContent;
    mutate(copy);
    expect(validateSiteContent(copy)).toEqual(expect.objectContaining({ ok: false }));
  });
});

const PILLARS = [
  { id: "context-management", title: "上下文管理", summary: "ContextGraph 结构化、可查询。", prNumbers: [1081] },
  { id: "knowledge-modeling", title: "知识建模", summary: "冲突检测与语义去重。", prNumbers: [1113, 1143] },
  { id: "deterministic-reasoning", title: "确定性推理", summary: "RETE/Datalog/SPARQL 可解释。", prNumbers: [1096, 1077] },
  { id: "ontology-management", title: "本体治理", summary: "SHACL 真实约束解释。", prNumbers: [1094] },
  { id: "decision-intelligence", title: "决策智能", summary: "决策为一等公民对象。", prNumbers: [1153] },
  { id: "end-to-end-traceability", title: "端到端溯源", summary: "执行链路并行与 PROV-O 审计。", prNumbers: [1215, 1217, 1226] },
];

// 简报原文 6 条 + 5 条补充：PILLARS 引用的 1113/1094/1153/1215/1217 不在简报 6 条样本中，
// 为使用例 1（返回 []）成立而补充；补充条目的 kind/scale 为维持 merged 排序的测试数据。
const CONTRIBUTIONS = [
  { number: 1096, status: "merged", kind: "feat", scale: "1141+/44-", summary: "规则驱动动作。", url: "https://github.com/semantica-agi/semantica/pull/1096" },
  { number: 1113, status: "merged", kind: "feat", scale: "330+/25-", summary: "RDF 规范化。", url: "https://github.com/semantica-agi/semantica/pull/1113" },
  { number: 1081, status: "merged", kind: "feat", scale: "277+/28-", summary: "KG 适配器。", url: "https://github.com/semantica-agi/semantica/pull/1081" },
  { number: 1094, status: "merged", kind: "feat", scale: "210+/18-", summary: "SHACL 约束解释。", url: "https://github.com/semantica-agi/semantica/pull/1094" },
  { number: 1226, status: "merged", kind: "fix", scale: "1204+/63-", summary: "依赖层并行。", url: "https://github.com/semantica-agi/semantica/pull/1226" },
  { number: 1215, status: "merged", kind: "fix", scale: "880+/40-", summary: "handler 接线修正。", url: "https://github.com/semantica-agi/semantica/pull/1215" },
  { number: 1217, status: "merged", kind: "fix", scale: "745+/51-", summary: "round-trip 序列化。", url: "https://github.com/semantica-agi/semantica/pull/1217" },
  { number: 1077, status: "merged", kind: "fix", scale: "620+/93-", summary: "RETE Token 模型。", url: "https://github.com/semantica-agi/semantica/pull/1077" },
  { number: 1143, status: "merged", kind: "fix", scale: "77+/3-", summary: "时间稳定性。", url: "https://github.com/semantica-agi/semantica/pull/1143" },
  { number: 1160, status: "open", kind: "fix", scale: "113+/20-", summary: "合规检查抛错。", url: "https://github.com/semantica-agi/semantica/pull/1160" },
  { number: 1153, status: "open", kind: "feat", scale: "510+/35-", summary: "决策模型契约。", url: "https://github.com/semantica-agi/semantica/pull/1153" },
];

describe("validateCapabilityMap", () => {
  it("accepts six ordered pillars whose prNumbers all resolve", () => {
    expect(validateCapabilityMap(PILLARS, CONTRIBUTIONS)).toEqual([]);
  });

  it("rejects pillar prNumbers that reference an unknown contribution", () => {
    const copy = structuredClone(PILLARS);
    copy[0].prNumbers = [9999];
    expect(validateCapabilityMap(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecturePillars[0].prNumbers[0] must reference an existing contribution",
    );
  });

  it("rejects a merged contribution missing from every pillar", () => {
    const copy = structuredClone(PILLARS);
    copy[1].prNumbers = [1113];
    expect(validateCapabilityMap(copy, CONTRIBUTIONS)).toContain(
      "openSource.contributions PR #1143 must belong to at least one architecture pillar",
    );
  });

  it("rejects duplicate pillar ids", () => {
    const copy = structuredClone(PILLARS);
    copy[1].id = copy[0].id;
    expect(validateCapabilityMap(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecturePillars must not contain duplicate ids",
    );
  });

  it("rejects pillars listed outside the required order", () => {
    const copy = structuredClone(PILLARS);
    [copy[0], copy[1]] = [copy[1], copy[0]];
    expect(validateCapabilityMap(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecturePillars must use the required ordered ids",
    );
  });

  it("rejects a merged fix contribution ordered before a feat", () => {
    const copy = structuredClone(CONTRIBUTIONS);
    const fixIndex = copy.findIndex((contribution) => contribution.number === 1143);
    const [fix] = copy.splice(fixIndex, 1);
    copy.unshift(fix);
    expect(validateCapabilityMap(PILLARS, copy)).toContain(
      "openSource.contributions merged entries must be ordered: feat before fix, then descending scale",
    );
  });

  it("rejects feat contributions not ordered by descending scale", () => {
    const copy = structuredClone(CONTRIBUTIONS);
    const featIndex = copy.findIndex((contribution) => contribution.number === 1081);
    const [feat] = copy.splice(featIndex, 1);
    copy.unshift(feat);
    expect(validateCapabilityMap(PILLARS, copy)).toContain(
      "openSource.contributions merged entries must be ordered: feat before fix, then descending scale",
    );
  });
});

describe("validateSiteContent contribution fields", () => {
  // TODO(Task 2): these cases depend on the legacy 13-entry fixture; enable
  // after the fixture migrates to the 15-entry architecture-pillar structure.
  const withKindsAndScales = () => {
    const copy = structuredClone(validSiteContent) as SiteContent;
    copy.openSource.contributions.forEach((contribution) => {
      contribution.kind = "feat";
      contribution.scale = "10+/2-";
    });
    return copy;
  };

  it.skip("rejects scale that does not match the NNN+/NNN- format", () => {
    const copy = withKindsAndScales();
    copy.openSource.contributions[0].scale = "1141";
    expect(validateSiteContent(copy)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          "openSource.contributions[0].scale must match the NNN+/NNN- format",
        ]),
      }),
    );
  });

  it.skip("rejects kind outside feat or fix", () => {
    const copy = withKindsAndScales();
    copy.openSource.contributions[0].kind = "chore";
    expect(validateSiteContent(copy)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          "openSource.contributions[0].kind must be feat or fix",
        ]),
      }),
    );
  });
});
