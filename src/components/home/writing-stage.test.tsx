import { cleanup, render, screen } from "@testing-library/react";
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

  it("renders a single static article stage without carousel controls", () => {
    render(<WritingStage posts={[post(1)]} />);

    expect(screen.getByRole("heading", { name: "文章 1" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "上一篇文章" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "下一篇文章" })).not.toBeInTheDocument();
    expect(screen.getByText("第 1 篇文章描述")).toBeVisible();
    expect(screen.getByText("标签 1")).toBeVisible();
    expect(screen.getByText("2026-08-01")).toBeVisible();
    expect(screen.getByRole("link", { name: "阅读《文章 1》全文" })).toHaveAttribute(
      "href",
      "/blog/post-1",
    );
  });

  it("renders the carousel with navigation controls for two or more posts", () => {
    render(<WritingStage posts={[post(1), post(2)]} />);

    expect(screen.getByRole("heading", { name: "文章 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "上一篇文章" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一篇文章" })).toBeInTheDocument();
  });
});