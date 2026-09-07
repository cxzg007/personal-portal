import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
) as {
  profile: { education: Array<{ school: string }> };
  openSource: {
    snapshotDate: string;
    contributions: Array<{ number: number; title: string; url: string; status: string }>;
  };
};

describe("site-content education copy", () => {
  it("keeps school names at the university level (no college suffix)", () => {
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });
});

describe("site-content openSource contributions", () => {
  it("keeps 15 PR records with only number/title/url/status and merged entries descending by number", () => {
    const { openSource } = content;
    expect(openSource.snapshotDate).toBe("2026-09-04");
    expect(openSource.contributions).toHaveLength(15);
    for (const contribution of openSource.contributions) {
      expect(Object.keys(contribution).sort()).toEqual(["number", "status", "title", "url"]);
    }
    const numbers = openSource.contributions.map((contribution) => contribution.number);
    expect(numbers).toEqual([1364, 1360, 1243, 1226, 1217, 1215, 1208, 1160, 1153, 1143, 1113, 1096, 1094, 1081, 1077]);
    const merged = openSource.contributions.filter((contribution) => contribution.status === "merged");
    expect(merged).toHaveLength(10);
    expect(merged.map((contribution) => contribution.number)).toEqual([1226, 1217, 1215, 1153, 1143, 1113, 1096, 1094, 1081, 1077]);
  });
});