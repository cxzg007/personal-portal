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
    expect(screen.getByText("11.4k+ GitHub Stars", { selector: ".open-source-stars" })).toBeVisible();
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

  it("renders ten merged PR links with exact hrefs and visible status text", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    const map = screen.getByRole("region", { name: "Semantica 架构与合并贡献" });
    const links = within(map).getAllByRole("link", { name: /^PR #/ });
    expect(links).toHaveLength(10);
    const merged = openSource.contributions.filter(({ status }) => status === "merged");
    merged.forEach((contribution) => {
      expect(
        within(map).getByRole("link", {
          name: `PR #${contribution.number}：${contribution.summary}（${contribution.kind.toUpperCase()} · ${contribution.scale}）MERGED`,
        }),
      ).toHaveAttribute("href", contribution.url);
    });
  });

  it("renders highlights and the pillar map in schema order with merged-only content", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    const highlights = screen.getByRole("list", { name: "Semantica 项目亮点" });
    expect(highlights).toBeVisible();
    openSource.highlights.forEach((highlight) => {
      expect(within(highlights).getByText(highlight, { exact: true })).toBeVisible();
    });
    const map = screen.getByRole("region", { name: "Semantica 架构与合并贡献" });
    expect(within(map).getByRole("heading", { name: "核心架构与合并贡献" })).toBeVisible();
    expect(within(map).getAllByRole("button", { name: /^架构支柱/ })).toHaveLength(6);
    expect(
      within(map)
        .getAllByTestId("merged-contribution")
        .map((item) => item.getAttribute("data-pr-number")),
    ).toEqual(["1096", "1081", "1226", "1077", "1113", "1217", "1094", "1153", "1215", "1143"]);
    expect(within(map).getAllByText("MERGED")).toHaveLength(10);
    expect(within(map).queryByText("OPEN")).toBeNull();
  });

  it("exposes stable styling hooks without removing map content", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    expect(screen.getByTestId("open-source-spotlight")).toHaveClass("open-source-spotlight");
    expect(screen.getAllByRole("button", { name: /^架构支柱/ })[0]).toHaveClass("open-source-architecture-pillar");
    expect(screen.getAllByTestId("merged-contribution")[0]).toHaveClass("open-source-merged-contribution");
    expect(screen.getAllByRole("link", { name: /^PR #/ })[0]).toHaveClass("open-source-pr-link");
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    expect(screen.getByText("截至 2026-09-04：10 个贡献已合并。")).toBeVisible();
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