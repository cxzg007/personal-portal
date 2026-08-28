import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
) as { profile: { education: Array<{ school: string }> } };

describe("site-content education copy", () => {
  it("keeps school names at the university level (no college suffix)", () => {
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });
});