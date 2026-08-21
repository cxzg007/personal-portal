import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import type { ComponentType } from "react";
import matter from "gray-matter";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type PostHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  featured: boolean;
  seoDescription: string;
  draft: boolean;
  readingMinutes: number;
  headings: PostHeading[];
};

export type Post = PostMeta & {
  Content: ComponentType;
};

export type PostSource = {
  slug: string;
  source: string;
};

type PostModule = { default: ComponentType };
type PostLoaderMap = Record<string, () => Promise<PostModule>>;

const postLoaders = {
  "first-agent-system": () => import("../../content/posts/first-agent-system.mdx"),
} satisfies PostLoaderMap;

const postFiles = {
  "first-agent-system": "first-agent-system.mdx",
} as const;

const requiredStringFields = ["title", "description", "seoDescription"] as const;

function fail(slug: string, field: string, reason: string): never {
  throw new Error(`Post "${slug}" has invalid ${field}: ${reason}`);
}

function readRequiredString(data: Record<string, unknown>, slug: string, field: string) {
  const value = data[field];
  if (typeof value !== "string" || value.trim() === "") {
    fail(slug, field, "a non-empty string is required");
  }

  return value.trim();
}

function rawFrontmatterValue(source: string, field: string) {
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)?.[1];
  if (!frontmatter) return undefined;

  const line = frontmatter
    .split("\n")
    .find((candidate) => candidate.match(new RegExp(`^${field}\\s*:`)));
  if (!line) return undefined;

  return line
    .slice(line.indexOf(":") + 1)
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2");
}

function readDate(source: string, slug: string, field: "publishedAt" | "updatedAt") {
  const raw = rawFrontmatterValue(source, field);
  if (!raw) fail(slug, field, "YYYY-MM-DD is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) fail(slug, field, "expected YYYY-MM-DD");

  const [year, month, day] = raw.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isExactDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!isExactDate) fail(slug, field, "date does not exist");

  return raw;
}

function extractHeadings(content: string): PostHeading[] {
  type MarkdownNode = {
    type: string;
    depth?: number;
    children?: MarkdownNode[];
  };

  const tree = unified().use(remarkParse).parse(content) as MarkdownNode;
  const slugger = new GithubSlugger();
  const headings: PostHeading[] = [];

  const visit = (node: MarkdownNode) => {
    if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
      const text = toString(node).trim();
      if (text) {
        headings.push({ id: slugger.slug(text), text, level: node.depth });
      }
    }

    node.children?.forEach(visit);
  };

  visit(tree);
  return headings;
}

function parsePost({ slug, source }: PostSource): PostMeta {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(slug, "slug", "use lowercase letters, numbers, and hyphens only");
  }

  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const strings = Object.fromEntries(
    requiredStringFields.map((field) => [field, readRequiredString(data, slug, field)]),
  ) as Record<(typeof requiredStringFields)[number], string>;
  const publishedAt = readDate(source, slug, "publishedAt");
  const updatedAt = readDate(source, slug, "updatedAt");

  if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
    fail(slug, "tags", "at least one non-empty string is required");
  }
  if (typeof data.featured !== "boolean") {
    fail(slug, "featured", "a boolean is required");
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    fail(slug, "draft", "expected a boolean");
  }
  if (updatedAt < publishedAt) {
    fail(slug, "updatedAt", "cannot be earlier than publishedAt");
  }

  const readableCharacters = parsed.content.replace(/\s/g, "").length;

  return {
    slug,
    title: strings.title,
    description: strings.description,
    publishedAt,
    updatedAt,
    tags: (data.tags as string[]).map((tag) => tag.trim()),
    featured: data.featured,
    seoDescription: strings.seoDescription,
    draft: data.draft ?? false,
    readingMinutes: Math.max(1, Math.ceil(readableCharacters / 500)),
    headings: extractHeadings(parsed.content),
  };
}

export function buildPostIndex(
  sources: PostSource[],
  options: { production?: boolean } = {},
): PostMeta[] {
  const slugs = new Set<string>();
  for (const { slug } of sources) {
    if (slugs.has(slug)) throw new Error(`Duplicate slug detected: "${slug}"`);
    slugs.add(slug);
  }

  const production = options.production ?? process.env.NODE_ENV === "production";

  return sources
    .map(parsePost)
    .filter((post) => !production || !post.draft)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function loadPostSources(): PostSource[] {
  return Object.entries(postFiles).map(([slug, relativePath]) => ({
    slug,
    source: fs.readFileSync(path.join(process.cwd(), "content", "posts", relativePath), "utf8"),
  }));
}

export function createPostReader(posts: PostMeta[], loaders: PostLoaderMap) {
  return async (slug: string): Promise<Post | null> => {
    const meta = posts.find((post) => post.slug === slug);
    const loader = loaders[slug];
    if (!meta || !loader) return null;

    const { default: Content } = await loader();
    return { ...meta, Content };
  };
}

export function getAllPosts(): PostMeta[] {
  return buildPostIndex(loadPostSources());
}

export function getPost(slug: string): Promise<Post | null> {
  return createPostReader(getAllPosts(), postLoaders)(slug);
}
