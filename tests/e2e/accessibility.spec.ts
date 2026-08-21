import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const auditedRoutes = ["/", "/blog", "/blog/first-agent-system"] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

async function expectNextTab(page: Page, target: Locator) {
  await page.keyboard.press("Tab");
  await expect(target).toBeFocused();
}

async function expectVisibleFocus(locator: Locator) {
  const focusIndicator = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });

  expect(focusIndicator.outlineStyle).not.toBe("none");
  expect(focusIndicator.outlineWidth).toBeGreaterThanOrEqual(2);
}

for (const route of auditedRoutes) {
  test(`${route} has no WCAG 2.1 A/AA axe violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).withTags([...axeTags]).analyze();

    expect(results.violations).toEqual([]);
  });
}

test("desktop keyboard order covers skip navigation, primary actions, disclosures, and contact", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "跳到主要内容" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expectVisibleFocus(skipLink);
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/");
  const desktopNavigation = page.getByRole("navigation", { name: "主导航" });
  await expect(desktopNavigation).toBeVisible();

  const hero = page.getByRole("region", { name: "江俊杰" });
  const primaryAction = hero.getByRole("link", { name: "查看实习经历" });
  const resumeAction = hero.getByRole("link", { name: "下载简历" });
  const heroEmail = hero.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" });
  const heroGithub = hero.getByRole("link", { name: "GitHub / cxzg007" });

  const preInternshipSequence = [
    skipLink,
    page.getByRole("link", { name: "返回首页" }),
    ...["首页", "实习", "系统设计", "博客", "关于", "简历"].map((name) =>
      desktopNavigation.getByRole("link", { exact: true, name }),
    ),
    primaryAction,
    resumeAction,
    heroEmail,
    heroGithub,
  ];

  for (const target of preInternshipSequence) {
    await expectNextTab(page, target);
    await expectVisibleFocus(target);
  }

  const internshipToggles = page.locator("#internships").getByRole("button", {
    name: "查看技术细节",
  });
  await expect(internshipToggles).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const toggle = internshipToggles.nth(index);
    await expectNextTab(page, toggle);
    await expectVisibleFocus(toggle);
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  }

  const contact = page.locator("#about");
  const postTitle = "从 Semantica 开源贡献看 Agent 项目的工程协作";
  const postInternshipSequence = [
    ...["GitHub repository", "PR #1081", "PR #1094"].map((name) =>
      page.locator("#case-studies").getByRole("link", { name }),
    ),
    page.locator("#writing").getByRole("link", { name: "查看全部文章" }),
    page.locator("#writing").getByRole("link", { exact: true, name: postTitle }),
    page.locator("#writing").getByRole("link", { name: `阅读文章：${postTitle}` }),
    contact.getByRole("link", { name: "发送邮件联系江俊杰" }),
    contact.getByRole("link", { name: "查看 cxzg007 的 GitHub" }),
    contact.getByRole("link", { name: "下载 PDF 简历" }),
  ];

  for (const target of postInternshipSequence) {
    await expectNextTab(page, target);
    await expectVisibleFocus(target);
  }
});

test("mobile navigation is operable by keyboard and restores focus on close", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "跳到主要内容" });
  const siteMark = page.getByRole("link", { name: "返回首页" });
  const menuToggle = page.getByRole("button", { name: "打开导航菜单" });
  await expectNextTab(page, skipLink);
  await expectNextTab(page, siteMark);
  await expectNextTab(page, menuToggle);
  await expectVisibleFocus(menuToggle);
  await page.keyboard.press("Enter");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "true");

  const closeButton = page.getByRole("button", { name: "关闭导航菜单" });
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await expect(menuToggle).toBeFocused();

  await page.keyboard.press("Enter");
  const mobileNavigation = page.getByRole("navigation", { name: "移动导航" });
  await expect(mobileNavigation).toBeVisible();
  await expectNextTab(page, closeButton);

  for (const name of ["首页", "实习", "系统设计", "博客", "关于", "简历"]) {
    const link = mobileNavigation.getByRole("link", { exact: true, name });
    await expectNextTab(page, link);
    await expectVisibleFocus(link);
  }

  await page.keyboard.press("Escape");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await expect(menuToggle).toBeFocused();
});

test("blog filters and article actions remain keyboard operable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog");

  const articleTitle = "从 Semantica 开源贡献看 Agent 项目的工程协作";
  const skipLink = page.getByRole("link", { name: "跳到主要内容" });
  const siteMark = page.getByRole("link", { name: "返回首页" });
  const desktopNavigation = page.getByRole("navigation", { name: "主导航" });
  const search = page.getByRole("searchbox", { name: "搜索文章" });

  for (const target of [
    skipLink,
    siteMark,
    ...["首页", "实习", "系统设计", "博客", "关于", "简历"].map((name) =>
      desktopNavigation.getByRole("link", { exact: true, name }),
    ),
    search,
  ]) {
    await expectNextTab(page, target);
  }

  await expectVisibleFocus(search);
  await search.fill("Semantica");

  const filterGroup = page.getByRole("group", { name: "按标签筛选" });
  for (const name of ["全部", "Agent 工程", "知识图谱", "开源协作"]) {
    const filter = filterGroup.getByRole("button", { exact: true, name });
    await expectNextTab(page, filter);
    await expectVisibleFocus(filter);
    await page.keyboard.press("Enter");
    await expect(filter).toHaveAttribute("aria-pressed", "true");
  }

  const articleLink = page.getByRole("link", {
    exact: true,
    name: articleTitle,
  });
  await expectNextTab(page, articleLink);
  await expectVisibleFocus(articleLink);
  await expectNextTab(page, page.getByRole("link", { name: `阅读文章：${articleTitle}` }));
});

test("reduced motion preserves content and removes Canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "江俊杰" })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习经历" })).toBeVisible();
  await expect(page.locator("#internships")).toBeVisible();
});
