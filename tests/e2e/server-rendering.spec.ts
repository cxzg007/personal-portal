import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("core recruiting content is server rendered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "cxzg007 Profile" })).toBeVisible();
  for (const company of ["京东", "智元机器人", "中国船舶集团 722 研究所"]) {
    await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/面向 AI Agent 的图原生上下文与可审计基础设施/)).toBeVisible();
  await expect(page.getByRole("link", { name: /发送邮件/ })).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(page.getByRole("link", { name: /GitHub/ }).last()).toHaveAttribute("href", "https://github.com/cxzg007");
  await expect(page.getByRole("link", { name: /简历/ })).toHaveCount(0);
});