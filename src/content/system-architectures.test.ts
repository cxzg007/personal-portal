import { describe, expect, it } from "vitest";
import { validSiteContent } from "@/test/fixtures/site-content";
import type { SiteContent } from "./schema";
import { loadSiteContent } from "./load-site-content";
import {
  resolveSystemArchitecture,
  validateSystemArchitectures,
  loadSystemArchitectures,
  type SystemArchitecture,
} from "./system-architectures";

const content = validSiteContent as SiteContent;

const baseArchitectures: SystemArchitecture[] = [
  {
    projectId: "ontology-agent-platform",
    kind: "concept-flow",
    caption: "工程示意 · 按技术关注点简化",
    defaultNodeId: "node-a",
    nodes: [
      {
        id: "node-a",
        label: "节点 A",
        column: 0,
        row: 0,
        details: [{ kind: "case", field: "constraints", index: 0 }],
      },
    ],
    edges: [],
  },
  {
    projectId: "streaming-backend",
    kind: "concept-flow",
    caption: "工程示意 · 按技术关注点简化",
    defaultNodeId: "node-a",
    nodes: [
      {
        id: "node-a",
        label: "节点 A",
        column: 0,
        row: 0,
        details: [{ kind: "case", field: "decisions", index: 0 }],
      },
    ],
    edges: [],
  },
  {
    projectId: "knowledge-memory",
    kind: "concept-flow",
    caption: "工程示意 · 按技术关注点简化",
    defaultNodeId: "node-a",
    nodes: [
      {
        id: "node-a",
        label: "节点 A",
        column: 0,
        row: 0,
        details: [{ kind: "case", field: "result" }],
      },
    ],
    edges: [],
  },
  {
    projectId: "semantica-contributions",
    kind: "contribution-map",
    caption: "贡献领域 · 非完整项目架构",
    defaultNodeId: "node-a",
    nodes: [
      {
        id: "node-a",
        label: "节点 A",
        column: 0,
        row: 0,
        details: [{ kind: "pr", number: 1226 }],
      },
    ],
    edges: [],
  },
];

describe("validateSystemArchitectures", () => {
  it("accepts a minimal valid configuration", () => {
    const result = validateSystemArchitectures(
      structuredClone(baseArchitectures),
      content,
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects a non-array input", () => {
    const result = validateSystemArchitectures({ not: "an array" }, content);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.errors).toContain("systemArchitectures must be an array");
    }
  });

  it.each([
    [
      "wrong entry count",
      (input: SystemArchitecture[]) => {
        input.pop();
      },
      "must contain exactly 4 entries",
    ],
    [
      "duplicate projectId",
      (input: SystemArchitecture[]) => {
        input[1].projectId = input[0].projectId;
      },
      "duplicates an earlier entry",
    ],
    [
      "unknown projectId",
      (input: SystemArchitecture[]) => {
        input[0].projectId = "unknown-project";
      },
      "references unknown case study",
    ],
    [
      "missing configuration for a case study",
      (input: SystemArchitecture[]) => {
        input[0].projectId = "unknown-project";
      },
      'missing a configuration for case study "ontology-agent-platform"',
    ],
    [
      "unknown top-level field",
      (input: SystemArchitecture[]) => {
        (input[0] as Record<string, unknown>).unexpected = true;
      },
      "systemArchitectures[0].unexpected is not an allowed field",
    ],
    [
      "invalid kind",
      (input: SystemArchitecture[]) => {
        input[0].kind = "org-chart" as SystemArchitecture["kind"];
      },
      "systemArchitectures[0].kind must be concept-flow or contribution-map",
    ],
    [
      "blank caption",
      (input: SystemArchitecture[]) => {
        input[0].caption = "  ";
      },
      "systemArchitectures[0].caption must be a non-empty string",
    ],
    [
      "empty nodes",
      (input: SystemArchitecture[]) => {
        input[0].nodes = [];
      },
      "systemArchitectures[0].nodes must contain at least one node",
    ],
    [
      "duplicate node id",
      (input: SystemArchitecture[]) => {
        input[0].nodes.push(structuredClone(input[0].nodes[0]));
        input[0].nodes[1].column = 1;
      },
      'systemArchitectures[0].nodes[1].id duplicates node "node-a"',
    ],
    [
      "whitespace node id",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].id = " ";
      },
      "systemArchitectures[0].nodes[0].id must be a non-empty string",
    ],
    [
      "defaultNodeId references unknown node",
      (input: SystemArchitecture[]) => {
        input[0].defaultNodeId = "node-z";
      },
      'systemArchitectures[0].defaultNodeId references unknown node "node-z"',
    ],
    [
      "non-integer column",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].column = 1.5;
      },
      "systemArchitectures[0].nodes[0].column must be a finite non-negative integer",
    ],
    [
      "negative row",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].row = -1;
      },
      "systemArchitectures[0].nodes[0].row must be a finite non-negative integer",
    ],
    [
      "overlapping node coordinates",
      (input: SystemArchitecture[]) => {
        input[0].nodes.push({
          id: "node-b",
          label: "节点 B",
          column: 0,
          row: 0,
          details: [{ kind: "case", field: "result" }],
        });
      },
      "overlaps nodes[0]",
    ],
    [
      "unknown node field",
      (input: SystemArchitecture[]) => {
        (input[0].nodes[0] as Record<string, unknown>).icon = "x";
      },
      "systemArchitectures[0].nodes[0].icon is not an allowed field",
    ],
    [
      "edge to unknown node",
      (input: SystemArchitecture[]) => {
        input[0].edges = [{ from: "node-a", to: "node-z" }];
      },
      'systemArchitectures[0].edges[0].to references unknown node "node-z"',
    ],
    [
      "self-referencing edge",
      (input: SystemArchitecture[]) => {
        input[0].edges = [{ from: "node-a", to: "node-a" }];
      },
      "must not connect a node to itself",
    ],
    [
      "duplicate edge",
      (input: SystemArchitecture[]) => {
        input[0].nodes.push({
          id: "node-b",
          label: "节点 B",
          column: 1,
          row: 0,
          details: [{ kind: "case", field: "result" }],
        });
        input[0].edges = [
          { from: "node-a", to: "node-b" },
          { from: "node-a", to: "node-b" },
        ];
      },
      "duplicates an earlier edge",
    ],
    [
      "empty details",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].details = [];
      },
      "must contain at least one reference",
    ],
    [
      "index out of bounds",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].details = [
          { kind: "case", field: "constraints", index: 1 },
        ];
      },
      "is out of bounds for caseStudies",
    ],
    [
      "negative index",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].details = [
          { kind: "case", field: "decisions", index: -1 },
        ];
      },
      "must be a non-negative integer",
    ],
    [
      "unknown PR number",
      (input: SystemArchitecture[]) => {
        input[3].nodes[0].details = [{ kind: "pr", number: 9999 }];
      },
      "does not match any openSource.contributions entry",
    ],
    [
      "result reference with index",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].details = [
          { kind: "case", field: "result", index: 0 } as never,
        ];
      },
      "is not an allowed field",
    ],
    [
      "pr reference with extra field",
      (input: SystemArchitecture[]) => {
        input[3].nodes[0].details = [
          { kind: "pr", number: 1226, title: "额外字段" } as never,
        ];
      },
      "is not an allowed field",
    ],
    [
      "unknown detail kind",
      (input: SystemArchitecture[]) => {
        input[0].nodes[0].details = [
          { kind: "metric", value: 1 } as never,
        ];
      },
      ".kind must be case or pr",
    ],
  ])("rejects %s", (_name, mutate, expectedError) => {
    const input = structuredClone(baseArchitectures);
    mutate(input);
    const result = validateSystemArchitectures(input, content);
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining(expectedError)]),
      );
    }
  });
});

describe("resolveSystemArchitecture", () => {
  it("resolves case references against the matched case study", () => {
    const resolved = resolveSystemArchitecture(
      structuredClone(baseArchitectures[0]),
      content,
    );
    expect(resolved.nodes[0].details).toEqual([
      { label: "输入约束", text: content.caseStudies[0].constraints[0] },
    ]);
  });

  it("resolves PR references with url and status from contributions", () => {
    const resolved = resolveSystemArchitecture(
      structuredClone(baseArchitectures[3]),
      content,
    );
    expect(resolved.nodes[0].details).toEqual([
      {
        label: "公开贡献",
        text: "set_parallelism 依赖层并行执行",
        href: "https://github.com/semantica-agi/semantica/pull/1226",
        status: "merged",
      },
    ]);
  });

  it("resolves result and contribution text references", () => {
    const resolved = resolveSystemArchitecture(
      structuredClone(baseArchitectures[2]),
      content,
    );
    expect(resolved.nodes[0].details).toEqual([
      { label: "项目结果", text: content.caseStudies[2].result },
    ]);
  });

  it("throws for an unknown project", () => {
    const config = structuredClone(baseArchitectures[0]);
    config.projectId = "unknown-project";
    expect(() => resolveSystemArchitecture(config, content)).toThrow(
      /unknown project/,
    );
  });
});

describe("loadSystemArchitectures with real content", () => {
  const realContent = loadSiteContent();
  const graphs = loadSystemArchitectures(realContent);

  it("loads one architecture per case study", () => {
    expect(graphs.map((graph) => graph.projectId)).toEqual(
      realContent.caseStudies.map((study) => study.id),
    );
  });

  it("binds the execution node to decisions[3] instead of decisions[0]", () => {
    const ontology = graphs.find(
      (graph) => graph.projectId === "ontology-agent-platform",
    );
    expect(ontology).toBeDefined();
    const execution = ontology?.nodes.find((node) => node.id === "execution");
    expect(execution).toBeDefined();
    const project = realContent.caseStudies.find(
      (study) => study.id === "ontology-agent-platform",
    );
    expect(project).toBeDefined();
    if (!ontology || !execution || !project) {
      throw new Error("unreachable");
    }
    const texts = execution.details.map((detail) => detail.text);
    expect(texts).toContain(project.decisions[3]);
    expect(texts).not.toContain(project.decisions[0]);
    expect(texts).toContain(project.constraints[2]);
    expect(texts).toContain(project.constraints[3]);
  });

  it("resolves Semantica PR details with href and merged status", () => {
    const semantica = graphs.find(
      (graph) => graph.projectId === "semantica-contributions",
    );
    expect(semantica).toBeDefined();
    if (!semantica) {
      throw new Error("unreachable");
    }
    expect(semantica.kind).toBe("contribution-map");
    expect(semantica.edges).toEqual([]);
    const executionNode = semantica.nodes.find(
      (node) => node.id === "execution",
    );
    expect(executionNode).toBeDefined();
    const prDetails = executionNode?.details.filter(
      (detail) => detail.label === "公开贡献",
    );
    expect(prDetails?.map((detail) => detail.status)).toEqual([
      "merged",
      "merged",
      "merged",
    ]);
    expect(
      prDetails?.every((detail) => detail.href?.startsWith("https://")),
    ).toBe(true);
  });

  it("keeps every node bound to explicit, non-empty details", () => {
    graphs.forEach((graph) => {
      expect(graph.nodes.length).toBeGreaterThan(0);
      graph.nodes.forEach((node) => {
        expect(node.details.length).toBeGreaterThan(0);
        node.details.forEach((detail) => {
          expect(detail.text.length).toBeGreaterThan(0);
        });
      });
      expect(graph.nodes.map((node) => node.id)).toContain(
        graph.defaultNodeId,
      );
    });
  });
});