import { expect, test } from "@playwright/test";

import { expectSemanticaMapComplete } from "./helpers/semantica-map";

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

test("server HTML keeps the complete Semantica map", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("region", { name: "Semantica 双层能力地图" });
  await expectSemanticaMapComplete(map);
  await expect(map.getByRole("button", { name: /^能力节点/ })).toHaveCount(5);
  await expect(map.getByTestId("contribution-domain")).toHaveCount(6);
  await expect(map.getByRole("link", { name: /^PR #/ })).toHaveCount(13);
  await expect(map.getByRole("link", { name: /PR #1208/ })).toHaveAttribute("href", /\/pull\/1208$/);
});