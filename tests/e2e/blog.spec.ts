import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const articleTitle = "从 Semantica 开源贡献看 Agent 项目的工程协作";

async function expectNoThreeScene(page: import("@playwright/test").Page) {
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator('script[src*="three"], script[src*="react-three"]')).toHaveCount(0);
}

const threeRuntimeSignatures = [
  { label: "React Three Fiber package", pattern: /@react-three[\\/]fiber/i },
  { label: "Three.js package path", pattern: /(?:node_modules|\.pnpm)[^\n"']*?[\\/]three(?:@|[\\/])/i },
  { label: "Three.js renderer", pattern: /WebGLRenderer/ },
  { label: "Three.js devtools hook", pattern: /__THREE_DEVTOOLS__/ },
  { label: "Three.js clock", pattern: /THREE\.Clock/ },
  { label: "Agent network scene module", pattern: /agent-network-scene/ },
] as const;

async function expectRouteBundlesWithoutThree(page: Page, route: string) {
  const scriptBodies: Promise<{ body: string; url: string }>[] = [];

  page.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;

    scriptBodies.push(
      response
        .text()
        .then((body) => ({ body, url: response.url() }))
        .catch(() => ({ body: "", url: response.url() })),
    );
  });

  await page.goto(route);
  await page.waitForLoadState("networkidle");

  const scripts = await Promise.all(scriptBodies);
  const offenders = scripts.flatMap(({ body, url }) =>
    threeRuntimeSignatures
      .filter(({ pattern }) => pattern.test(body))
      .map(({ label }) => ({ label, url })),
  );

  expect(offenders, `3D runtime leaked into scripts loaded by ${route}`).toEqual([]);
  await expect(page.locator("canvas")).toHaveCount(0);
}

for (const route of ["/", "/blog", "/blog/first-agent-system"] as const) {
  test(`${route} loaded script bodies exclude Three.js and React Three Fiber`, async ({ page }) => {
    await expectRouteBundlesWithoutThree(page, route);
  });
}

test("server-renders the public blog and filters without losing the empty-state recovery", async ({
  page,
}) => {
  await page.goto("/blog");

  await expect(page.getByRole("heading", { level: 1, name: "技术博客" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: articleTitle })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expectNoThreeScene(page);

  const search = page.getByRole("searchbox", { name: "搜索文章" });
  await search.fill("Semantica");
  await expect(page.getByRole("link", { exact: true, name: articleTitle })).toBeVisible();

  await page.getByRole("button", { name: "知识图谱" }).click();
  await expect(page.getByRole("link", { exact: true, name: articleTitle })).toBeVisible();

  await search.fill("完全不存在的文章关键词");
  await expect(page.getByText("没有找到匹配的文章")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("link", { exact: true, name: articleTitle })).toBeVisible();
});

test("blog index keeps the warm portfolio visual language with intact card content", async ({
  page,
}) => {
  await page.goto("/blog");

  const values = await page.evaluate(() => {
    const heroTitle = document.querySelector<HTMLElement>(".blog-hero h1")!;
    const activeTag = document.querySelector<HTMLButtonElement>(
      '.blog-tag-filter button[aria-pressed="true"]',
    )!;
    const filterPanel = document.querySelector<HTMLElement>(".blog-filter-panel")!;
    const searchField = document.querySelector<HTMLElement>(".blog-search-field")!;
    const card = document.querySelector<HTMLElement>(".blog-card")!;
    const cardMeta = document.querySelector<HTMLElement>(".blog-card-meta")!;
    return {
      heroFont: getComputedStyle(heroTitle).fontFamily,
      activeTagBackground: getComputedStyle(activeTag).backgroundColor,
      filterPanelBackground: getComputedStyle(filterPanel).backgroundColor,
      searchFieldFont: getComputedStyle(searchField).fontFamily,
      cardBackground: getComputedStyle(card).backgroundColor,
      cardMetaFont: getComputedStyle(cardMeta).fontFamily,
    };
  });

  expect(values.heroFont).toContain("Noto Serif SC");
  expect(["rgb(184, 95, 63)", "rgb(136, 68, 47)"]).toContain(values.activeTagBackground);
  expect(values.filterPanelBackground).toBe("rgb(220, 227, 207)");
  expect(values.searchFieldFont).toMatch(/Mono|monospace/);
  expect(values.cardBackground).toBe("rgb(255, 250, 240)");
  expect(values.cardMetaFont).toMatch(/Mono|monospace/);

  await expect(page.locator(".blog-card h2")).toHaveCount(1);
  await expect(page.locator(".blog-card h2")).toHaveText(articleTitle);
  await expect(page.locator('.blog-card [aria-label="文章标签"] li')).toHaveCount(3);
  await expect(page.getByRole("link", { exact: true, name: articleTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: `阅读文章：${articleTitle}` })).toBeVisible();
});

test("opens the article with a table of contents and returns to the blog index", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { exact: true, name: articleTitle }).click();

  await expect(page).toHaveURL(/\/blog\/first-agent-system$/);
  await expect(page.getByRole("heading", { level: 1, name: articleTitle })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("navigation", { name: "文章目录" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "贡献状态：先把事实说清楚" }),
  ).toBeVisible();
  await expect(page.getByText("#1081 与 #1094 已合并", { exact: false })).toBeVisible();
  await expect(page.locator("pre code")).toBeVisible();
  await expectNoThreeScene(page);

  await page.getByRole("link", { name: "返回博客" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { level: 1, name: "技术博客" })).toBeVisible();
});
