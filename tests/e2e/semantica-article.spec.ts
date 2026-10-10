import { expect, test } from "@playwright/test";

const title = "Semantica 开源实践：让推理有依据，让变化可追溯";
const articlePath = "/blog/semantica-reasoning-engineering";

test("Semantica article is discoverable from the homepage, contribution section, and blog search", async ({ page }) => {
  await page.goto("/");
  const readingLink = page.locator("#writing").getByRole("link", { name: `阅读文章：${title}` });
  await expect(readingLink).toHaveAttribute("href", articlePath);
  await expect(page.locator("#open-source").getByRole("link", { name: "阅读相关技术文章" })).toHaveAttribute("href", articlePath);
  await readingLink.click();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  await page.getByRole("link", { name: "返回博客" }).click();
  await page.getByRole("searchbox", { name: "搜索文章" }).fill("Semantica");
  await expect(page.locator(".blog-card")).toHaveCount(1);
  await page.getByRole("link", { name: title, exact: true }).click();
  const neighbors = page.getByRole("navigation", { name: "相邻文章" });
  await expect(neighbors.getByRole("link", { name: /上一篇/ })).toHaveAttribute("href", "/blog/graph-engineering-ontology");
  await expect(neighbors.getByRole("link", { name: /下一篇/ })).toHaveAttribute("href", "/blog/high-concurrency-read-write-design");
});

test("Semantica article renders both supplied diagrams, sources, contents, and metadata", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(articlePath);
  expect(response?.status()).toBe(200);
  const prose = page.locator(".article-prose");
  await expect(prose.locator("figure")).toHaveCount(2);

  for (const name of ["semantica-platform", "semantica-contributions"]) {
    const src = `/blog/semantica/${name}.png`;
    const link = prose.locator(`a[href="${src}"]`);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("aria-label", /大图（新窗口）/);
    const image = link.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    const dimensions = await image.boundingBox();
    expect(dimensions!.width).toBeLessThanOrEqual(720);
    const asset = await request.get(src);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["content-type"]).toContain("image/png");
  }

  const disclosure = page.locator(".article-toc-mobile summary");
  if (await disclosure.isVisible()) await disclosure.click();
  await page.getByRole("navigation", { name: "文章目录" }).getByRole("link", { name: "4. 检索候选的证据校验" }).click();
  await expect(page.getByRole("heading", { name: "4. 检索候选的证据校验" })).toBeInViewport();
  await expect(prose.getByRole("link", { name: "PR #1831", exact: true })).toHaveAttribute("href", "https://github.com/semantica-agi/semantica/pull/1831");
  await expect(prose.getByRole("link", { name: "PR #1731", exact: true })).toHaveAttribute("href", "https://github.com/semantica-agi/semantica/pull/1731");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://portfolio.example.test${articlePath}`);
  const metadata = await page.locator('script[type="application/ld+json"]').evaluate((node) => JSON.parse(node.textContent ?? "{}"));
  expect(metadata).toMatchObject({ "@type": "BlogPosting", headline: title, datePublished: "2026-10-09", author: { name: "江俊杰" } });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
