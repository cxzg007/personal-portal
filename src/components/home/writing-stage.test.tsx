import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { PostMeta } from "@/content/posts";

import { WritingStage } from "./writing-stage";

const post = (n: number, featured = true): PostMeta => ({
  slug: `post-${n}`,
  title: `文章 ${n}`,
  description: `第 ${n} 篇文章描述`,
  publishedAt: `2026-08-0${n}`,
  updatedAt: `2026-08-0${n}`,
  tags: [`标签 ${n}`],
  featured,
  seoDescription: `第 ${n} 篇文章 SEO 描述`,
  draft: false,
  readingMinutes: n,
  headings: [],
});

afterEach(cleanup);

describe("WritingStage", () => {
  it("renders nothing with zero posts", () => {
    const { container } = render(<WritingStage posts={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders a single editorial entry without carousel controls", () => {
    render(<WritingStage posts={[post(1)]} />);

    expect(screen.getByRole("heading", { level: 3, name: "文章 1" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "上一篇文章" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下一篇文章" })).not.toBeInTheDocument();
    expect(screen.getByText("第 1 篇文章描述")).toBeVisible();
    expect(screen.getByText("标签 1")).toBeVisible();
    expect(screen.getByText("2026/08/01")).toBeVisible();
    expect(screen.getByText("1 分钟阅读")).toBeVisible();
    expect(screen.getByRole("link", { name: "阅读文章：文章 1" })).toHaveAttribute(
      "href",
      "/blog/post-1",
    );
    expect(screen.getByRole("link", { name: "全部文章" })).toHaveAttribute("href", "/blog");
  });

  it("renders a dated metadata column for each entry", () => {
    render(<WritingStage posts={[post(1)]} />);

    const time = screen.getByText("2026/08/01");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-08-01");
  });

  it("lists multiple posts as plain entries in order", () => {
    render(<WritingStage posts={[post(1), post(2)]} />);

    for (const n of [1, 2]) {
      expect(screen.getByRole("heading", { level: 3, name: `文章 ${n}` })).toBeVisible();
      expect(screen.getByText(`第 ${n} 篇文章描述`)).toBeVisible();
      expect(screen.getByText(`标签 ${n}`)).toBeVisible();
    }
    expect(screen.queryByRole("button", { name: "上一篇文章" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下一篇文章" })).not.toBeInTheDocument();
  });

  it("keeps a four-entry magazine list readable", () => {
    render(<WritingStage posts={[post(1), post(2), post(3), post(4)]} />);

    const entries = screen.getAllByRole("article");
    expect(entries).toHaveLength(4);
    expect(within(entries[0]).getByRole("heading", { name: "文章 1" })).toBeVisible();
    expect(within(entries[3]).getByRole("heading", { name: "文章 4" })).toBeVisible();
    expect(screen.getByRole("link", { name: "全部文章" })).toHaveAttribute("href", "/blog");
  });
});