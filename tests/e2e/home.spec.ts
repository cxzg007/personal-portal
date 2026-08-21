import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "江俊杰" })).toBeVisible();
  await expect(page.getByText("AI Agent / 后端开发", { exact: true })).toBeVisible();
  await expect(page.getByText("2027 届校招｜AI Agent / 后端开发")).toBeVisible();
  await expect(page.getByText("电子信息", { exact: true })).toBeVisible();
  await expect(page.getByText("通信工程", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" })).toHaveAttribute(
    "href",
    "mailto:jiangjunjie_tj@foxmail.com",
  );
  await expect(page.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/cxzg007",
  );
  await expect(page.getByRole("link", { name: "查看实习经历" })).toHaveAttribute("href", "#internships");
  await expect(page.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
  await expect(page.getByRole("link", { name: "教育" })).toHaveCount(0);
});

test("homepage navigation remains usable without horizontal overflow", async ({ page }) => {
  await page.goto("/");

  const menuToggle = page.getByRole("button", { name: "打开导航菜单" });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "移动导航" })).toBeVisible();

    await page.getByRole("button", { name: "关闭导航菜单" }).click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  } else {
    await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
