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

export type OpenSourceProject = {
  name: string;
  logo: BrandAsset;
  identity: string;
  background: string;
  snapshotDate: string;
  honors: Array<{ platform: string; rank: string; period: string; evidence: string }>;
  contributionCount: number;
  mergedCount: number;
  mergedHighlights: string[];
  otherContributions: string[];
  graphNodes: [string, string, string, string, string];
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
    technicalId?: string;
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
    if (profile.technicalId !== undefined) checkText(profile.technicalId, "profile.technicalId");
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
    if (!Array.isArray(openSource.honors) || openSource.honors.length < 2) {
      errors.push("openSource.honors must contain at least 2 entries");
    } else {
      openSource.honors.forEach((honor, index) => {
        const value = checkRecord(honor, `openSource.honors[${index}]`);
        if (!value) return;
        ["platform", "rank", "period", "evidence"].forEach((field) => checkText(value[field], `openSource.honors[${index}].${field}`));
      });
    }
    for (const field of ["contributionCount", "mergedCount"] as const) {
      if (!Number.isInteger(openSource[field]) || (openSource[field] as number) < 0) errors.push(`openSource.${field} must be a non-negative integer`);
    }
    if (Number.isInteger(openSource.mergedCount) && Number.isInteger(openSource.contributionCount) && (openSource.mergedCount as number) > (openSource.contributionCount as number)) {
      errors.push("openSource.mergedCount must not exceed contributionCount");
    }
    checkStringArray(openSource.mergedHighlights, "openSource.mergedHighlights", 1);
    checkStringArray(openSource.otherContributions, "openSource.otherContributions", 1);
    if (!Array.isArray(openSource.graphNodes) || openSource.graphNodes.length !== 5) errors.push("openSource.graphNodes must contain exactly 5 entries");
    else openSource.graphNodes.forEach((node, index) => checkText(node, `openSource.graphNodes[${index}]`));
    checkHttpsUrl(openSource.repositoryUrl, "openSource.repositoryUrl");
    const articlePath = checkText(openSource.articlePath, "openSource.articlePath");
    if (articlePath && !/^\/blog\/.+/.test(articlePath)) errors.push("openSource.articlePath must be a /blog/ path");
  }

  if (!Array.isArray(siteContent.caseStudies)) {
    errors.push("caseStudies must be an array");
  } else if (siteContent.caseStudies.length === 0) {
    errors.push("caseStudies must contain at least one entry");
  } else {
    siteContent.caseStudies.forEach((caseStudy, index) => {
      const value = checkRecord(caseStudy, `caseStudies[${index}]`);
      if (!value) return;
      ["id", "title", "problem", "contribution", "result"].forEach((field) =>
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
          checkHttpsUrl(linkValue.url, `caseStudies[${index}].links[${linkIndex}].url`);
        });
      }
    });
  }

  checkStringArray(siteContent.about, "about", 1);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
