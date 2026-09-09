import { expect, test } from "@playwright/test";

import { expectSemanticaMapComplete } from "./helpers/semantica-map";

test.use({ javaScriptEnabled: false });

test("core recruiting content is server rendered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
  for (const company of ["京东", "智元机器人", "中国船舶集团 722 研究所"]) {
    await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/面向 AI Agent 的图原生上下文与可审计基础设施/)).toBeVisible();
  await expect(page.getByRole("link", { name: /发送邮件/ })).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(page.getByRole("link", { name: /GitHub/ }).last()).toHaveAttribute("href", "https://github.com/cxzg007");
  const resumeLinks = page.getByRole("link", { name: "下载简历 PDF" });
  await expect(resumeLinks).toHaveCount(2);
  for (const link of await resumeLinks.all()) {
    await expect(link).toHaveAttribute("href", "/resume.pdf");
  }
});

test("server HTML keeps the Semantica credibility summary with collapsed remaining PRs", async ({ page }) => {
  await page.goto("/");
  const showcase = page.locator("main > section#open-source .open-source-showcase");
  await expectSemanticaMapComplete(showcase);
  await expect(showcase.locator("button")).toHaveCount(0);
  await expect(showcase.getByRole("link", { name: "12,455 GitHub Stars" })).toBeVisible();
  await showcase.locator("summary").click();
  await expect(showcase.getByRole("link", { name: /^已合并 · PR #/ })).toHaveCount(10);
});
