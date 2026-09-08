import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ProfileHero } from "./profile-hero";

const { profile } = loadSiteContent();

afterEach(cleanup);

describe("profile hero", () => {
  it("renders the identity headline, real name, primary actions, and the merged dock identity", () => {
    render(<ProfileHero profile={profile} />);

    expect(screen.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
    expect(screen.queryByText("cxzg007 Profile")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看实习" })).toHaveAttribute("href", "#internships");
    expect(screen.getByRole("link", { name: "下载简历 PDF" })).toHaveAttribute("href", "/resume.pdf");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", profile.github);
    expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
    expect(screen.getByText(`2027 届校招 · ${profile.targetRole}`)).toBeVisible();
    expect(
      screen.queryByText("通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程"),
    ).not.toBeInTheDocument();
  });

  it("renders the kicker, the lead, and the positioning statement", () => {
    render(<ProfileHero profile={profile} />);

    expect(screen.getByText("RELIABLE AGENT · BACKEND SYSTEMS")).toBeVisible();
    expect(screen.getByText("构建可靠的 Agent 系统")).toBeVisible();
    expect(
      screen.getByText("从语义建模到执行约束，关注 AI 应用与后端系统的可靠落地。"),
    ).toBeVisible();
  });
});