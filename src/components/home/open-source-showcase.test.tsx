import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";
import type { OpenSourceProject } from "@/content/schema";

import { OpenSourceShowcase, selectFeaturedContributions } from "./open-source-showcase";

const { openSource } = loadSiteContent();
const merged = openSource.contributions.filter(({ status }) => status === "merged");
const openPullRequests = openSource.contributions.filter(({ status }) => status === "open");

afterEach(cleanup);

function renderShowcase(project: OpenSourceProject = openSource) {
  return render(<OpenSourceShowcase project={project} />);
}

describe("selectFeaturedContributions", () => {
  it("prefers PRs 1077, 1226 and 1096 and leaves the other merged PRs as remaining", () => {
    expect(selectFeaturedContributions(openSource).featured.map(({ number }) => number)).toEqual([
      1077, 1226, 1096,
    ]);
    expect(selectFeaturedContributions(openSource).remaining.map(({ number }) => number)).toEqual([
      1217, 1215, 1153, 1143, 1113, 1094, 1081,
    ]);
  });

  it("fills a missing featured slot with another merged PR instead of an open one", () => {
    const missingLead = {
      ...openSource,
      contributions: openSource.contributions.filter(({ number }) => number !== 1077),
    };
    const { featured, remaining } = selectFeaturedContributions(missingLead);

    expect(featured.map(({ number }) => number)).toEqual([1226, 1096, 1217]);
    expect(featured.every(({ status }) => status === "merged")).toBe(true);
    expect(remaining).toHaveLength(merged.length - 4);
  });
});

describe("OpenSourceShowcase", () => {
  it("presents the official Semantica logo, identity and background", () => {
    renderShowcase();

    expect(screen.getByRole("img", { name: "Semantica 项目标志" })).toBeVisible();
    expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Semantica" })).toBeVisible();
    expect(screen.getByText(openSource.background)).toBeVisible();
  });

  it("groups the personal merged PR count with the key contributions heading", () => {
    renderShowcase();

    const statistic = screen.getByText("已合并 PR").closest("p");
    expect(statistic).not.toBeNull();
    expect(statistic).toHaveTextContent("10");
    expect(screen.getByRole("heading", { name: "我的关键贡献" })).toBeVisible();
  });

  it("links exactly three featured representative contributions in priority order", () => {
    renderShowcase();

    const list = screen.getByRole("list", { name: "Semantica 代表性贡献" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const expected = [
      { number: 1077, alias: "RETE 规则匹配与链式一致性" },
      { number: 1226, alias: "按依赖分层并行执行" },
      { number: 1096, alias: "规则驱动动作与执行溯源" },
    ];
    expected.forEach(({ number, alias }, index) => {
      const contribution = merged.find((item) => item.number === number);
      const link = within(items[index]).getByRole("link");
      expect(link).toHaveAttribute("href", contribution?.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
      expect(within(link).getByText(`已合并 · PR #${number}`)).toBeVisible();
      expect(within(link).getByText(alias)).toBeVisible();
      expect(link).toHaveAccessibleName(`已合并 · PR #${number} · ${contribution?.title}`);
    });
  });

  it("folds the remaining seven merged PRs into a closed details disclosure", () => {
    const { container } = renderShowcase();

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(within(details as HTMLElement).getByText("查看剩余 7 个已合并 PR")).toBeVisible();
    const remainingLinks = within(details as HTMLElement).getAllByRole("link", {
      name: /^已合并 · PR #/,
    });
    expect(remainingLinks).toHaveLength(merged.length - 3);
    for (const link of remainingLinks) {
      const number = Number(link.textContent?.match(/PR #(\d+)/)?.[1]);
      expect(merged.some((contribution) => contribution.number === number)).toBe(true);
    }
  });

  it("keeps open pull requests and retired wording out of the credibility summary", () => {
    const { container } = renderShowcase();

    for (const pullRequest of openPullRequests) {
      expect(screen.queryByText(new RegExp(`PR #${pullRequest.number}\\b`))).toBeNull();
    }
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/FEAT|FIX|MERGED/);
    expect(text).not.toContain("架构支柱");
    expect(text).not.toContain("点击");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    renderShowcase();

    expect(screen.getByText("截至 2026-09-04：10 个贡献已合并")).toBeVisible();
  });

  it("separates sourced project recognition from the personal contribution count", () => {
    renderShowcase();

    const recognition = screen.getByRole("region", { name: "项目影响力与荣誉" });
    const stars = within(recognition).getByRole("link", { name: /12,455 GitHub Stars/ });
    expect(stars).toHaveAttribute("href", openSource.repositoryUrl);
    expect(within(recognition).getByText(/2026-09-09/)).toBeVisible();
    expect(within(recognition).getByRole("link", { name: /#1 GitHub Trending 日榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/repositories/18986");
    expect(within(recognition).getByRole("link", { name: /#3 Trendshift · Python 周榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/trendshift/repositories/18986/weekly?language=Python");
    expect(within(recognition).queryByText("已合并 PR")).toBeNull();
  });

  it("gives the lead PR a meaningful summary and a RETE matching illustration", () => {
    renderShowcase();
    const lead = screen.getByRole("link", { name: /已合并 · PR #1077/ });
    expect(within(lead).getByText("核心贡献")).toBeVisible();
    expect(within(lead).getByRole("img", { name: /RETE 多条件匹配/ })).toBeVisible();
    const parallel = screen.getByRole("link", { name: /已合并 · PR #1226/ });
    expect(within(parallel).queryByRole("img")).toBeNull();
  });

  it("links to the external repository and the internal article", () => {
    renderShowcase();

    const repository = screen.getByRole("link", { name: "Semantica GitHub repository" });
    expect(repository).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");
    expect(repository).toHaveAttribute("target", "_blank");
    expect(repository).toHaveAttribute("rel", "noreferrer");

    const article = screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" });
    expect(article).toHaveAttribute("href", "/blog/first-agent-system");
  });
});
