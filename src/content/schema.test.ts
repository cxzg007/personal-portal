import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateArchitecture, validateSiteContent } from "@/content/schema";

describe("validateSiteContent", () => {
  it("accepts the static architecture fixture", () => {
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
    ["invalid snapshot date", (copy: SiteContent) => { copy.openSource.snapshotDate = "2026/08/21"; }],
    ["non-HTTPS repository", (copy: SiteContent) => { copy.openSource.repositoryUrl = "http://github.com/semantica-agi/semantica"; }],
    ["non-blog article path", (copy: SiteContent) => { copy.openSource.articlePath = "/articles/semantica" as SiteContent["openSource"]["articlePath"]; }],
  ])("rejects %s", (_label, mutate) => {
    const copy = structuredClone(validSiteContent);
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
    Object.assign(input.openSource.contributions[0], { status: "done" });
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

  it.each([
    ["duplicate PR numbers", (copy: SiteContent) => { copy.openSource.contributions[1].number = copy.openSource.contributions[0].number; }],
    ["non-GitHub PR url", (copy: SiteContent) => { copy.openSource.contributions[0].url = "https://example.com/semantica/pull/1081"; }],
    ["non-positive PR number", (copy: SiteContent) => { copy.openSource.contributions[0].number = 0; }],
    ["twelve contributions", (copy: SiteContent) => { copy.openSource.contributions.pop(); }],
    ["contributions ordered ascending", (copy: SiteContent) => { copy.openSource.contributions.reverse(); }],
    ["unsupported visual kind", (copy: SiteContent) => { copy.caseStudies[0].visualKind = "timeline" as SiteContent["caseStudies"][number]["visualKind"]; }],
    ["duplicate tab labels", (copy: SiteContent) => { copy.caseStudies[1].tabLabel = copy.caseStudies[0].tabLabel; }],
  ])("rejects %s", (_label, mutate) => {
    const copy = structuredClone(validSiteContent);
    mutate(copy);
    expect(validateSiteContent(copy)).toEqual(expect.objectContaining({ ok: false }));
  });
});

describe("openSource strict schema closure", () => {
  it("rejects contributions carrying removed kind and scale fields", () => {
    const input = structuredClone(validSiteContent);
    Object.assign(input.openSource.contributions[0], { kind: "feat", scale: "1141+/44-" });
    expect(validateSiteContent(input)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          "openSource.contributions[0].kind is not an allowed field",
          "openSource.contributions[0].scale is not an allowed field",
        ]),
      }),
    );
  });

  it.each(["honors", "highlights", "starsSnapshot"] as const)(
    "rejects openSource with removed field %s",
    (field) => {
      const input = structuredClone(validSiteContent);
      Object.assign(input.openSource, { [field]: field === "starsSnapshot" ? 11400 : [] });
      expect(validateSiteContent(input)).toEqual(
        expect.objectContaining({
          ok: false,
          errors: expect.arrayContaining([
            `openSource.${field} is not an allowed field`,
          ]),
        }),
      );
    },
  );

  it("rejects architecture carrying an unknown field", () => {
    const input = structuredClone(validSiteContent);
    Object.assign(input.openSource.architecture, { pillars: [] });
    expect(validateSiteContent(input)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          "openSource.architecture.pillars is not an allowed field",
        ]),
      }),
    );
  });
});

const ARCHITECTURE = {
  layers: [
    {
      id: "data-knowledge",
      title: "数据与知识层",
      summary: "ContextGraph 结构化与知识建模。",
      capabilityIds: ["context-management", "knowledge-modeling"],
    },
    { id: "reasoning", title: "推理层", capabilityIds: ["deterministic-reasoning"] },
    { id: "governance", title: "治理层", capabilityIds: ["ontology-management"] },
    { id: "decision", title: "决策层", capabilityIds: ["decision-intelligence"] },
  ],
  capabilities: [
    { id: "context-management", label: "上下文管理" },
    { id: "knowledge-modeling", label: "知识建模" },
    { id: "deterministic-reasoning", label: "确定性推理" },
    { id: "ontology-management", label: "本体治理" },
    { id: "decision-intelligence", label: "决策智能" },
    { id: "end-to-end-traceability", label: "端到端溯源" },
  ],
  spanningCapabilityIds: ["end-to-end-traceability"],
};

const CONTRIBUTIONS = [
  { number: 1364, title: "对齐 enforce_decision_policy 与 record_decision 的默认推理上限。", url: "https://github.com/semantica-agi/semantica/pull/1364", status: "open" },
  { number: 1360, title: "决策因果追踪中启发式原因去重。", url: "https://github.com/semantica-agi/semantica/pull/1360", status: "open" },
  { number: 1226, title: "set_parallelism 依赖层并行执行。", url: "https://github.com/semantica-agi/semantica/pull/1226", status: "merged" },
  { number: 1143, title: "时间图指标。", url: "https://github.com/semantica-agi/semantica/pull/1143", status: "merged" },
];

describe("validateArchitecture", () => {
  it("accepts four ordered layers, six unique capabilities, and a valid spanning reference", () => {
    expect(validateArchitecture(ARCHITECTURE, CONTRIBUTIONS)).toEqual([]);
  });

  it("rejects layer capabilityIds that reference an unknown capability", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.layers[0].capabilityIds = ["context-management", "unknown-capability"];
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.layers[0].capabilityIds[1] must reference an existing capability",
    );
  });

  it("rejects duplicate layer ids", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.layers[1].id = copy.layers[0].id;
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.layers must not contain duplicate ids",
    );
  });

  it("rejects spanningCapabilityIds that reference an unknown capability", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.spanningCapabilityIds = ["unknown-capability"];
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.spanningCapabilityIds[0] must reference an existing capability",
    );
  });

  it("rejects duplicate capability ids", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.capabilities[1].id = copy.capabilities[0].id;
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.capabilities must not contain duplicate ids",
    );
  });

  it("rejects a capability referenced by no layer and no spanning entry", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.layers[2].capabilityIds = ["decision-intelligence"];
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.capabilities[3] (ontology-management) must be referenced by a layer or the spanning bar",
    );
  });

  it("rejects an empty layers array", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.layers = [];
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.layers must contain at least one entry",
    );
  });

  it("rejects a layer with an empty capabilityIds array", () => {
    const copy = structuredClone(ARCHITECTURE);
    copy.layers[0].capabilityIds = [];
    expect(validateArchitecture(copy, CONTRIBUTIONS)).toContain(
      "openSource.architecture.layers[0].capabilityIds must contain at least 1 entry",
    );
  });

  it("rejects contributions with duplicate PR numbers", () => {
    const copy = structuredClone(CONTRIBUTIONS);
    copy[1].number = copy[0].number;
    expect(validateArchitecture(ARCHITECTURE, copy)).toContain(
      "openSource.contributions must not contain duplicate PR numbers",
    );
  });

  it("rejects contributions not sorted by descending number", () => {
    const copy = structuredClone(CONTRIBUTIONS);
    copy.reverse();
    expect(validateArchitecture(ARCHITECTURE, copy)).toContain(
      "openSource.contributions must be sorted by descending PR number",
    );
  });

  it("rejects contributions with an unsupported status", () => {
    const copy = structuredClone(CONTRIBUTIONS);
    Object.assign(copy[0], { status: "review" });
    expect(validateArchitecture(ARCHITECTURE, copy)).toContain(
      "openSource.contributions[0].status must be merged or open",
    );
  });
});