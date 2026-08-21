import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PostMeta } from "@/content/posts";
import { FeaturedWriting } from "./featured-writing";

function post(index: number, featured = true): PostMeta {
  return {
    slug: `post-${index}`,
    title: `文章 ${index}`,
    description: `第 ${index} 篇公开技术文章。`,
    publishedAt: "2026-08-21",
    updatedAt: "2026-08-21",
    tags: ["Agent 工程"],
    featured,
    seoDescription: `文章 ${index} 的搜索摘要。`,
    draft: false,
    readingMinutes: 2,
    headings: [],
  };
}

describe("FeaturedWriting", () => {
  it("renders no empty section when no featured posts exist", () => {
    const { container } = render(<FeaturedWriting posts={[post(1, false)]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders at most the first four featured public posts", () => {
    render(<FeaturedWriting posts={[post(1), post(2, false), post(3), post(4), post(5), post(6)]} />);

    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByRole("link", { name: /^文章 1$/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^文章 2$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^文章 6$/ })).not.toBeInTheDocument();
  });
});
