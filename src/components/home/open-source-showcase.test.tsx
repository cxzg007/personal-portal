import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { OpenSourceShowcase } from "./open-source-showcase";

const { openSource } = loadSiteContent();
const merged = openSource.contributions.filter(({ status }) => status === "merged");
const openPullRequests = openSource.contributions.filter(({ status }) => status === "open");

afterEach(cleanup);

function renderShowcase() {
  return render(<OpenSourceShowcase project={openSource} />);
}

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

  it("renders the four architecture layers with titles in schema order", () => {
    const { container } = renderShowcase();
    expect(screen.getByRole("region", { name: "Semantica 核心架构" })).toBeInTheDocument();

    expect(container.querySelectorAll(".arch-layer")).toHaveLength(4);
    expect(Array.from(container.querySelectorAll(".arch-layer-title")).map((node) => node.textContent)).toEqual([
      "数据与知识层",
      "推理层",
      "治理层",
      "决策层",
    ]);
  });

  it("renders all six capability labels with the spanning end-to-end traceability bar", () => {
    const { container } = renderShowcase();
    const map = screen.getByRole("region", { name: "Semantica 核心架构" });

    for (const label of ["上下文管理", "知识建模", "确定性推理", "本体治理", "决策智能", "端到端溯源"]) {
      expect(within(map).getByText(label)).toBeVisible();
    }

    const capabilityTags = container.querySelectorAll(".arch-capability");
    expect(capabilityTags).toHaveLength(5);
    expect(
      Array.from(capabilityTags).map((tag) => tag.textContent),
    ).toEqual(["上下文管理", "知识建模", "确定性推理", "本体治理", "决策智能"]);

    const spanning = container.querySelectorAll(".arch-spanning");
    expect(spanning).toHaveLength(1);
    expect(spanning[0].textContent).toBe("端到端溯源");
  });

  it("renders exactly the ten merged contributions as plain external links", () => {
    renderShowcase();
    const list = screen.getByRole("list", { name: "Semantica 已合并贡献" });
    const links = within(list).getAllByRole("link", { name: /^PR #/ });
    expect(links).toHaveLength(10);

    for (const contribution of merged) {
      const link = within(list).getByRole("link", {
        name: `PR #${contribution.number} · ${contribution.title}`,
      });
      expect(link).toHaveAttribute("href", contribution.url);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }

    for (const pullRequest of openPullRequests) {
      expect(screen.queryByText(new RegExp(`PR #${pullRequest.number}\\b`))).toBeNull();
    }
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    renderShowcase();
    expect(screen.getByText("截至 2026-09-04：10 个贡献已合并")).toBeVisible();
  });

  it("links to the external repository and the internal article", () => {
    renderShowcase();

    const repositoryLink = screen.getByRole("link", { name: "Semantica GitHub repository" });
    expect(repositoryLink).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");

    const articleLink = screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" });
    expect(articleLink).toHaveAttribute("href", "/blog/first-agent-system");
    expect(articleLink).not.toHaveAttribute("target");
    expect(articleLink).not.toHaveAttribute("rel");
  });

  it("omits the retired interactive-branch visuals and wording", () => {
    const { container } = renderShowcase();
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/stars/i);
    expect(text).not.toContain("Trending");
    expect(text).not.toContain("零锁定");
    expect(text).not.toContain("FEAT");
    expect(text).not.toContain("FIX");
    expect(text).not.toContain("MERGED");
    expect(text).not.toContain("架构支柱");
    expect(text).not.toContain("点击");

    expect(screen.queryByRole("button")).toBeNull();
  });
});