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

    expect(screen.getByRole("heading", { level: 1, name: profile.name })).toBeVisible();
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

  it("uses the fixed navigation without an education destination", () => {
    render(<Header />);

    const navigation = screen.getByRole("navigation", { name: "主导航" });
    expect(within(navigation).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "首页",
      "实习",
      "系统设计",
      "博客",
      "关于",
      "简历",
    ]);
    expect(screen.queryByRole("link", { name: "教育" })).not.toBeInTheDocument();
  });

  it("exposes an accessible, closeable mobile menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = screen.getByRole("button", { name: "打开导航菜单" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "移动导航" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "关闭导航菜单" }));
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "移动导航" })).not.toBeInTheDocument();
  });
});
