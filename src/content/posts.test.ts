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

  it("returns null from the public reader for an unknown slug", async () => {
    await expect(getPost("does-not-exist")).resolves.toBeNull();
  });
});
