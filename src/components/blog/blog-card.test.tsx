import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PostMeta } from "@/content/posts";
import { BlogCard } from "./blog-card";

const post: PostMeta = {
  slug: "timezone-stable-date",
  title: "时区稳定的日期",
  description: "验证服务端和浏览器处于不同时区时仍显示同一天。",
  publishedAt: "2026-08-21",
  updatedAt: "2026-08-21",
  tags: ["测试"],
  featured: false,
  seoDescription: "验证文章日期不随浏览器时区偏移。",
  draft: false,
  readingMinutes: 1,
  headings: [],
};

const originalTimezone = process.env.TZ;

describe("BlogCard", () => {
  beforeAll(() => {
    process.env.TZ = "America/Los_Angeles";
  });

  afterAll(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  it("renders the published calendar date without a western-timezone day shift", () => {
    render(<BlogCard post={post} />);

    expect(screen.getByText("2026/08/21", { selector: "time" })).toHaveAttribute(
      "datetime",
      "2026-08-21",
    );
  });
});
