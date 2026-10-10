import { expect, test } from "@playwright/test";

const title = "高并发架构：读写分工与一致性取舍";
const articlePath = "/blog/high-concurrency-read-write-design";

test("homepage reading button reaches the blog and its latest illustrated article", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("#profile").getByRole("link", { name: "阅读博客", exact: true });
  await expect(button).toHaveAttribute("href", "/blog");
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/blog$/);
  const latest = page.locator(".blog-card").first();
  await expect(latest.getByRole("heading")).toHaveText(title);
  await latest.getByRole("link", { name: title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${articlePath}$`));
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await page.getByRole("link", { name: "返回博客" }).click();
  await page.getByRole("searchbox", { name: "搜索文章" }).fill("高并发");
  await expect(page.locator(".blog-card")).toHaveCount(1);
  await expect(page.locator(".blog-card h2")).toHaveText(title);
});

test("concurrency article loads four full-size diagrams, numbered contents, and metadata", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect((await page.goto(articlePath))?.status()).toBe(200);
  const prose = page.locator(".article-prose");
  await expect(prose.locator("figure")).toHaveCount(4);
  await expect(prose.locator("table")).toHaveCount(1);
  await expect(prose.getByRole("heading", { level: 2, name: /^[1-9]\. / })).toHaveCount(9);

  for (const name of ["singleflight-coalescing", "cache-race", "cqrs-models", "async-backlog"]) {
    const src = `/blog/high-concurrency/${name}.png`;
    const link = prose.locator(`a[href="${src}"]`);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("aria-label", /大图（新窗口）/);
    const image = link.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    expect((await image.boundingBox())!.width).toBeLessThanOrEqual(720);
    const asset = await request.get(src);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["content-type"]).toContain("image/png");
  }

  const disclosure = page.locator(".article-toc-mobile summary");
  if (await disclosure.isVisible()) await disclosure.click();
  await page.getByRole("navigation", { name: "文章目录" }).getByRole("link", { name: "5. 缓存更新与数据一致性", exact: true }).click();
  await expect(prose.getByRole("heading", { name: "5. 缓存更新与数据一致性", exact: true })).toBeInViewport();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://portfolio.example.test${articlePath}`);
  const metadata = await page.locator('script[type="application/ld+json"]').evaluate((node) => JSON.parse(node.textContent ?? "{}"));
  expect(metadata).toMatchObject({ "@type": "BlogPosting", headline: title, datePublished: "2026-10-10", author: { name: "江俊杰" } });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
