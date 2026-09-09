import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateSiteContent } from "@/content/schema";

describe("validateSiteContent", () => {
  it("accepts the static content fixture", () => {
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

  it("accepts dated project recognition with verifiable badge sources", () => {
    const input = structuredClone(validSiteContent);
    Object.assign(input.openSource, {
      recognition: {
        stars: 12455,
        checkedAt: "2026-09-09",
        honors: [{ rank: 1, platform: "GitHub Trending", title: "日榜", sourceUrl: "https://trendshift.io/api/badge/repositories/18986" }],
      },
    });
    expect(validateSiteContent(input)).toEqual({ ok: true });
  });

  it.each([
    { stars: -1, checkedAt: "2026-09-09", honors: [], error: "openSource.recognition.stars" },
    { stars: 12455, checkedAt: "today", honors: [], error: "openSource.recognition.checkedAt" },
    { stars: 12455, checkedAt: "2026-09-09", honors: [{ rank: 0, platform: "GitHub", title: "日榜", sourceUrl: "https://trendshift.io" }], error: "openSource.recognition.honors[0].rank" },
    { stars: 12455, checkedAt: "2026-09-09", honors: [{ rank: 1, platform: "GitHub", title: "日榜", sourceUrl: "javascript:alert(1)" }], error: "openSource.recognition.honors[0].sourceUrl" },
  ])("rejects invalid recognition data: $error", ({ error, ...recognition }) => {
    const input = structuredClone(validSiteContent);
    Object.assign(input.openSource, { recognition });
    const result = validateSiteContent(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((message) => message.startsWith(error))).toBe(true);
  });
});
