import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { OpenSourceShowcase } from "./open-source-showcase";

const { openSource } = loadSiteContent();

afterEach(cleanup);

describe("OpenSourceShowcase", () => {
  it("presents the official Semantica logo, identity and background", () => {
    render(<OpenSourceShowcase project={openSource} />);

    expect(screen.getByRole("img", { name: "Semantica 项目标志" })).toBeVisible();
    expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
    expect(
      screen.getByText(
        "Semantica 是面向 AI Agent 的图原生上下文与可审计基础设施；贡献覆盖图数据适配、SHACL 解释、时间稳定性、规则推理与决策模型契约。",
      ),
    ).toBeVisible();
  });

  it("renders seven PR links with exact hrefs and visible status badges", () => {
    render(<OpenSourceShowcase project={openSource} />);

    expect(screen.getAllByRole("link", { name: /PR #/ })).toHaveLength(7);
    openSource.contributions.forEach((contribution) => {
      expect(
        screen.getByRole("link", { name: `PR #${contribution.number}：${contribution.summary}` }),
      ).toHaveAttribute("href", contribution.url);
    });
    expect(screen.getAllByText("MERGED")).toHaveLength(2);
    expect(screen.getAllByText("OPEN")).toHaveLength(5);
  });

  it("states the dated snapshot boundary computed from contribution statuses", () => {
    render(<OpenSourceShowcase project={openSource} />);

    expect(
      screen.getByText("截至 2026-08-21：2 个贡献已合并，其余处于开放或审阅状态。"),
    ).toBeVisible();
  });

  it("renders the five-node capability chain as a named list", () => {
    render(<OpenSourceShowcase project={openSource} />);

    const chain = screen.getByRole("list", { name: "Semantica 能力链路" });
    expect(chain).toHaveTextContent("cxzg007");
    expect(within(chain).getAllByRole("listitem")).toHaveLength(5);
    openSource.graphNodes.forEach((node) => {
      expect(within(chain).getByText(node)).toBeVisible();
    });
  });

  it("links to the external repository and the internal article", () => {
    render(<OpenSourceShowcase project={openSource} />);

    const repositoryLink = screen.getByRole("link", { name: "Semantica GitHub 仓库" });
    expect(repositoryLink).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");

    const articleLink = screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" });
    expect(articleLink).toHaveAttribute("href", "/blog/first-agent-system");
    expect(articleLink).not.toHaveAttribute("target");
    expect(articleLink).not.toHaveAttribute("rel");
  });
});