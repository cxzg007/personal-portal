import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.scrollWidth).toBe(dimensions.viewportWidth);
}

for (const viewport of viewports) {
  test(`homepage remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("heading", { level: 1, name: "江俊杰" })).toBeVisible();
    await expect(page.getByRole("link", { name: "查看实习经历" })).toBeVisible();
    await expect(page.getByRole("region", { name: "江俊杰" }).getByRole("link", { name: "下载简历" })).toBeVisible();

    if (viewport.width <= 760) {
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
    }

    const firstInternship = page.locator("#internships").getByRole("article").first();
    await firstInternship.getByRole("button", { name: "查看技术细节" }).click();
    await expect(firstInternship.getByRole("heading", { name: "业务背景" })).toBeVisible();
    await expect(firstInternship.getByRole("heading", { name: "交付结果" })).toBeVisible();
    await expect(page.locator("#case-studies").getByRole("article").first()).toBeVisible();
    await expect(page.locator("#about").getByRole("link", { name: "发送邮件联系江俊杰" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test(`blog index remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog");

    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("heading", { level: 1, name: "技术博客" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "搜索文章" })).toBeVisible();
    await expect(page.getByRole("group", { name: "按标签筛选" })).toBeVisible();
    await expect(page.getByRole("link", { name: "阅读文章：从 Semantica 开源贡献看 Agent 项目的工程协作" })).toBeVisible();

    if (viewport.width <= 760) {
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
    }
  });

  test(`article remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog/first-agent-system");

    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("heading", {
      level: 1,
      name: "从 Semantica 开源贡献看 Agent 项目的工程协作",
    })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "文章目录" })).toBeVisible();
    await expect(page.locator(".article-prose")).toBeVisible();
    await expect(page.locator("pre code")).toBeVisible();
    await expect(page.getByRole("link", { name: "返回博客" })).toBeVisible();
  });
}
