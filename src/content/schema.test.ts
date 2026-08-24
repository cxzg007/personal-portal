import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateSiteContent } from "./schema";

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
    ["merged count above contributions", (copy: SiteContent) => { copy.openSource.mergedCount = 8; }],
    ["four graph nodes", (copy: SiteContent) => { copy.openSource.graphNodes.pop(); }],
    ["non-HTTPS repository", (copy: SiteContent) => { copy.openSource.repositoryUrl = "http://github.com/semantica-agi/semantica"; }],
    ["non-blog article path", (copy: SiteContent) => { copy.openSource.articlePath = "/articles/semantica" as SiteContent["openSource"]["articlePath"]; }],
  ])("rejects %s", (_label, mutate) => {
    const copy = structuredClone(validSiteContent) as SiteContent;
    mutate(copy);
    expect(validateSiteContent(copy)).toEqual(expect.objectContaining({ ok: false }));
  });
});
