import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateSiteContent } from "./schema";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
);

describe("public resume content", () => {
  it("loads the resume through the production schema", () => {
    expect(validateSiteContent(content)).toEqual({ ok: true });
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });

  it("supports two evidence-backed homepage metrics", () => {
    expect(content.metrics.map(({ value, label }: { value: number; label: string }) => ({ value, label }))).toEqual([
      { value: 3, label: "实习经历" },
      { value: 16, label: "已合并 PR" },
    ]);
  });

  it("exposes all sixteen verified merged contributions without private fields", () => {
    expect(content.openSource.snapshotDate).toBe("2026-09-20");
    expect(content.openSource.recognition.stars).toBe(13300);
    const contributions = content.openSource.contributions;
    expect(contributions.map((pr: { number: number }) => pr.number)).toEqual([
      1544, 1364, 1360, 1243, 1226, 1217, 1215, 1208, 1160, 1153, 1143, 1113, 1096, 1094, 1081, 1077,
    ]);
    for (const contribution of contributions) {
      expect(Object.keys(contribution).sort()).toEqual(["number", "status", "title", "url"]);
      expect(contribution.status).toBe("merged");
      expect(contribution.url).toBe(`https://github.com/semantica-agi/semantica/pull/${contribution.number}`);
    }
  });

  it("describes exactly the three internships from the resume", () => {
    expect(
      content.internships.map(({ company, role, period }: { company: string; role: string; period: string }) => ({
        company,
        role,
        period,
      })),
    ).toEqual([
      { company: "京东", role: "后端开发实习生", period: "2026-07 – 至今" },
      { company: "智元机器人", role: "机器人 Agent 开发实习生", period: "2026-06 – 2026-07" },
      { company: "中国船舶集团 722 研究所", role: "研发实习生", period: "2025-07 – 2026-05" },
    ]);
    expect(
      content.internships.flatMap((internship: { projects?: Array<{ id: string }> }) =>
        (internship.projects ?? []).map((project) => project.id),
      ),
    ).toEqual(["findata-platform", "clip-player", "uav-pilot"]);
  });

  it("replaces the knowledge-memory case with the RAG agent case", () => {
    expect(
      content.caseStudies.map(({ id, tabLabel }: { id: string; tabLabel: string }) => [id, tabLabel]),
    ).toEqual([
      ["ontology-agent-platform", "Ontology Agent"],
      ["streaming-backend", "Streaming Backend"],
      ["rag-agent", "RAG Agent"],
      ["semantica-contributions", "Semantica"],
    ]);
  });

  it("keeps every case study wired to a rendered architecture", () => {
    const architectures = JSON.parse(
      readFileSync(path.join(process.cwd(), "content", "system-architectures.json"), "utf8"),
    );
    expect(architectures.map((architecture: { projectId: string }) => architecture.projectId)).toEqual(
      content.caseStudies.map((caseStudy: { id: string }) => caseStudy.id),
    );
  });
});