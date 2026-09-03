import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { OpenSourceShowcase } from "./open-source-showcase";

const { openSource } = loadSiteContent();

afterEach(cleanup);

describe("OpenSourceShowcase", () => {
  it("presents the official Semantica logo, identity and background", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);

    expect(screen.getByRole("img", { name: "Semantica 项目标志" })).toBeVisible();
    expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
    expect(screen.getByText("11.4k+ GitHub Stars")).toBeVisible();
    expect(
      screen.getByText(
        "Semantica 是面向 AI Agent 的图原生上下文与可审计基础设施；贡献覆盖图数据适配、SHACL 解释、时间稳定性、规则推理、决策模型契约与执行链路并行化。",
      ),
    ).toBeVisible();
  });

  it("renders trending honor badges as shields.io images", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);

    const badges = screen.getAllByRole("img", { name: /Trending|Trendshift/ });
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute("alt", "GitHub Trending #1 Repository of the Day");
    expect(badges[1]).toHaveAttribute("alt", "Trendshift · Python #3 Repository of the Week");
    for (const badge of badges) {
      expect(badge).toHaveAttribute("src", expect.stringContaining("img.shields.io/badge/"));
    }
  });

  it("renders thirteen PR links with exact hrefs and visible status text", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);

    const map = screen.getByRole("region", { name: "Semantica 双层能力地图" });
    expect(within(map).getAllByRole("link", { name: /^PR #/ })).toHaveLength(13);
    openSource.contributions.forEach((contribution) => {
      expect(
        within(map).getByRole("link", {
          name: `PR #${contribution.number}：${contribution.summary}，${contribution.status.toUpperCase()}`,
        }),
      ).toHaveAttribute("href", contribution.url);
    });
  });

  it("renders the capability map in domain order with complete server content", () => {
    render(
      <OpenSourceShowcase
        project={openSource}
        stars={openSource.starsSnapshot}
      />,
    );
    const map = screen.getByRole("region", { name: "Semantica 双层能力地图" });
    expect(within(map).getAllByRole("button", { name: /^能力节点/ })).toHaveLength(5);
    expect(within(map).getAllByTestId("contribution-domain").map((domain) => domain.getAttribute("data-domain-id"))).toEqual([
      "graph-data-adapters", "constraint-explanation", "temporal-stability", "rule-query-reasoning", "decision-model-contracts", "execution-pipeline",
    ]);
    expect(within(map).getAllByRole("link", { name: /^PR #/ })).toHaveLength(13);
    expect(within(map).getByRole("link", { name: /PR #1208/ })).toHaveAttribute("href", expect.stringContaining("/pull/1208"));
    expect(within(map).getAllByText("MERGED")).toHaveLength(9);
    expect(within(map).getAllByText("OPEN")).toHaveLength(4);
    expect(screen.getByRole("link", { name: /repository/i })).toHaveAttribute("href", openSource.repositoryUrl);
    expect(screen.getByRole("link", { name: /贡献复盘/ })).toHaveAttribute("href", openSource.articlePath);
  });

  it("states the dated snapshot boundary computed from contribution statuses", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);

    expect(
      screen.getByText("截至 2026-08-31：9 个贡献已合并，其余处于开放或审阅状态。"),
    ).toBeVisible();
  });

  it("links to the external repository and the internal article", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);

    const repositoryLink = screen.getByRole("link", { name: "Semantica GitHub repository" });
    expect(repositoryLink).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");

    const articleLink = screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" });
    expect(articleLink).toHaveAttribute("href", "/blog/first-agent-system");
    expect(articleLink).not.toHaveAttribute("target");
    expect(articleLink).not.toHaveAttribute("rel");
  });
});