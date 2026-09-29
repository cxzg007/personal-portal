import { expect, test } from "@playwright/test";

test("contribution map exposes source and PR evidence without clipped content", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("figure", { name: "贡献落点图" });
  await expect(map).toBeVisible();
  await expect(map.getByRole("link")).toHaveCount(15);
  await expect(map.getByRole("link", { name: /已合并/ })).toHaveCount(7);
  await expect(map.getByRole("link", { name: /进行中 · PR #1731/ })).toBeVisible();
  for (const link of await map.getByRole("link").all()) {
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await link.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const source = map.getByRole("link", { name: /SPARQL 查询 · 查看源码/ });
  await source.focus();
  await expect(source).toBeFocused();
  await expect(source).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Tab");
  await expect(map.getByRole("link", { name: /已合并 · PR #1243/ })).toBeFocused();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("all contribution details and links remain available", async ({ page }) => {
    await page.goto("/");
    const map = page.getByRole("figure", { name: "贡献落点图" });
    await expect(map.getByRole("heading", { name: "RAG 上下文组装" })).toBeVisible();
    await expect(map.getByRole("link", { name: /进行中 · PR #1731/ })).toHaveAttribute("href", "https://github.com/semantica-agi/semantica/pull/1731");
    await expect(map.getByRole("link", { name: /项目架构参考 · GitDiagram/ })).toHaveAttribute("href", "https://gitdiagram.com/semantica-agi/semantica");
    await expect(map.getByRole("link")).toHaveCount(15);
  });
});
