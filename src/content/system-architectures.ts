import type { CaseStudy, SiteContent, ValidationResult } from "./schema";
import systemArchitecturesJson from "../../content/system-architectures.json";

export type ArchitectureDetailRef =
  | { kind: "case"; field: "constraints" | "decisions"; index: number }
  | { kind: "case"; field: "result" | "contribution" }
  | { kind: "pr"; number: number };

export type ArchitectureNode = {
  id: string;
  label: string;
  column: number;
  row: number;
  details: ArchitectureDetailRef[];
};

export type SystemArchitecture = {
  projectId: string;
  kind: "concept-flow" | "contribution-map";
  caption: string;
  defaultNodeId: string;
  nodes: ArchitectureNode[];
  edges: Array<{ from: string; to: string }>;
};

export type ResolvedArchitectureDetail = {
  label: "输入约束" | "工程决策" | "项目结果" | "职责范围" | "公开贡献";
  text: string;
  href?: string;
  status?: "merged" | "open";
};

export type ResolvedArchitectureNode = Omit<ArchitectureNode, "details"> & {
  details: ResolvedArchitectureDetail[];
};

export type ResolvedSystemArchitecture = Omit<SystemArchitecture, "nodes"> & {
  nodes: ResolvedArchitectureNode[];
};

type UnknownRecord = Record<string, unknown>;

const ARCHITECTURE_FIELDS = new Set([
  "projectId",
  "kind",
  "caption",
  "defaultNodeId",
  "nodes",
  "edges",
]);

const NODE_FIELDS = new Set(["id", "label", "column", "row", "details"]);

const EDGE_FIELDS = new Set(["from", "to"]);

const ARCHITECTURE_KINDS = new Set(["concept-flow", "contribution-map"]);

const CASE_LIST_FIELDS = new Set(["constraints", "decisions"]);

const CASE_TEXT_FIELDS = new Set(["result", "contribution"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function findCaseStudy(content: SiteContent, projectId: string): CaseStudy | undefined {
  return content.caseStudies.find((study) => study.id === projectId);
}

function validateDetailRef(
  detail: unknown,
  path: string,
  caseStudy: CaseStudy | undefined,
  prNumbers: ReadonlySet<number>,
  errors: string[],
): void {
  if (!isRecord(detail)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (detail.kind === "case") {
    const field = detail.field;
    const fieldIsKnown =
      typeof field === "string" &&
      (CASE_LIST_FIELDS.has(field) || CASE_TEXT_FIELDS.has(field));

    if (!fieldIsKnown) {
      errors.push(
        `${path}.field must be one of constraints, decisions, result, contribution`,
      );
      return;
    }

    const fieldAllowsIndex = CASE_LIST_FIELDS.has(field);
    Object.keys(detail).forEach((key) => {
      const keyIsAllowed =
        key === "kind" || key === "field" || (key === "index" && fieldAllowsIndex);
      if (!keyIsAllowed) {
        errors.push(`${path}.${key} is not an allowed field`);
      }
    });

    if (!fieldAllowsIndex) {
      return;
    }

    const index = detail.index;
    if (typeof index !== "number" || !Number.isInteger(index)) {
      errors.push(`${path}.index must be an integer`);
      return;
    }
    if (index < 0) {
      errors.push(`${path}.index must be a non-negative integer`);
      return;
    }
    if (caseStudy) {
      const list = field === "constraints" ? caseStudy.constraints : caseStudy.decisions;
      if (index >= list.length) {
        errors.push(
          `${path}.index ${index} is out of bounds for caseStudies "${caseStudy.id}".${field} (length ${list.length})`,
        );
      }
    }
    return;
  }

  if (detail.kind === "pr") {
    Object.keys(detail).forEach((key) => {
      if (key !== "kind" && key !== "number") {
        errors.push(`${path}.${key} is not an allowed field`);
      }
    });

    const prNumber = detail.number;
    if (
      typeof prNumber !== "number" ||
      !Number.isInteger(prNumber) ||
      prNumber <= 0
    ) {
      errors.push(`${path}.number must be a positive integer`);
      return;
    }
    if (!prNumbers.has(prNumber)) {
      errors.push(
        `${path}.number ${prNumber} does not match any openSource.contributions entry`,
      );
    }
    return;
  }

  errors.push(`${path}.kind must be case or pr`);
}

export function validateSystemArchitectures(
  input: unknown,
  content: SiteContent,
): ValidationResult {
  if (!Array.isArray(input)) {
    return { ok: false, errors: ["systemArchitectures must be an array"] };
  }

  const errors: string[] = [];
  const caseStudies = content.caseStudies;
  const prNumbers = new Set(
    content.openSource.contributions.map((contribution) => contribution.number),
  );
  const knownProjectIds = new Set(caseStudies.map((study) => study.id));
  const seenProjectIds = new Set<string>();

  if (input.length !== caseStudies.length) {
    errors.push(
      `systemArchitectures must contain exactly ${caseStudies.length} entries, received ${input.length}`,
    );
  }

  input.forEach((entry, architectureIndex) => {
    const path = `systemArchitectures[${architectureIndex}]`;
    if (!isRecord(entry)) {
      errors.push(`${path} must be an object`);
      return;
    }

    Object.keys(entry).forEach((field) => {
      if (!ARCHITECTURE_FIELDS.has(field)) {
        errors.push(`${path}.${field} is not an allowed field`);
      }
    });

    let caseStudy: CaseStudy | undefined;
    if (isNonEmptyString(entry.projectId)) {
      if (seenProjectIds.has(entry.projectId)) {
        errors.push(`${path}.projectId duplicates an earlier entry`);
      } else {
        seenProjectIds.add(entry.projectId);
      }
      if (!knownProjectIds.has(entry.projectId)) {
        errors.push(
          `${path}.projectId references unknown case study "${entry.projectId}"`,
        );
      }
      caseStudy = findCaseStudy(content, entry.projectId);
    } else {
      errors.push(`${path}.projectId must be a non-empty string`);
    }

    if (
      typeof entry.kind !== "string" ||
      !ARCHITECTURE_KINDS.has(entry.kind)
    ) {
      errors.push(`${path}.kind must be concept-flow or contribution-map`);
    }

    if (!isNonEmptyString(entry.caption)) {
      errors.push(`${path}.caption must be a non-empty string`);
    }

    const nodeIds = new Set<string>();
    if (!Array.isArray(entry.nodes)) {
      errors.push(`${path}.nodes must be an array`);
    } else if (entry.nodes.length === 0) {
      errors.push(`${path}.nodes must contain at least one node`);
    } else {
      const coordinates = new Map<string, number>();
      entry.nodes.forEach((nodeEntry, nodeIndex) => {
        const nodePath = `${path}.nodes[${nodeIndex}]`;
        if (!isRecord(nodeEntry)) {
          errors.push(`${nodePath} must be an object`);
          return;
        }

        Object.keys(nodeEntry).forEach((field) => {
          if (!NODE_FIELDS.has(field)) {
            errors.push(`${nodePath}.${field} is not an allowed field`);
          }
        });

        if (isNonEmptyString(nodeEntry.id)) {
          if (nodeIds.has(nodeEntry.id)) {
            errors.push(`${nodePath}.id duplicates node "${nodeEntry.id}"`);
          } else {
            nodeIds.add(nodeEntry.id);
          }
        } else {
          errors.push(`${nodePath}.id must be a non-empty string`);
        }

        if (!isNonEmptyString(nodeEntry.label)) {
          errors.push(`${nodePath}.label must be a non-empty string`);
        }

        (["column", "row"] as const).forEach((axis) => {
          const value = nodeEntry[axis];
          if (
            typeof value !== "number" ||
            !Number.isInteger(value) ||
            value < 0
          ) {
            errors.push(
              `${nodePath}.${axis} must be a finite non-negative integer`,
            );
          }
        });

        if (
          typeof nodeEntry.column === "number" &&
          typeof nodeEntry.row === "number" &&
          Number.isInteger(nodeEntry.column) &&
          Number.isInteger(nodeEntry.row)
        ) {
          const coordinateKey = `${nodeEntry.column}:${nodeEntry.row}`;
          const firstIndex = coordinates.get(coordinateKey);
          if (firstIndex !== undefined) {
            errors.push(
              `${nodePath} (column ${nodeEntry.column}, row ${nodeEntry.row}) overlaps nodes[${firstIndex}]`,
            );
          } else {
            coordinates.set(coordinateKey, nodeIndex);
          }
        }

        if (!Array.isArray(nodeEntry.details)) {
          errors.push(`${nodePath}.details must be an array`);
        } else if (nodeEntry.details.length === 0) {
          errors.push(`${nodePath}.details must contain at least one reference`);
        } else {
          nodeEntry.details.forEach((detailEntry, detailIndex) => {
            validateDetailRef(
              detailEntry,
              `${nodePath}.details[${detailIndex}]`,
              caseStudy,
              prNumbers,
              errors,
            );
          });
        }
      });
    }

    if (!isNonEmptyString(entry.defaultNodeId)) {
      errors.push(`${path}.defaultNodeId must be a non-empty string`);
    } else if (nodeIds.size > 0 && !nodeIds.has(entry.defaultNodeId)) {
      errors.push(
        `${path}.defaultNodeId references unknown node "${entry.defaultNodeId}"`,
      );
    }

    if (!Array.isArray(entry.edges)) {
      errors.push(`${path}.edges must be an array`);
    } else {
      const seenEdges = new Set<string>();
      entry.edges.forEach((edgeEntry, edgeIndex) => {
        const edgePath = `${path}.edges[${edgeIndex}]`;
        if (!isRecord(edgeEntry)) {
          errors.push(`${edgePath} must be an object`);
          return;
        }

        Object.keys(edgeEntry).forEach((field) => {
          if (!EDGE_FIELDS.has(field)) {
            errors.push(`${edgePath}.${field} is not an allowed field`);
          }
        });

        (["from", "to"] as const).forEach((side) => {
          const endpoint = edgeEntry[side];
          if (!isNonEmptyString(endpoint)) {
            errors.push(`${edgePath}.${side} must be a non-empty string`);
          } else if (nodeIds.size > 0 && !nodeIds.has(endpoint)) {
            errors.push(
              `${edgePath}.${side} references unknown node "${endpoint}"`,
            );
          }
        });

        const from = edgeEntry.from;
        const to = edgeEntry.to;
        if (typeof from === "string" && typeof to === "string") {
          if (from === to) {
            errors.push(`${edgePath} must not connect a node to itself`);
          }
          const edgeKey = `${from}->${to}`;
          if (seenEdges.has(edgeKey)) {
            errors.push(`${edgePath} duplicates an earlier edge`);
          } else {
            seenEdges.add(edgeKey);
          }
        }
      });
    }
  });

  knownProjectIds.forEach((projectId) => {
    if (!seenProjectIds.has(projectId)) {
      errors.push(
        `systemArchitectures is missing a configuration for case study "${projectId}"`,
      );
    }
  });

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function resolveDetail(
  detail: ArchitectureDetailRef,
  caseStudy: CaseStudy,
  contributionsByNumber: ReadonlyMap<number, { title: string; url: string; status: "merged" | "open" }>,
): ResolvedArchitectureDetail {
  if (detail.kind === "case") {
    if (detail.field === "constraints" || detail.field === "decisions") {
      const text = caseStudy[detail.field][detail.index];
      if (text === undefined) {
        throw new Error(
          `Cannot resolve caseStudies "${caseStudy.id}".${detail.field}[${detail.index}]`,
        );
      }
      return {
        label: detail.field === "constraints" ? "输入约束" : "工程决策",
        text,
      };
    }
    if (detail.field === "result") {
      return { label: "项目结果", text: caseStudy.result };
    }
    return { label: "职责范围", text: caseStudy.contribution };
  }

  const contribution = contributionsByNumber.get(detail.number);
  if (!contribution) {
    throw new Error(
      `Cannot resolve PR #${detail.number} for architecture "${caseStudy.id}"`,
    );
  }
  return {
    label: "公开贡献",
    text: contribution.title,
    href: contribution.url,
    status: contribution.status,
  };
}

export function resolveSystemArchitecture(
  config: SystemArchitecture,
  content: SiteContent,
): ResolvedSystemArchitecture {
  const caseStudy = findCaseStudy(content, config.projectId);
  if (!caseStudy) {
    throw new Error(
      `Cannot resolve architecture for unknown project "${config.projectId}"`,
    );
  }
  const contributionsByNumber = new Map(
    content.openSource.contributions.map((contribution) => [
      contribution.number,
      contribution,
    ]),
  );

  return {
    ...config,
    nodes: config.nodes.map((node) => ({
      ...node,
      details: node.details.map((detail) =>
        resolveDetail(detail, caseStudy, contributionsByNumber),
      ),
    })),
  };
}

export function loadSystemArchitectures(
  content: SiteContent,
): ResolvedSystemArchitecture[] {
  const input: unknown = systemArchitecturesJson;
  const validation = validateSystemArchitectures(input, content);
  if (!validation.ok) {
    throw new Error(
      `System architecture validation failed:\n- ${validation.errors.join("\n- ")}`,
    );
  }
  return (input as SystemArchitecture[]).map((config) =>
    resolveSystemArchitecture(config, content),
  );
}