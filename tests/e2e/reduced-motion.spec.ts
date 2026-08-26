import { expect, test } from "@playwright/test";

// Task 9 最小冒烟测试:旧 reduced-motion 断言依赖 Task 8 前的旧首页结构
// (static-network / data-brand-motion / data-scroll-enhancement 等),
// 已随 WebGL 运行时一并移除;完整 reduced-motion 行为断言归 Task 10 重建。
test("keeps the profile homepage static and canvas-free under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
});