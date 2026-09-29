import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";
import type { OpenSourceProject } from "@/content/schema";

import { OpenSourceShowcase } from "./open-source-showcase";

const { openSource } = loadSiteContent();

afterEach(cleanup);

function renderShowcase(project: OpenSourceProject = openSource) {
  return render(<OpenSourceShowcase project={project} />);
}

describe("OpenSourceShowcase", () => {
  it("presents the official Semantica logo, identity and background", () => {
    renderShowcase();

    expect(screen.getByRole("img", { name: "Semantica 项目标志" })).toBeVisible();
    expect(screen.getByText("项目维护者 · Maintainer / Collaborator · cxzg007")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Semantica" })).toBeVisible();
    expect(screen.getByText(openSource.background)).toBeVisible();
    expect(screen.getByText(openSource.roleSummary)).toBeVisible();
  });

  it("groups the personal merged PR count with the key contributions heading", () => {
    renderShowcase();

    const statistic = screen.getByText("已合并 PR").closest("p");
    expect(statistic).not.toBeNull();
    expect(statistic).toHaveTextContent("18");
    expect(screen.getByRole("heading", { name: /我的关键贡献/ })).toBeVisible();
  });

  it("renders every contribution exactly once across the map and remaining records", () => {
    const { container } = renderShowcase();
    const map = screen.getByRole("figure", { name: "贡献落点图" });
    expect(within(map).getAllByRole("link", { name: /^已合并 · PR #/ })).toHaveLength(7);
    expect(within(map).getByRole("link", { name: /^进行中 · PR #1731/ })).toBeVisible();
    expect(screen.queryByRole("list", { name: "Semantica 贡献主题" })).toBeNull();
    expect(screen.queryByRole("region", { name: "正在推进" })).toBeNull();
    for (const pr of openSource.contributions) {
      expect(container.querySelectorAll(`a[href="${pr.url}"]`)).toHaveLength(1);
    }
  });

  it("keeps the eleven remaining merged PRs in a closed disclosure", () => {
    const { container } = renderShowcase();
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getByText("查看其他 11 个已合并 PR")).toBeVisible();
    expect(within(details).getAllByRole("link", { name: /^已合并 · PR #/ })).toHaveLength(11);
    expect(within(details).queryByRole("link", { name: /PR #1096/ })).toBeNull();
    expect(within(details).queryByRole("link", { name: /PR #1544/ })).toBeNull();
  });

  it("retains new unmapped contributions even when the old theme configuration omits them", () => {
    const project = structuredClone(openSource);
    project.contributions.unshift(
      { number: 2000, title: "未合并的快照组装", status: "open", url: "https://github.com/semantica-agi/semantica/pull/2000" },
      { number: 2001, title: "新增修复", status: "merged", url: "https://github.com/semantica-agi/semantica/pull/2001" },
    );
    const { container } = renderShowcase(project);
    const ongoing = screen.getByRole("region", { name: "正在推进" });
    expect(within(ongoing).getByRole("link", { name: /^进行中 · PR #2000/ })).toBeVisible();
    expect(within(ongoing).queryByRole("link", { name: /PR #1731/ })).toBeNull();
    expect(screen.getByText("已合并 PR").closest("p")).toHaveTextContent("19");
    expect(screen.getByText("查看其他 12 个已合并 PR")).toBeVisible();
    for (const pr of project.contributions) expect(container.querySelectorAll(`a[href="${pr.url}"]`)).toHaveLength(1);
  });

  it("keeps a changed PR status in its existing node without duplicating it", () => {
    const project = structuredClone(openSource);
    project.contributions.find(({ number }) => number === 1731)!.status = "merged";
    const { container } = renderShowcase(project);
    expect(screen.getByRole("link", { name: /^已合并 · PR #1731/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^进行中/ })).toBeNull();
    expect(screen.getByText("已合并 PR").closest("p")).toHaveTextContent("19");
    expect(container.querySelectorAll('a[href$="/pull/1731"]')).toHaveLength(1);
  });

  it("omits empty supplementary records and ongoing sections", () => {
    renderShowcase({ ...openSource, contributions: openSource.contributions.filter(({ number }) => number === 1226) });
    expect(screen.queryByText(/查看其他/)).toBeNull();
    expect(screen.queryByRole("region", { name: "正在推进" })).toBeNull();
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    renderShowcase();

    expect(screen.getByText("截至 2026-09-28：18 个贡献已合并")).toBeVisible();
  });

  it("separates sourced project recognition from the personal contribution count", () => {
    renderShowcase();

    const recognition = screen.getByRole("region", { name: "项目影响力与荣誉" });
    const stars = within(recognition).getByRole("link", { name: /13,513 GitHub Stars/ });
    expect(stars).toHaveAttribute("href", openSource.repositoryUrl);
    expect(within(recognition).getByText(/2026-09-20/)).toBeVisible();
    expect(within(recognition).getByText("星数快照 · 核验于 2026-09-28")).toBeVisible();
    expect(within(recognition).getByRole("link", { name: /#1 GitHub Trending 日榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/repositories/18986");
    expect(within(recognition).getByRole("link", { name: /#3 Trendshift · Python 周榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/trendshift/repositories/18986/weekly?language=Python");
    expect(within(recognition).queryByText("已合并 PR")).toBeNull();
  });

  it("links to the external repository and the internal article", () => {
    renderShowcase();

    const repository = screen.getByRole("link", { name: "Semantica GitHub repository" });
    expect(repository).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");
    expect(repository).toHaveAttribute("target", "_blank");
    expect(repository).toHaveAttribute("rel", "noreferrer");

    const article = screen.getByRole("link", { name: "阅读相关技术文章" });
    expect(article).toHaveAttribute("href", "/blog/graph-engineering-ontology");
  });
});
