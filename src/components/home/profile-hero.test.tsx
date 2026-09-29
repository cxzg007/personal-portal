import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ProfileHero } from "./profile-hero";

const { profile, internships } = loadSiteContent();

afterEach(cleanup);

describe("profile hero", () => {
  it("renders the identity headline, real name, primary actions, and the merged dock identity", () => {
    render(<ProfileHero internships={internships} profile={profile} />);

    expect(screen.getByRole("heading", { level: 1, name: "从业务语义，到可靠执行。" })).toBeVisible();
    expect(screen.getByText("cxzg007")).toBeVisible();
    expect(screen.queryByText("cxzg007 Profile")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "京东实习" })).toHaveAttribute("href", "#internships");
    expect(screen.getByRole("link", { name: "开源贡献" })).toHaveAttribute("href", "#open-source");
    expect(screen.queryByRole("link", { name: "下载简历 PDF" })).toBeNull();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", profile.github);
    expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
    expect(screen.getByText(`2027 届校招 · ${profile.targetRole}`)).toBeVisible();
    expect(
      screen.queryByText("通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程"),
    ).not.toBeInTheDocument();
  });

  it("renders the lead, positioning statement, and verified internship index", () => {
    render(<ProfileHero internships={internships} profile={profile} />);

    const index = screen.getByRole("navigation", { name: "经历索引" });
    expect(index).toBeVisible();
    for (const internship of internships) {
      expect(screen.getByRole("link", { name: `查看${internship.company}实习经历` })).toHaveAttribute("href", `#internship-${internship.id}`);
      expect(screen.getByText(internship.presentation.title)).toBeVisible();
    }
    expect(screen.getByRole("region", { name: "本体与规则执行" })).toBeVisible();
    expect(
      screen.getByText("在京东参与本体与规则平台建设，作为 Semantica 维护者推进推理与执行能力。让业务语义成为 Agent 可理解、可执行的约束。"),
    ).toBeVisible();
  });
});
