import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const auditedRoutes = ["/", "/blog", "/blog/first-agent-system"] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

async function tabTo(page: Page, target: Locator, maximumTabs = 80) {
  for (let index = 0; index < maximumTabs; index += 1) {
    if (await target.evaluate((element) => document.activeElement === element)) return;
    await page.keyboard.press("Tab");
  }

  throw new Error(`Keyboard focus did not reach ${await target.getAttribute("aria-label") ?? await target.textContent()}`);
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
  await tabTo(page, desktopNavigation.getByRole("link", { name: "首页" }));
  await expectVisibleFocus(desktopNavigation.getByRole("link", { name: "首页" }));

  const primaryAction = page.getByRole("link", { name: "查看实习经历" });
  const resumeAction = page.getByRole("region", { name: "江俊杰" }).getByRole("link", { name: "下载简历" });
  await tabTo(page, primaryAction);
  await expectVisibleFocus(primaryAction);
  await page.keyboard.press("Tab");
  await expect(resumeAction).toBeFocused();

  const internshipToggles = page.locator("#internships").getByRole("button", {
    name: "查看技术细节",
  });
  await expect(internshipToggles).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const toggle = internshipToggles.nth(index);
    await tabTo(page, toggle);
    await expectVisibleFocus(toggle);
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  }

  const contact = page.locator("#about");
  for (const link of [
    contact.getByRole("link", { name: "发送邮件联系江俊杰" }),
    contact.getByRole("link", { name: "查看 cxzg007 的 GitHub" }),
    contact.getByRole("link", { name: "下载 PDF 简历" }),
  ]) {
    await tabTo(page, link);
    await expect(link).toBeFocused();
    await expectVisibleFocus(link);
  }
});

test("mobile navigation is operable by keyboard and restores focus on close", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuToggle = page.getByRole("button", { name: "打开导航菜单" });
  await tabTo(page, menuToggle);
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
  await page.keyboard.press("Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mobileNavigation.getByRole("link", { name: "首页" })).toBeFocused();
});

test("blog filters and article actions remain keyboard operable", async ({ page }) => {
  await page.goto("/blog");

  const search = page.getByRole("searchbox", { name: "搜索文章" });
  await tabTo(page, search);
  await expectVisibleFocus(search);
  await search.fill("Semantica");

  const allFilter = page.getByRole("button", { name: "全部" });
  await page.keyboard.press("Tab");
  await expect(allFilter).toBeFocused();
  await page.keyboard.press("Space");
  await expect(allFilter).toHaveAttribute("aria-pressed", "true");

  const firstTag = page.getByRole("group", { name: "按标签筛选" }).getByRole("button").nth(1);
  await page.keyboard.press("Tab");
  await expect(firstTag).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(firstTag).toHaveAttribute("aria-pressed", "true");

  const articleLink = page.getByRole("link", {
    exact: true,
    name: "从 Semantica 开源贡献看 Agent 项目的工程协作",
  });
  await tabTo(page, articleLink);
  await expectVisibleFocus(articleLink);
});

test("reduced motion preserves content and removes Canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "江俊杰" })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习经历" })).toBeVisible();
  await expect(page.locator("#internships")).toBeVisible();
});
