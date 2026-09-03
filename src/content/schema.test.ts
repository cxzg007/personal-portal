import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateSiteContent, validateCapabilityMap } from "./schema";

describe("validateSiteContent", () => {
  it("accepts complete public site content", () => {
    expect(validateSiteContent(validSiteContent)).toEqual({ ok: true });
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

const nodes = [
  { id: "agent-context", title: "Agent Context", description: "接收上下文" },
  { id: "context-graph", title: "ContextGraph", description: "组织图结构" },
  { id: "semantic-validation", title: "RDF / SHACL / Temporal", description: "语义验证" },
  { id: "rule-decision", title: "Rule & Decision", description: "规则决策" },
  { id: "auditable-execution", title: "Auditable Execution", description: "可审计执行" },
];
const contributions = Array.from({ length: 13 }, (_, index) => ({
  number: index + 1,
  status: "merged",
  summary: `PR ${index + 1}`,
  url: `https://github.com/cx-org/semantica/pull/${index + 1}`,
}));
const domains = [
  { id: "graph-data-adapters", title: "图数据适配", outcome: "统一输入", nodeIds: ["context-graph"], prNumbers: [1, 2, 3] },
  { id: "constraint-explanation", title: "约束解释", outcome: "解释失败", nodeIds: ["semantic-validation"], prNumbers: [4] },
  { id: "temporal-stability", title: "时间稳定性", outcome: "稳定时间语义", nodeIds: ["semantic-validation"], prNumbers: [5] },
  { id: "rule-query-reasoning", title: "规则与查询推理", outcome: "完善推理", nodeIds: ["rule-decision"], prNumbers: [6, 7, 8, 9] },
  { id: "decision-model-contracts", title: "决策模型契约", outcome: "明确契约", nodeIds: ["rule-decision"], prNumbers: [10, 11] },
  { id: "execution-pipeline", title: "执行链路", outcome: "支持执行", nodeIds: ["auditable-execution"], prNumbers: [12, 13] },
];

it.each([
  ["unknown node", (copy: typeof domains) => { copy[0].nodeIds = ["missing-node"]; }, "openSource.contributionDomains[0].nodeIds[0] must reference an existing graph node"],
  ["unknown PR", (copy: typeof domains) => { copy[0].prNumbers = [9999]; }, "openSource.contributionDomains[0].prNumbers[0] must reference an existing contribution"],
  ["unmapped PR", (copy: typeof domains) => { copy.forEach((domain) => { domain.prNumbers = domain.prNumbers.filter((number) => number !== 1); }); }, "openSource.contributions PR #1 must belong to at least one contribution domain"],
])("rejects capability map with %s", (_label, mutate, expectedError) => {
  const copy = structuredClone(domains);
  mutate(copy);
  expect(validateCapabilityMap(nodes, copy, contributions)).toContain(expectedError);
});

it("rejects duplicate or misordered nodes and a non-six or misordered domain map", () => {
  const duplicateNodes = structuredClone(nodes);
  duplicateNodes[1].id = duplicateNodes[0].id;
  expect(validateCapabilityMap(duplicateNodes, domains, contributions)).toContain("openSource.graphNodes must not contain duplicate ids");
  expect(validateCapabilityMap(nodes.toReversed(), domains, contributions)).toContain("openSource.graphNodes must use the required ordered ids");
  expect(validateCapabilityMap(nodes, domains.slice(0, 5), contributions)).toContain("openSource.contributionDomains must contain exactly 6 entries");
  expect(validateCapabilityMap(nodes, domains.toReversed(), contributions)).toContain("openSource.contributionDomains must use the required ordered ids");
});
