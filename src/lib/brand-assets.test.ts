import { describe, expect, it } from "vitest";

import type { SiteContent } from "@/content/schema";
import { validSiteContent } from "@/test/fixtures/site-content";
import { assertValidBrandAssets } from "./brand-assets";

describe("assertValidBrandAssets", () => {
  it("accepts configured non-empty local brand files", () => {
    expect(() => assertValidBrandAssets(validSiteContent)).not.toThrow();
  });

  it("fails when a configured local brand file is missing", () => {
    const content: SiteContent = structuredClone(validSiteContent);
    content.internships[0].logo.src = "/brands/not-present.png";

    expect(() => assertValidBrandAssets(content)).toThrow(/not-present\.png.*missing/i);
  });

  it("fails when a configured local brand file is empty", () => {
    const content: SiteContent = structuredClone(validSiteContent);
    content.internships[0].logo.src = "/brands/empty.png";
    expect(() => assertValidBrandAssets(content)).toThrow(/empty\.png.*empty/i);
  });
});