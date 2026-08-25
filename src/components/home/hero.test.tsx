import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Header } from "@/components/shell/header";
import { loadSiteContent } from "@/content/load-site-content";

import { Hero } from "./hero";

const { profile } = loadSiteContent();

afterEach(cleanup);

describe("recruiting hero and navigation", () => {
  it("renders verified identity, education, contact details, and primary actions", () => {
    render(<Hero profile={profile} />);

    expect(screen.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
    expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
    expect(screen.getByRole("region", { name: "江俊杰" })).toBeVisible();
    expect(screen.getByText(profile.targetRole)).toBeVisible();
    expect(screen.getByText(profile.recruitingStatus)).toBeVisible();

    for (const education of profile.education) {
      expect(screen.getAllByText(education.school).length).toBeGreaterThan(0);
      expect(screen.getByText(education.major)).toBeVisible();
      expect(screen.getByText(education.degree)).toBeVisible();
      expect(screen.getByText(String(education.graduationYear))).toBeVisible();
    }

    expect(screen.getByRole("link", { name: profile.email })).toHaveAttribute(
      "href",
      `mailto:${profile.email}`,
    );
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", profile.github);
    expect(screen.getByRole("link", { name: "查看实习经历" })).toHaveAttribute(
      "href",
      "#internships",
    );
    expect(screen.getByRole("link", { name: "下载简历" })).toHaveAttribute(
      "href",
      "/resume.pdf",
    );
  });

  it("limits the hero education summary to two rows", () => {
    const thirdEducation = {
      ...profile.education[0],
      school: "不会显示的第三所学校",
      graduationYear: 2030,
    };

    render(
      <Hero
        profile={{
          ...profile,
          education: [...profile.education, thirdEducation],
        }}
      />,
    );

    expect(screen.getByRole("list", { name: "教育经历" }).children).toHaveLength(2);
    expect(screen.queryByText(thirdEducation.school)).not.toBeInTheDocument();
  });

  it("uses the fixed navigation with anchor destinations plus GitHub and resume links", () => {
    render(<Header />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["信息", "#info"],
      ["实习", "#internships"],
      ["系统", "#systems"],
      ["开源", "#open-source"],
      ["荣誉", "#honors"],
      ["博客", "#writing"],
      ["联系", "#contact"],
      ["GitHub", "https://github.com/cxzg007"],
      ["简历", "/resume.pdf"],
    ]);
    expect(screen.queryByRole("link", { name: "教育" })).not.toBeInTheDocument();
  });

  it("restores trigger focus when the mobile menu closes", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = screen.getByRole("button", { name: "打开导航菜单" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "移动导航" })).toBeVisible();

    await user.tab();
    expect(screen.getByRole("button", { name: "关闭导航菜单" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "移动导航" })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "移动导航" })).not.toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });
});
