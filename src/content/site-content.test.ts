import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
) as {
  profile: { education: Array<{ school: string }> };
  openSource: {
    snapshotDate: string;
    architecturePillars: Array<{ id: string; prNumbers: number[] }>;
    contributions: Array<{
      number: number;
      status: string;
      kind: string;
      scale: string;
    }>;
  };
};

describe("site-content education copy", () => {
  it("keeps school names at the university level (no college suffix)", () => {
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });

  it("stores the fixed Semantica architecture map without changing PR facts", () => {
    const project = content.openSource;
    expect(project.snapshotDate).toBe("2026-09-04");
    expect(project.architecturePillars.map(({ id, prNumbers }) => [id, prNumbers])).toEqual([
      ["context-management", [1081]],
      ["knowledge-modeling", [1113, 1143]],
      ["deterministic-reasoning", [1096, 1077]],
      ["ontology-management", [1094]],
      ["decision-intelligence", [1153]],
      ["end-to-end-traceability", [1215, 1217, 1226]],
    ]);
    expect(project.contributions.map(({ number, status, kind, scale }) => ({ number, status, kind, scale }))).toEqual([
      { number: 1096, status: "merged", kind: "feat", scale: "1141+/44-" },
      { number: 1081, status: "merged", kind: "feat", scale: "277+/28-" },
      { number: 1226, status: "merged", kind: "fix", scale: "1204+/63-" },
      { number: 1077, status: "merged", kind: "fix", scale: "620+/93-" },
      { number: 1113, status: "merged", kind: "fix", scale: "200+/6-" },
      { number: 1217, status: "merged", kind: "fix", scale: "144+/2-" },
      { number: 1094, status: "merged", kind: "fix", scale: "141+/4-" },
      { number: 1153, status: "merged", kind: "fix", scale: "106+/14-" },
      { number: 1215, status: "merged", kind: "fix", scale: "99+/8-" },
      { number: 1143, status: "merged", kind: "fix", scale: "77+/3-" },
      { number: 1160, status: "open", kind: "fix", scale: "113+/20-" },
      { number: 1208, status: "open", kind: "fix", scale: "137+/11-" },
      { number: 1243, status: "open", kind: "feat", scale: "1095+/53-" },
      { number: 1360, status: "open", kind: "fix", scale: "46+/3-" },
      { number: 1364, status: "open", kind: "fix", scale: "82+/5-" },
    ]);
  });
});