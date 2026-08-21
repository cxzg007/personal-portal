import fs from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import {
  buildPostIndex,
  createPostReader,
  getAllPosts,
  getPost,
  type PostSource,
} from "./posts";

const validFrontmatter = `---
title: 一篇公开技术文章
description: 用于验证文章索引行为的公开摘要。
publishedAt: 2026-08-21
updatedAt: 2026-08-21
tags:
  - Agent 工程
  - 开源协作
featured: true
seoDescription: 一篇用于测试博客元数据校验和索引行为的公开技术文章。
draft: false
---

## 第一节

正文。
`;

function source(slug: string, markdown = validFrontmatter): PostSource {
  return { slug, source: markdown };
}

function withFrontmatter(overrides: Record<string, unknown>) {
  const data = {
    title: "一篇公开技术文章",
    description: "用于验证文章索引行为的公开摘要。",
    publishedAt: "2026-08-21",
    updatedAt: "2026-08-21",
    tags: ["Agent 工程", "开源协作"],
    featured: true,
    seoDescription: "一篇用于测试博客元数据校验和索引行为的公开技术文章。",
    draft: false,
    ...overrides,
  };

  const lines = Object.entries(data).flatMap(([key, value]) => {
    if (value === undefined) return [];

    if (Array.isArray(value)) {
      return [`${key}:`, ...value.map((item) => `  - ${item}`)];
    }

    return [`${key}: ${String(value)}`];
  });

  return `---\n${lines.join("\n")}\n---\n\n## 第一节\n\n正文。\n`;
}

describe("buildPostIndex", () => {
  it.each([
    "title",
    "description",
    "publishedAt",
    "updatedAt",
    "tags",
    "featured",
    "seoDescription",
  ])("rejects a post missing required frontmatter field %s", (field) => {
    expect(() =>
      buildPostIndex([source("missing-field", withFrontmatter({ [field]: undefined }))]),
    ).toThrow(
      new RegExp(`missing-field.*${field}`, "i"),
    );
  });

  it.each([
    ["publishedAt", "2026-02-30"],
    ["updatedAt", "not-a-date"],
  ])("rejects invalid %s dates", (field, value) => {
    expect(() =>
      buildPostIndex([source("invalid-date", withFrontmatter({ [field]: value }))]),
    ).toThrow(new RegExp(`invalid-date.*${field}`, "i"));
  });

  it("rejects duplicate slugs before publishing", () => {
    expect(() =>
      buildPostIndex([source("duplicate"), source("duplicate", withFrontmatter({ draft: true }))]),
    ).toThrow(/duplicate slug.*duplicate/i);
  });

  it("sorts public posts by published date descending", () => {
    const posts = buildPostIndex([
      source("older", withFrontmatter({ publishedAt: "2026-01-01", updatedAt: "2026-01-02" })),
      source("newer", withFrontmatter({ publishedAt: "2026-08-21", updatedAt: "2026-08-21" })),
    ]);

    expect(posts.map((post) => post.slug)).toEqual(["newer", "older"]);
  });

  it("excludes drafts from the production index", () => {
    const posts = buildPostIndex(
      [source("public"), source("draft", withFrontmatter({ draft: true }))],
      { production: true },
    );

    expect(posts.map((post) => post.slug)).toEqual(["public"]);
  });

  it("extracts rendered headings, skips fenced code, and deduplicates ids like rehype-slug", () => {
    const markdown = `${validFrontmatter}
## 重复标题

\`\`\`md
## 代码块中的伪标题
\`\`\`

### 重复标题
`;
    const [post] = buildPostIndex([source("heading-semantics", markdown)]);

    expect(post.headings).toEqual([
      { id: "第一节", level: 2, text: "第一节" },
      { id: "重复标题", level: 2, text: "重复标题" },
      { id: "重复标题-1", level: 3, text: "重复标题" },
    ]);
  });
});

describe("post loading", () => {
  it("loads a known slug from an explicit loader map", async () => {
    const Content: ComponentType = () => null;
    const posts = buildPostIndex([source("known")]);
    const readPost = createPostReader(posts, {
      known: async () => ({ default: Content }),
    });

    await expect(readPost("known")).resolves.toMatchObject({
      slug: "known",
      title: "一篇公开技术文章",
      Content,
    });
  });

  it("returns null for an unknown slug without invoking another loader", async () => {
    const Content: ComponentType = () => null;
    const posts = buildPostIndex([source("known")]);
    const readPost = createPostReader(posts, {
      known: async () => ({ default: Content }),
    });

    await expect(readPost("../unknown")).resolves.toBeNull();
  });

  it("indexes the repository's first public article", () => {
    expect(getAllPosts().map((post) => post.slug)).toContain("first-agent-system");
  });

  it("binds each Semantica PR number to its public link, topic, and snapshot status", () => {
    const article = fs.readFileSync(
      path.join(process.cwd(), "content/posts/first-agent-system.mdx"),
      "utf8",
    );
    const expectedRows = [
      ["已合并", "1081", "ContextGraph 标准适配器"],
      ["已合并", "1094", "SHACL 真实约束解释"],
      ["开放或审阅中", "1077", "RETE alpha/beta Token 模型"],
      ["开放或审阅中", "1096", "规则 Action 与 provenance"],
      ["开放或审阅中", "1113", "RDF name→label 规范化"],
      ["开放或审阅中", "1143", "时间图指标"],
      ["开放或审阅中", "1153", "决策模型契约"],
    ] as const;

    for (const [status, number, topic] of expectedRows) {
      expect(article).toContain(
        `| ${status} | [#${number}](https://github.com/semantica-agi/semantica/pull/${number}) | ${topic} |`,
      );
    }
  });

  it("returns null from the public reader for an unknown slug", async () => {
    await expect(getPost("does-not-exist")).resolves.toBeNull();
  });
});
