import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ProfileDock } from "./profile-dock";

const { profile } = loadSiteContent();

afterEach(cleanup);

describe("profile dock", () => {
  it("renders the real name, target role, and recruiting status", () => {
    render(<ProfileDock profile={profile} />);

    expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
    expect(screen.getByText(profile.targetRole)).toBeVisible();
    expect(screen.getByText(profile.recruitingStatus)).toBeVisible();
  });

  it("renders exactly two education rows with the badge block layout", () => {
    render(<ProfileDock profile={profile} />);

    const educationList = screen.getByRole("list", { name: "教育经历" });
    expect(within(educationList).getAllByRole("listitem")).toHaveLength(2);

    for (const item of within(educationList).getAllByRole("listitem")) {
      expect(within(item).getAllByRole("img", { name: "同济大学校徽" })).toHaveLength(1);
    }

    for (const education of profile.education) {
      expect(screen.getAllByText(education.school).length).toBeGreaterThan(0);
      expect(screen.getByText(education.major)).toBeVisible();
      expect(
        screen.getByText(`${education.degree} · ${education.graduationYear}`),
      ).toBeVisible();
    }
  });

  it("renders the Tongji badge on every education entry", () => {
    render(<ProfileDock profile={profile} />);

    const badges = screen.getAllByRole("img", { name: "同济大学校徽" });
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute("src", expect.stringContaining("tongji.png"));
    expect(badges[1]).toHaveAttribute("src", expect.stringContaining("tongji.png"));
  });

  it("shows the university name in the serif school line of the first entry", () => {
    render(<ProfileDock profile={profile} />);

    const education = profile.education[0];
    const educationList = screen.getByRole("list", { name: "教育经历" });
    const firstItem = within(educationList).getAllByRole("listitem")[0];
    const school = within(firstItem).getByText(education.school);
    expect(school).toHaveClass("profile-dock-education-school", "profile-dock-serif");
  });

  it("links to GitHub and email with the verified destinations", () => {
    render(<ProfileDock profile={profile} />);

    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/cxzg007",
    );
    expect(screen.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" })).toHaveAttribute(
      "href",
      "mailto:jiangjunjie_tj@foxmail.com",
    );
  });

  it("shows the exact growth path copy", () => {
    render(<ProfileDock profile={profile} />);

    expect(screen.getByText("通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程")).toBeVisible();
  });
});