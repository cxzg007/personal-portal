export type Education = {
  school: string;
  major: string;
  degree: string;
  graduationYear: number;
  highlights: string[];
};

export type BrandAsset = {
  src: `/brands/${string}.${"png" | "svg" | "webp"}`;
  alt: string;
  theme: "jd" | "agibot" | "cssc" | "semantica";
};

export type JourneyNode = { label: string; detail: string };

export type InternshipProject = {
  id: string;
  name: string;
  summary: string;
  highlights: string[];
};

export type OpenSourceContribution = {
  number: number;
  status: "merged" | "open" | "review";
  summary: string;
  url: string;
};

export type ProjectGraphNode = {
  id: string;
  title: string;
  description: string;
};

export type ContributionDomain = {
  id: string;
  title: string;
  outcome: string;
  nodeIds: string[];
  prNumbers: number[];
};

export type OpenSourceProject = {
  name: string;
  logo: BrandAsset;
  identity: string;
  background: string;
  snapshotDate: string;
  starsSnapshot: number;
  honors: Array<{ platform: string; rank: string; period: string; evidence: string }>;
  contributions: OpenSourceContribution[];
  graphNodes: [ProjectGraphNode, ProjectGraphNode, ProjectGraphNode, ProjectGraphNode, ProjectGraphNode];
  contributionDomains: ContributionDomain[];
  repositoryUrl: string;
  articlePath: `/blog/${string}`;
};

export type Internship = {
  id: string;
  company: string;
  team: string;
  role: string;
  period: string;
  context: string;
  actions: string[];
  results: string[];
  ownership: string;
  stack: string[];
  logo: BrandAsset;
  valueHeadline: string;
  journey: [JourneyNode, JourneyNode, JourneyNode];
  highlights: string[];
  projects?: InternshipProject[];
  status: "Shipped" | "Optimized" | "Deployed";
};

export type CaseStudy = {
  id: string;
  tabLabel: "Ontology Agent" | "Streaming Backend" | "Knowledge Memory" | "Semantica";
  visualKind: "ontology" | "streaming" | "memory" | "graph";
  title: string;
  problem: string;
  constraints: string[];
  decisions: string[];
  tradeoffs: string[];
  contribution: string;
  result: string;
  stack: string[];
  links: Array<{ label: string; url: string }>;
};

export type SiteContent = {
  profile: {
    name: string;
    technicalId: string;
    targetRole: "AI Agent / 后端开发";
    positioning: string;
    recruitingStatus: string;
    education: Education[];
    email: string;
    github: string;
  };
  metrics: Array<{ label: string; value: number; suffix: string; evidence: string }>;
  internships: Internship[];
  openSource: OpenSourceProject;
  caseStudies: CaseStudy[];
  about: string[];
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

type UnknownRecord = Record<string, unknown>;

const INTERNAL_URL_PATTERN = /(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})/i;
const SECRET_PATTERN = /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|\b(?:ghp_|github_pat_|sk-(?:proj-)?|AKIA|xox[abprs]-|Bearer\s+)/i;
const INTERNSHIP_STATUSES = new Set<Internship["status"]>([
  "Shipped",
  "Optimized",
  "Deployed",
]);
const CASE_STUDY_TAB_LABELS = new Set<CaseStudy["tabLabel"]>([
  "Ontology Agent",
  "Streaming Backend",
  "Knowledge Memory",
  "Semantica",
]);
const CASE_STUDY_VISUAL_KINDS = new Set<CaseStudy["visualKind"]>([
  "ontology",
  "streaming",
  "memory",
  "graph",
]);
const CONTRIBUTION_STATUSES = new Set<OpenSourceContribution["status"]>([
  "merged",
  "open",
  "review",
]);
const GITHUB_PR_URL_PATTERN = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+$/;
const CAPABILITY_NODE_ORDER = [
  "agent-context",
  "context-graph",
  "semantic-validation",
  "rule-decision",
  "auditable-execution",
] as const;
const CONTRIBUTION_DOMAIN_ORDER = [
  "graph-data-adapters",
  "constraint-explanation",
  "temporal-stability",
  "rule-query-reasoning",
  "decision-model-contracts",
  "execution-pipeline",
] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSiteContent(input: unknown): ValidationResult {
  const errors: string[] = [];
  const checkText = (value: unknown, path: string): string | undefined => {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${path} must be a non-empty string`);
      return undefined;
    }

    if (INTERNAL_URL_PATTERN.test(value)) {
      errors.push(`${path} contains disallowed internal URL`);
    }
    if (SECRET_PATTERN.test(value)) {
      errors.push(`${path} contains secret-like text`);
    }
    return value;
  };
  const checkStringArray = (value: unknown, path: string, minLength = 0) => {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array`);
      return;
    }
    if (value.length < minLength) {
      errors.push(`${path} must contain at least ${minLength} entr${minLength === 1 ? "y" : "ies"}`);
    }
    value.forEach((entry, index) => checkText(entry, `${path}[${index}]`));
  };
  const checkHttpsUrl = (value: unknown, path: string) => {
    const text = checkText(value, path);
    if (!text) return;
    try {
      if (new URL(text).protocol !== "https:") {
        errors.push(`${path} must be an https URL`);
      }
    } catch {
      errors.push(`${path} must be an https URL`);
    }
  };
  const checkLinkUrl = (value: unknown, path: string) => {
    const text = checkText(value, path);
    if (!text) return;
    if (text.startsWith("/")) return;
    try {
      if (new URL(text).protocol !== "https:") {
        errors.push(`${path} must be an https URL`);
      }
    } catch {
      errors.push(`${path} must be an https URL`);
    }
  };
  const checkRecord = (value: unknown, path: string): UnknownRecord | undefined => {
    if (!isRecord(value)) {
      errors.push(`${path} must be an object`);
      return undefined;
    }
    return value;
  };

  const siteContent = checkRecord(input, "content");
  if (!siteContent) return { ok: false, errors };

  const profile = checkRecord(siteContent.profile, "profile");
  if (profile) {
    checkText(profile.name, "profile.name");
    checkText(profile.technicalId, "profile.technicalId");
    if (profile.targetRole !== "AI Agent / 后端开发") {
      errors.push("profile.targetRole must be AI Agent / 后端开发");
    }
    checkText(profile.positioning, "profile.positioning");
    checkText(profile.recruitingStatus, "profile.recruitingStatus");
    checkText(profile.email, "profile.email");
    checkHttpsUrl(profile.github, "profile.github");

    if (!Array.isArray(profile.education)) {
      errors.push("profile.education must be an array");
    } else if (profile.education.length === 0) {
      errors.push("profile.education must contain at least one entry");
    } else {
      profile.education.forEach((education, index) => {
        const value = checkRecord(education, `profile.education[${index}]`);
        if (!value) return;
        checkText(value.school, `profile.education[${index}].school`);
        checkText(value.major, `profile.education[${index}].major`);
        checkText(value.degree, `profile.education[${index}].degree`);
        if (!Number.isInteger(value.graduationYear) || (value.graduationYear as number) <= 0) {
          errors.push(`profile.education[${index}].graduationYear must be a positive integer`);
        }
        checkStringArray(value.highlights, `profile.education[${index}].highlights`);
      });
    }
  }

  if (!Array.isArray(siteContent.metrics)) {
    errors.push("metrics must be an array");
  } else {
    if (siteContent.metrics.length < 2 || siteContent.metrics.length > 4) {
      errors.push("metrics must contain between 2 and 4 entries");
    }
    siteContent.metrics.forEach((metric, index) => {
      const value = checkRecord(metric, `metrics[${index}]`);
      if (!value) return;
      checkText(value.label, `metrics[${index}].label`);
      if (typeof value.value !== "number" || !Number.isFinite(value.value)) {
        errors.push(`metrics[${index}].value must be a finite number`);
      }
      checkText(value.suffix, `metrics[${index}].suffix`);
      checkText(value.evidence, `metrics[${index}].evidence`);
    });
  }

  if (!Array.isArray(siteContent.internships)) {
    errors.push("internships must be an array");
  } else if (siteContent.internships.length === 0) {
    errors.push("internships must contain at least one entry");
  } else {
    siteContent.internships.forEach((internship, index) => {
      const value = checkRecord(internship, `internships[${index}]`);
      if (!value) return;
      ["id", "company", "team", "role", "period", "context", "ownership"].forEach((field) =>
        checkText(value[field], `internships[${index}].${field}`),
      );
      checkStringArray(value.actions, `internships[${index}].actions`, 1);
      checkStringArray(value.results, `internships[${index}].results`, 1);
      checkStringArray(value.stack, `internships[${index}].stack`, 1);
      const logo = checkRecord(value.logo, `internships[${index}].logo`);
      if (logo) {
        const src = checkText(logo.src, `internships[${index}].logo.src`);
        if (src && !/^\/brands\/.+\.(?:png|svg|webp)$/.test(src)) {
          errors.push(`internships[${index}].logo.src must be a local brand path`);
        }
        checkText(logo.alt, `internships[${index}].logo.alt`);
        if (!["jd", "agibot", "cssc", "semantica"].includes(String(logo.theme))) {
          errors.push(`internships[${index}].logo.theme must be a supported theme`);
        }
      }
      checkText(value.valueHeadline, `internships[${index}].valueHeadline`);
      if (!Array.isArray(value.journey) || value.journey.length !== 3) {
        errors.push(`internships[${index}].journey must contain exactly 3 entries`);
      } else {
        value.journey.forEach((node, nodeIndex) => {
          const journeyNode = checkRecord(node, `internships[${index}].journey[${nodeIndex}]`);
          if (!journeyNode) return;
          checkText(journeyNode.label, `internships[${index}].journey[${nodeIndex}].label`);
          checkText(journeyNode.detail, `internships[${index}].journey[${nodeIndex}].detail`);
        });
      }
      checkStringArray(value.highlights, `internships[${index}].highlights`, 1);
      if (value.projects !== undefined) {
        if (!Array.isArray(value.projects)) {
          errors.push(`internships[${index}].projects must be an array`);
        } else {
          value.projects.forEach((project, projectIndex) => {
            const projectValue = checkRecord(project, `internships[${index}].projects[${projectIndex}]`);
            if (!projectValue) return;
            ["id", "name", "summary"].forEach((field) =>
              checkText(projectValue[field], `internships[${index}].projects[${projectIndex}].${field}`),
            );
            checkStringArray(projectValue.highlights, `internships[${index}].projects[${projectIndex}].highlights`, 1);
          });
        }
      }
      if (typeof value.status !== "string" || !INTERNSHIP_STATUSES.has(value.status as Internship["status"])) {
        errors.push(`internships[${index}].status must be Shipped, Optimized, or Deployed`);
      }
    });
  }

  const openSource = checkRecord(siteContent.openSource, "openSource");
  if (openSource) {
    ["name", "identity", "background"].forEach((field) => checkText(openSource[field], `openSource.${field}`));
    const logo = checkRecord(openSource.logo, "openSource.logo");
    if (logo) {
     const src = checkText(logo.src, "openSource.logo.src");
      if (src && !/^\/brands\/.+\.(?:png|svg|webp)$/.test(src)) errors.push("openSource.logo.src must be a local brand path");
      checkText(logo.alt, "openSource.logo.alt");
      if (logo.theme !== "semantica") errors.push("openSource.logo.theme must be semantica");
    }
    const snapshotDate = checkText(openSource.snapshotDate, "openSource.snapshotDate");
    if (snapshotDate && !/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) errors.push("openSource.snapshotDate must use YYYY-MM-DD");
    if (!Number.isInteger(openSource.starsSnapshot) || (openSource.starsSnapshot as number) < 0) {
      errors.push("openSource.starsSnapshot must be a non-negative integer");
    }
    if (!Array.isArray(openSource.honors) || openSource.honors.length < 2) {
      errors.push("openSource.honors must contain at least 2 entries");
    } else {
      openSource.honors.forEach((honor, index) => {
        const value = checkRecord(honor, `openSource.honors[${index}]`);
        if (!value) return;
        ["platform", "rank", "period", "evidence"].forEach((field) => checkText(value[field], `openSource.honors[${index}].${field}`));
      });
    }
    if (!Array.isArray(openSource.contributions) || openSource.contributions.length !== 13) {
      errors.push("openSource.contributions must contain exactly 13 entries");
    } else {
      const seenPrNumbers = new Set<number>();
      let mergedCount = 0;
      openSource.contributions.forEach((contribution, index) => {
        const value = checkRecord(contribution, `openSource.contributions[${index}]`);
        if (!value) return;
        if (!Number.isInteger(value.number) || (value.number as number) <= 0) {
          errors.push(`openSource.contributions[${index}].number must be a positive integer`);
        } else if (seenPrNumbers.has(value.number as number)) {
          errors.push("openSource.contributions must not contain duplicate PR numbers");
        } else {
          seenPrNumbers.add(value.number as number);
        }
        if (typeof value.status !== "string" || !CONTRIBUTION_STATUSES.has(value.status as OpenSourceContribution["status"])) {
          errors.push(`openSource.contributions[${index}].status must be merged, open, or review`);
        } else if (value.status === "merged") {
          mergedCount += 1;
        }
        checkText(value.summary, `openSource.contributions[${index}].summary`);
        const url = checkText(value.url, `openSource.contributions[${index}].url`);
        if (url && !GITHUB_PR_URL_PATTERN.test(url)) {
          errors.push(`openSource.contributions[${index}].url must be an HTTPS GitHub PR URL`);
        }
      });
      if (mergedCount !== 9) {
        errors.push("openSource.contributions must contain exactly 9 merged entries");
      }
    }
    errors.push(...validateCapabilityMap(openSource.graphNodes, openSource.contributionDomains, openSource.contributions));
    checkHttpsUrl(openSource.repositoryUrl, "openSource.repositoryUrl");
    const articlePath = checkText(openSource.articlePath, "openSource.articlePath");
    if (articlePath && !/^\/blog\/.+/.test(articlePath)) errors.push("openSource.articlePath must be a /blog/ path");
  }

  if (!Array.isArray(siteContent.caseStudies)) {
    errors.push("caseStudies must be an array");
  } else if (siteContent.caseStudies.length !== 4) {
    errors.push("caseStudies must contain exactly 4 entries");
  } else {
    const seenCaseStudyIds = new Set<string>();
    const seenTabLabels = new Set<string>();
    siteContent.caseStudies.forEach((caseStudy, index) => {
      const value = checkRecord(caseStudy, `caseStudies[${index}]`);
      if (!value) return;
      const id = checkText(value.id, `caseStudies[${index}].id`);
      if (id) {
        if (seenCaseStudyIds.has(id)) {
          errors.push("caseStudies must have unique ids");
        } else {
          seenCaseStudyIds.add(id);
        }
      }
      if (typeof value.tabLabel !== "string" || !CASE_STUDY_TAB_LABELS.has(value.tabLabel as CaseStudy["tabLabel"])) {
        errors.push(`caseStudies[${index}].tabLabel must be Ontology Agent, Streaming Backend, Knowledge Memory, or Semantica`);
      } else if (seenTabLabels.has(value.tabLabel)) {
        errors.push("caseStudies must have unique tab labels");
      } else {
        seenTabLabels.add(value.tabLabel);
      }
      if (typeof value.visualKind !== "string" || !CASE_STUDY_VISUAL_KINDS.has(value.visualKind as CaseStudy["visualKind"])) {
        errors.push(`caseStudies[${index}].visualKind must be ontology, streaming, memory, or graph`);
      }
      ["title", "problem", "contribution", "result"].forEach((field) =>
        checkText(value[field], `caseStudies[${index}].${field}`),
      );
      checkStringArray(value.constraints, `caseStudies[${index}].constraints`, 1);
      checkStringArray(value.decisions, `caseStudies[${index}].decisions`, 1);
      checkStringArray(value.tradeoffs, `caseStudies[${index}].tradeoffs`, 1);
      checkStringArray(value.stack, `caseStudies[${index}].stack`, 1);
      if (!Array.isArray(value.links)) {
        errors.push(`caseStudies[${index}].links must be an array`);
      } else {
        value.links.forEach((link, linkIndex) => {
          const linkValue = checkRecord(link, `caseStudies[${index}].links[${linkIndex}]`);
          if (!linkValue) return;
          checkText(linkValue.label, `caseStudies[${index}].links[${linkIndex}].label`);
          checkLinkUrl(linkValue.url, `caseStudies[${index}].links[${linkIndex}].url`);
        });
      }
    });
  }
  checkStringArray(siteContent.about, "about", 1);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function validateCapabilityMap(
  graphNodes: unknown,
  contributionDomains: unknown,
  contributions: unknown,
): string[] {
  const errors: string[] = [];
  const checkCapabilityRecord = (value: unknown, path: string): UnknownRecord | undefined => {
    if (!isRecord(value)) {
      errors.push(`${path} must be an object`);
      return undefined;
    }
    return value;
  };
  const checkCapabilityText = (value: unknown, path: string): string | undefined => {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${path} must be a non-empty string`);
      return undefined;
    }
    return value;
  };

  const validNodeIds = new Set<string>();
  if (!Array.isArray(graphNodes)) {
    errors.push("openSource.graphNodes must be an array");
  } else {
    const orderedNodeIds: string[] = [];
    graphNodes.forEach((node, index) => {
      const value = checkCapabilityRecord(node, `openSource.graphNodes[${index}]`);
      if (!value) return;
      const id = checkCapabilityText(value.id, `openSource.graphNodes[${index}].id`);
      if (id === undefined) return;
      if (validNodeIds.has(id)) {
        errors.push("openSource.graphNodes must not contain duplicate ids");
      } else {
        validNodeIds.add(id);
      }
      orderedNodeIds.push(id);
      checkCapabilityText(value.title, `openSource.graphNodes[${index}].title`);
      checkCapabilityText(value.description, `openSource.graphNodes[${index}].description`);
    });
    if (
      orderedNodeIds.length !== CAPABILITY_NODE_ORDER.length ||
      orderedNodeIds.some((id, index) => id !== CAPABILITY_NODE_ORDER[index])
    ) {
      errors.push("openSource.graphNodes must use the required ordered ids");
    }
  }

  const validPrNumbers = new Set<number>();
  if (!Array.isArray(contributions)) {
    errors.push("openSource.contributions must be an array");
  } else {
    contributions.forEach((contribution, index) => {
      const value = checkCapabilityRecord(contribution, `openSource.contributions[${index}]`);
      if (!value) return;
      if (typeof value.number === "number" && Number.isInteger(value.number) && value.number > 0) {
        validPrNumbers.add(value.number);
      }
    });
  }

  const mappedPrNumbers = new Set<number>();
  if (!Array.isArray(contributionDomains)) {
    errors.push("openSource.contributionDomains must be an array");
  } else {
    if (contributionDomains.length !== CONTRIBUTION_DOMAIN_ORDER.length) {
      errors.push("openSource.contributionDomains must contain exactly 6 entries");
    }
    const orderedDomainIds: string[] = [];
    contributionDomains.forEach((domain, index) => {
      const value = checkCapabilityRecord(domain, `openSource.contributionDomains[${index}]`);
      if (!value) return;
      const id = checkCapabilityText(value.id, `openSource.contributionDomains[${index}].id`);
      if (id !== undefined) orderedDomainIds.push(id);
      checkCapabilityText(value.title, `openSource.contributionDomains[${index}].title`);
      checkCapabilityText(value.outcome, `openSource.contributionDomains[${index}].outcome`);
      if (!Array.isArray(value.nodeIds)) {
        errors.push(`openSource.contributionDomains[${index}].nodeIds must be an array`);
      } else {
        value.nodeIds.forEach((nodeId, nodeIndex) => {
          if (typeof nodeId === "string" && validNodeIds.has(nodeId)) return;
          errors.push(
            `openSource.contributionDomains[${index}].nodeIds[${nodeIndex}] must reference an existing graph node`,
          );
        });
      }
      if (!Array.isArray(value.prNumbers)) {
        errors.push(`openSource.contributionDomains[${index}].prNumbers must be an array`);
      } else {
        value.prNumbers.forEach((prNumber, prIndex) => {
          if (typeof prNumber === "number" && validPrNumbers.has(prNumber)) {
            mappedPrNumbers.add(prNumber);
            return;
          }
          errors.push(
            `openSource.contributionDomains[${index}].prNumbers[${prIndex}] must reference an existing contribution`,
          );
        });
      }
    });
    if (
      orderedDomainIds.length !== CONTRIBUTION_DOMAIN_ORDER.length ||
      orderedDomainIds.some((id, index) => id !== CONTRIBUTION_DOMAIN_ORDER[index])
    ) {
      errors.push("openSource.contributionDomains must use the required ordered ids");
    }
  }

  validPrNumbers.forEach((prNumber) => {
    if (!mappedPrNumbers.has(prNumber)) {
      errors.push(`openSource.contributions PR #${prNumber} must belong to at least one contribution domain`);
    }
  });

  return errors;
}
