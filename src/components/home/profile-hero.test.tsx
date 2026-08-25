import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ProfileHero } from "./profile-hero";

const { profile } = loadSiteContent();

afterEach(cleanup);

describe("profile hero", () => {
  it("renders the identity headline, real name, primary actions, and growth path", () => {
    render(<ProfileHero profile={profile} />);

    expect(screen.getByRole("heading", { level: 1, name: "cxzg007 Profile" })).toBeVisible();
    expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
    expect(screen.getByRole("link", { name: "查看实习" })).toHaveAttribute("href", "#internships");
    expect(screen.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
    expect(screen.getByText("通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程")).toBeVisible();
  });

  it("renders the kicker and the positioning statement", () => {
    render(<ProfileHero profile={profile} />);

    expect(screen.getByText("RELIABLE AGENT · BACKEND SYSTEMS")).toBeVisible();
    expect(screen.getByText(profile.positioning)).toBeVisible();
  });
});