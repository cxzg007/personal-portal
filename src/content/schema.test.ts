import { describe, expect, it } from "vitest";

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
});
