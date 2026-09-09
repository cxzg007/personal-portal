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
  it("prefers PRs 1226, 1081 and 1094 and leaves the other merged PRs as remaining", () => {
    expect(selectFeaturedContributions(openSource).featured.map(({ number }) => number)).toEqual([
      1226, 1081, 1094,
    ]);
    expect(selectFeaturedContributions(openSource).remaining).toHaveLength(merged.length - 3);
  });

  it("fills a missing featured slot with another merged PR instead of an open one", () => {
    const variant: OpenSourceProject = {
      ...openSource,
      contributions: openSource.contributions.filter(({ number }) => number !== 1226),
    };
    const { featured, remaining } = selectFeaturedContributions(variant);

    expect(featured.map(({ number }) => number)).toEqual([1081, 1094, 1217]);
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
    expect(
      screen.getByText(
        "Semantica 是面向 AI Agent 的图原生上下文与可审计基础设施；贡献覆盖图数据适配、SHACL 解释、时间稳定性、规则推理、决策模型契约与执行链路并行化。",
      ),
    ).toBeVisible();
  });

  it("surfaces the merged PR statistic and capability labels up front", () => {
    renderShowcase();

    const statistic = screen.getByText("已合并 PR").closest("p");
    expect(statistic).not.toBeNull();
    expect(statistic).toHaveTextContent("10");
    expect(screen.getByText("图数据适配")).toBeVisible();
    expect(screen.getByText("规则推理")).toBeVisible();
    expect(screen.getByText("执行链路")).toBeVisible();
  });

  it("links exactly three featured representative contributions in priority order", () => {
    renderShowcase();

    const list = screen.getByRole("list", { name: "Semantica 代表性贡献" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const expected = [
      { number: 1226, alias: "按依赖分层并行执行" },
      { number: 1081, alias: "统一 ContextGraph 数据适配" },
      { number: 1094, alias: "回溯真实 SHACL 约束" },
    ];
    expected.forEach(({ number, alias }, index) => {
      const contribution = merged.find((item) => item.number === number);
      const link = within(items[index]).getByRole("link");
      expect(link).toHaveAttribute("href", contribution?.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
      expect(within(link).getByText(`已合并 · PR #${number}`)).toBeVisible();
      expect(within(link).getByText(alias)).toBeVisible();
      expect(within(link).getByText(contribution?.title ?? "")).toBeVisible();
    });
  });

  it("folds the remaining seven merged PRs into a closed details disclosure", () => {
    const { container } = renderShowcase();

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(within(details as HTMLElement).getByText("查看其余 7 个已合并 PR")).toBeVisible();
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
    expect(text).not.toContain("Trending");
    expect(text).not.toMatch(/stars/i);
    expect(text).not.toMatch(/FEAT|FIX|MERGED/);
    expect(text).not.toContain("架构支柱");
    expect(text).not.toContain("点击");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    renderShowcase();

    expect(screen.getByText("截至 2026-09-04：10 个贡献已合并")).toBeVisible();
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