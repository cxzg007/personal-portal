import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const auditedRoutes = ["/", "/blog", "/blog/first-agent-system"] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;
const primaryNavItems = ["信息", "实习", "系统", "开源", "荣誉", "博客", "联系", "GitHub", "简历"] as const;

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

test("desktop keyboard order covers skip navigation, nine nav links, hero actions, and contact", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "chromium", "desktop keyboard order is a desktop-only layout");
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

  const hero = page.getByRole("region", { name: /cxzg007 Profile/ });
  const postTitle = "从 Semantica 开源贡献看 Agent 项目的工程协作";
  const openSource = page.locator("main > section#open-source");
  const contact = page.locator("main > section#contact");

  const keyboardOrder = [
    skipLink,
    page.getByRole("link", { name: "返回首页" }),
    ...primaryNavItems.map((name) => desktopNavigation.getByRole("link", { exact: true, name })),
    hero.getByRole("link", { name: "查看实习", exact: true }),
    hero.getByRole("link", { name: "下载简历", exact: true }),
    hero.getByRole("link", { name: "jiangjunjie_tj@foxmail.com", exact: true }),
    hero.getByRole("link", { name: "GitHub", exact: true }),
    page.locator("#system-tab-ontology-agent-platform"),
    ...[0, 1, 2, 3, 4, 5, 6].map((index) =>
      openSource.getByRole("link", { name: /^PR #/ }).nth(index),
    ),
    openSource.getByRole("link", { name: "Semantica GitHub 仓库", exact: true }),
    openSource.getByRole("link", { name: "阅读 Semantica 贡献复盘", exact: true }),
    page.locator("main > section#writing").getByRole("link", { name: `阅读《${postTitle}》全文` }),
    contact.getByRole("link", { name: /jiangjunjie_tj@foxmail\.com/ }),
    contact.getByRole("link", { name: "GitHub", exact: true }),
    contact.getByRole("link", { name: "下载简历 PDF", exact: true }),
  ];

  for (const target of keyboardOrder) {
    await expectNextTab(page, target);
    await expectVisibleFocus(target);
  }

  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
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

  for (const name of primaryNavItems) {
    const link = mobileNavigation.getByRole("link", { exact: true, name });
    await expectNextTab(page, link);
    await expectVisibleFocus(link);
  }

  await page.keyboard.press("Escape");
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await expect(menuToggle).toBeFocused();
});

test("blog filters and article actions remain keyboard operable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop keyboard order is a desktop-only layout");
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
    ...primaryNavItems.map((name) => desktopNavigation.getByRole("link", { exact: true, name })),
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

test("reduced motion preserves content, removes Canvas, and sets the static profile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("html[data-profile-motion='static']")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习", exact: true })).toBeVisible();
  await expect(page.locator("main > section#internships")).toBeVisible();
});