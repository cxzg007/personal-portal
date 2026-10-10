import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const ontologyTitle = "Palantir 本体论：把业务语义做成可执行的操作层";
const graphOntologyTitle = "图工程之后：多智能体系统缺的是一层语义";
const semanticaTitle = "Semantica 开源实践：让推理有依据，让变化可追溯";
const concurrencyTitle = "高并发架构：读写分工与一致性取舍";

test("mobile contents can be expanded and followed without JavaScript", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "one no-JavaScript check at a mobile viewport");
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    for (const slug of ["graph-engineering-ontology", "palantir-ontology-notes", "semantica-reasoning-engineering", "high-concurrency-read-write-design"]) {
      await page.goto(`${testInfo.project.use.baseURL}/blog/${slug}`);
      const summary = page.locator(".article-toc-mobile summary");
      const toc = page.getByRole("navigation", { name: "文章目录" });
      await expect(summary).toBeVisible();
      await expect(toc.getByRole("link")).toHaveCount(0);
      await summary.focus();
      await page.keyboard.press("Enter");
      const lastSection = toc.getByRole("link", { name: "参考资料", exact: true });
      await expect(lastSection).toBeVisible();
      await lastSection.click();
      await expect(page.getByRole("heading", { name: "参考资料", exact: true })).toBeInViewport();
    }
  } finally {
    await context.close();
  }
});

test("articles remain readable with 200 percent text at narrow and wide widths", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "explicit viewport matrix");
  for (const slug of ["graph-engineering-ontology", "palantir-ontology-notes", "semantica-reasoning-engineering", "high-concurrency-read-write-design"]) {
    await page.goto(`/blog/${slug}`);
    await expect(page.locator(".article-prose")).toBeVisible();
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const elements = document.querySelectorAll<HTMLElement>(
          ".article-header, .article-toc, .article-prose, .article-prose p, .article-prose h2, .code-frame, .header-inner, .site-mark, .desktop-navigation, .navigation-list a",
        );
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          outside: [...elements].filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left < 0 || rect.right > window.innerWidth + 1;
          }).map((node) => node.className || node.tagName),
          proseSize: parseFloat(getComputedStyle(document.querySelector(".article-prose")!).fontSize),
          navOverlap: (() => {
            const mark = document.querySelector(".site-mark")!.getBoundingClientRect();
            const nav = document.querySelector(".desktop-navigation")!.getBoundingClientRect();
            return nav.width > 0 && mark.right > nav.left && mark.bottom > nav.top;
          })(),
          splitNavigation: [...document.querySelectorAll(".desktop-navigation a")].some((link) => {
            const range = document.createRange();
            range.selectNodeContents(link);
            return new Set([...range.getClientRects()].map((rect) => rect.top)).size > 1;
          }),
        };
      });
      expect(geometry.overflow, `${slug} at ${width}px`).toBe(false);
      expect(geometry.outside, `${slug} at ${width}px`).toEqual([]);
      expect(geometry.navOverlap, `${slug} at ${width}px`).toBe(false);
      expect(geometry.splitNavigation, `${slug} at ${width}px`).toBe(false);
      expect(geometry.proseSize).toBeGreaterThanOrEqual(34);
    }
  }
});

test("expanded mobile navigation fits and scrolls at 200 percent text", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "explicit enlarged mobile viewport checks");
  for (const route of ["/blog", "/blog/graph-engineering-ontology"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.addStyleTag({ content: "html { font-size: 200%; }" });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 568 });
      await page.getByRole("button", { name: "打开导航菜单" }).click();
      const menu = page.locator(".mobile-menu-shell");
      const bounds = (await menu.boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(568);
      for (const link of await menu.getByRole("link").all()) {
        await link.focus();
        await expect(link).toBeInViewport();
        const fits = await link.evaluate((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          const text = range.getBoundingClientRect();
          const box = node.getBoundingClientRect();
          return text.left >= box.left && text.right <= box.right + 1;
        });
        expect(fits, (await link.textContent()) ?? "navigation link").toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeFocused();
    }
  }
});

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

for (const route of [
  "/",
  "/blog",
  "/blog/graph-engineering-ontology",
  "/blog/palantir-ontology-notes",
  "/blog/semantica-reasoning-engineering",
] as const) {
  test(`${route} loaded script bodies exclude Three.js and React Three Fiber`, async ({ page }) => {
    await expectRouteBundlesWithoutThree(page, route);
  });
}

test("server-renders the public blog and filters without losing the empty-state recovery", async ({
  page,
}) => {
  await page.goto("/blog");

  await expect(page.getByRole("heading", { level: 1, name: "技术博客" })).toBeVisible();
  await expect(page.getByRole("link", { exact: true, name: graphOntologyTitle })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expectNoThreeScene(page);

  const search = page.getByRole("searchbox", { name: "搜索文章" });
  await search.fill("图工程");
  await expect(page.getByRole("link", { exact: true, name: graphOntologyTitle })).toBeVisible();

  await page.getByRole("button", { name: "本体工程" }).click();
  await expect(page.getByRole("link", { exact: true, name: graphOntologyTitle })).toBeVisible();

  await search.fill("完全不存在的文章关键词");
  await expect(page.getByText("没有找到匹配的文章")).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("link", { exact: true, name: graphOntologyTitle })).toBeVisible();
});

test("blog index uses the blue portfolio palette with readable article rows", async ({
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
  expect(values.activeTagBackground).toBe("rgb(36, 88, 166)");
  expect(values.filterPanelBackground).toBe("rgba(0, 0, 0, 0)");
  expect(values.searchFieldFont).toContain("system-ui");
  expect(values.cardBackground).toBe("rgba(0, 0, 0, 0)");
  expect(values.cardMetaFont).toContain("system-ui");

  await expect(page.locator(".blog-card h2")).toHaveText([concurrencyTitle, semanticaTitle, graphOntologyTitle, ontologyTitle]);
  const originalCard = page.locator(".blog-card").filter({ hasText: ontologyTitle });
  await expect(originalCard.locator('[aria-label="文章标签"] li')).toHaveCount(4);
  await expect(page.getByRole("link", { exact: true, name: graphOntologyTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: `阅读文章：${graphOntologyTitle}` })).toBeVisible();
});

test("publishes the ontology article with working contents and adjacent navigation", async ({ page, request }) => {
  await page.goto("/blog");
  await page.getByRole("searchbox", { name: "搜索文章" }).fill("本体");
  await page.getByRole("link", { name: ontologyTitle, exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/palantir-ontology-notes$/);
  await expect(page.getByRole("heading", { level: 1, name: ontologyTitle })).toBeVisible();
  const disclosure = page.locator(".article-toc-mobile summary");
  if (await disclosure.isVisible()) await disclosure.click();
  const tocLink = page.getByRole("navigation", { name: "文章目录" })
    .getByRole("link", { name: "动作连接了建议与执行" });
  await tocLink.click();
  await expect(page.getByRole("heading", { name: "动作连接了建议与执行" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("link", { name: new RegExp(graphOntologyTitle) }).click();
  await expect(page).toHaveURL(/\/blog\/graph-engineering-ontology$/);
  const ontologyNeighbor = page.getByRole("navigation", { name: "相邻文章" })
    .getByRole("link")
    .filter({ hasText: ontologyTitle });
  // Route navigation scrolls this long article to the top before the next interaction.
  await expect(page.locator(".article-prose")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: graphOntologyTitle })).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(4);
  await ontologyNeighbor.click();
  await expect(page).toHaveURL(/\/blog\/palantir-ontology-notes$/);
  const rss = await request.get("/rss.xml");
  const rssText = await rss.text();
  expect(rssText).toContain("/blog/palantir-ontology-notes</link>");
  expect(rssText).not.toContain("ontology-to-agent-execution");
  expect(rssText).not.toContain("agent-engineering-five-layers");
  expect((await request.get("/blog/ontology-to-agent-execution")).status()).toBe(404);
  expect((await request.get("/blog/agent-engineering-five-layers")).status()).toBe(404);
});

test("publishes the Graph Engineering ontology article with formatted content", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { name: graphOntologyTitle, exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/graph-engineering-ontology$/);
  await expect(page.getByRole("heading", { level: 1, name: graphOntologyTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: "一张图能说明什么" })).toBeVisible();
  await expect(page.locator(".article-prose pre")).toContainText("sh:minCount 1");
  await expect(page.locator(".article-prose img")).toHaveCount(0);
  await expect(page.locator(".article-prose")).not.toContainText("**");
  await expect(page.locator(".article-prose")).not.toContainText("原文配图");
});

test("article keeps a comfortable reading measure and type size", async ({ page }) => {
  await page.goto("/blog/graph-engineering-ontology");
  const prose = page.locator(".article-prose");
  await expect(prose).toBeVisible();
  await expect(prose).toHaveCSS("font-family", /Inter|PingFang|Microsoft YaHei/);
  expect((await prose.boundingBox())!.width).toBeLessThanOrEqual(720);
  await expect(page.locator(".article-header h1")).toHaveCSS("font-family", /Noto Serif SC/);

  const reading = await page.evaluate(() => {
    const prose = document.querySelector<HTMLElement>(".article-prose")!;
    const header = document.querySelector<HTMLElement>(".article-header")!;
    const toc = document.querySelector<HTMLElement>(".article-toc")!;
    const meta = document.querySelector<HTMLElement>(".article-meta")!;
    const proseStyle = getComputedStyle(prose);
    return {
      proseRatio: parseFloat(proseStyle.lineHeight) / parseFloat(proseStyle.fontSize),
      proseMaxWidth: proseStyle.maxWidth,
      headerBackground: getComputedStyle(header).backgroundColor,
      fontSize: parseFloat(proseStyle.fontSize),
      tocBackground: getComputedStyle(toc).backgroundColor,
      metaFont: getComputedStyle(meta).fontFamily,
    };
  });

  expect(reading.proseRatio).toBeCloseTo(1.85, 2);
  expect(reading.fontSize).toBeGreaterThanOrEqual(17);
  expect(reading.proseMaxWidth).toBe("720px");
  expect(reading.headerBackground).toBe("rgba(0, 0, 0, 0)");
  expect(reading.tocBackground).toBe("rgba(0, 0, 0, 0)");
  expect(reading.metaFont).toContain("system-ui");
});

test("navigates back to home sections from the blog index", async ({ page }, testInfo) => {
  await page.goto("/blog");

  // 小屏下桌面导航不可达，需先展开汉堡菜单，断言/点击均走“移动导航”。
  const isMobile = testInfo.project.name === "mobile";
  const openMobileMenu = async () => {
    await page.getByRole("button", { name: "打开导航菜单" }).click();
  };
  const nav = page.getByRole("navigation", { name: isMobile ? "移动导航" : "主导航" });

  if (isMobile) {
    await openMobileMenu();
  }
  const blogLink = nav.getByRole("link", { name: "博客", exact: true });
  await expect(blogLink).toHaveAttribute("href", "/blog");
  await expect(blogLink).toHaveAttribute("aria-current", "page");

  if (isMobile) {
    await page.getByRole("button", { name: "关闭导航菜单" }).click();
  }

  const heroBackLink = page.locator(".blog-back-link");
  await expect(heroBackLink).toHaveAttribute("href", "/#top");
  await heroBackLink.click();
  await expect(page).toHaveURL(/\/#top$/);
  await expect(page.locator("main > section#writing")).toBeVisible();

  await page.goto("/blog");
  if (isMobile) {
    await openMobileMenu();
  }
  await nav.getByRole("link", { name: "实习", exact: true }).click();
  await expect(page).toHaveURL(/\/#internships$/);
  await expect(page.locator("main > section#internships")).toBeVisible();
});

test("opens the article with a table of contents and returns to the blog index", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("link", { exact: true, name: graphOntologyTitle }).click();

  await expect(page).toHaveURL(/\/blog\/graph-engineering-ontology$/);
  await expect(page.getByRole("heading", { level: 1, name: graphOntologyTitle })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("navigation", { name: "文章目录" })).toBeVisible();
  const disclosure = page.locator(".article-toc-mobile summary");
  if (await disclosure.isVisible()) await disclosure.click();
  await expect(
    page.getByRole("link", { name: "一张图能说明什么" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "W3C · Shapes Constraint Language（SHACL）", exact: true })).toHaveAttribute("href", "https://www.w3.org/TR/shacl/");
  await expect(page.locator("pre code").first()).toBeVisible();
  await expectNoThreeScene(page);

  await page.getByRole("link", { name: "返回博客" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { level: 1, name: "技术博客" })).toBeVisible();
});
