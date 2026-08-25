import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { PostMeta } from "@/content/posts";

import { WritingCarousel } from "./writing-carousel";

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

describe("WritingCarousel", () => {
  it("shows the first post initially and navigates forward with wraparound", async () => {
    const user = userEvent.setup();
    render(<WritingCarousel posts={[post(1), post(2), post(3)]} />);

    expect(screen.getByRole("heading", { name: "文章 1" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "下一篇文章" }));
    expect(screen.getByRole("heading", { name: "文章 2" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "下一篇文章" }));
    await user.click(screen.getByRole("button", { name: "下一篇文章" }));
    expect(screen.getByRole("heading", { name: "文章 1" })).toBeVisible();
  });

  it("wraps around to the last post when navigating backward from the first", async () => {
    const user = userEvent.setup();
    render(<WritingCarousel posts={[post(1), post(2), post(3)]} />);

    await user.click(screen.getByRole("button", { name: "上一篇文章" }));
    expect(screen.getByRole("heading", { name: "文章 3" })).toBeVisible();
  });

  it("renders each article fact exactly once", () => {
    render(<WritingCarousel posts={[post(1), post(2), post(3)]} />);

    expect(screen.getAllByText("文章 1")).toHaveLength(1);
    expect(screen.getAllByText("第 1 篇文章描述")).toHaveLength(1);
    expect(screen.getAllByText("标签 1")).toHaveLength(1);
    expect(screen.getAllByText("2026-08-01")).toHaveLength(1);
  });

  it("renders a decorative architecture frame hidden from assistive technology", () => {
    render(<WritingCarousel posts={[post(1), post(2)]} />);

    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("presents the active post description, tags, date, and article link", () => {
    render(<WritingCarousel posts={[post(1), post(2)]} />);

    expect(screen.getByText("第 1 篇文章描述")).toBeVisible();
    expect(screen.getByText("标签 1")).toBeVisible();
    expect(screen.getByText("2026-08-01")).toBeVisible();
    expect(screen.getByRole("link", { name: "阅读《文章 1》全文" })).toHaveAttribute(
      "href",
      "/blog/post-1",
    );
  });
});