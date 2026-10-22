import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("search traps focus, closes with Escape and opens a matching article", async ({ page }) => {
  await page.goto("/blog");
  const trigger = page.getByRole("button", { name: "搜索博客", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "搜索文章" });
  const input = dialog.getByRole("searchbox");
  await expect(input).toBeFocused();
  await input.fill("不存在的查询");
  await expect(dialog.getByText("没有找到匹配的文章，试试其他关键词。")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await input.fill("Agent 上下文");
  await dialog.getByRole("link").click();
  await expect(page).toHaveURL(/\/blog\/agent-context-engineering$/);
  await expect(dialog).not.toBeVisible();
});

test("theme persists between articles and reloads without changing the portfolio", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/blog");
  const shell = page.locator(".blog-theme-shell");
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(shell).toHaveAttribute("data-blog-theme", "dark");
  await page.locator(".blog-card h2 a").first().click();
  await expect(shell).toHaveAttribute("data-blog-theme", "dark");
  await page.reload();
  await expect(shell).toHaveAttribute("data-blog-theme", "dark");
  await page.getByRole("button", { name: "切换浅色模式" }).click();
  await expect(shell).toHaveAttribute("data-blog-theme", "light");
  await page.getByRole("navigation", { name: "博客页脚导航" }).getByRole("link", { name: "返回个人首页" }).click();
  await expect(page.locator(".blog-theme-shell")).toHaveCount(0);
  await expect(page.locator(".site-header")).toBeVisible();
});

test("theme still works when browser storage is blocked", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Denied", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Denied", "SecurityError"); };
  });
  await page.goto("/blog");
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator(".blog-theme-shell")).toHaveAttribute("data-blog-theme", "dark");
});

test("code copy writes the complete snippet and reports clipboard failure", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Chromium clipboard permission check");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blog/graph-engineering-ontology");
  const frame = page.locator(".code-frame").first();
  await frame.getByRole("button", { name: "复制代码" }).click();
  await expect(frame.getByRole("button", { name: "已复制" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await frame.locator("pre").textContent());
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("Denied"); }; });
  await frame.getByRole("button").click();
  await expect(frame.getByRole("button", { name: "复制失败，请手动选择" })).toBeVisible();
});

test("blog surfaces and search meet accessibility checks in both themes", async ({ page }) => {
  for (const route of ["/blog", "/blog/agent-context-engineering"]) {
    await page.goto(route);
    for (const theme of ["light", "dark"]) {
      if (theme === "dark") await page.getByRole("button", { name: "切换深色模式" }).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `${route} ${theme}`).toEqual([]);
    }
    await page.getByRole("button", { name: "搜索博客", exact: true }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "切换浅色模式" }).click();
  }
});

test("saved theme is painted before framework JavaScript loads", async ({ browser }, testInfo) => {
  for (const preference of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: preference === "dark" ? "light" : "dark" });
    await context.addInitScript(value => localStorage.setItem("portal-blog-theme", value), preference);
    await context.route("**/_next/**/*.js", route => route.abort());
    const page = await context.newPage();
    try {
      await page.goto(`${testInfo.project.use.baseURL}/blog/agent-context-engineering`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".blog-theme-shell")).toHaveAttribute("data-blog-theme", "system");
      await expect(page.locator(".blog-theme-shell")).toHaveCSS("background-color", preference === "dark" ? "rgb(15, 21, 36)" : "rgb(255, 255, 255)");
    } finally { await context.close(); }
  }
});

test("mobile category selection brings matching articles into view", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium", "stacked index layouts");
  await page.goto("/blog");
  await page.getByRole("button", { name: "系统架构", exact: true }).click();
  await expect(page.locator(".blog-card")).toHaveCount(2);
  await expect(page.locator(".blog-card").first()).toBeInViewport();
  await expect(page.locator(".blog-result-count")).toHaveText("02 篇公开文章 · 系统架构");
});
