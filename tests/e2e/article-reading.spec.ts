import { expect, test } from "@playwright/test";

const article = "/blog/agent-context-engineering";

test("contents follow keyboard navigation, reading forward and returning to an earlier section", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "desktop sticky contents");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(article);
  const toc = page.locator(".article-toc-desktop");
  const target = toc.getByRole("link", { name: "4. 任务状态的显式维护", exact: true });
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(target).toHaveAttribute("aria-current", "location");
  await expect(page.getByRole("heading", { name: "4. 任务状态的显式维护", exact: true })).toBeInViewport();
  const earlier = page.locator(".article-prose h2").nth(1);
  await earlier.evaluate((node) => node.scrollIntoView());
  await expect(toc.getByRole("link", { name: "2. 缓存复用与前缀稳定性", exact: true })).toHaveAttribute("aria-current", "location");
  await expect(toc.locator('[aria-current="location"]')).toHaveCount(1);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(toc.locator('[aria-current="location"]')).toHaveCount(0);
});

test("direct section URLs restore the current location and diagrams remain readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const id = "5-任务感知的上下文压缩";
  await page.goto(`${article}#${encodeURIComponent(id)}`);
  const heading = page.getByRole("heading", { name: "5. 任务感知的上下文压缩", exact: true });
  const current = page.locator('.article-toc a[aria-current="location"]');
  await expect(heading).toBeInViewport();
  await expect(current).toHaveCount(2);
  await expect(current.first()).toHaveAttribute("href", `#${id}`);
  await page.reload();
  await expect(heading).toBeInViewport();
  await expect(current.first()).toHaveAttribute("href", `#${id}`);
  for (const figure of await page.locator(".article-figure").all()) {
    const image = figure.getByRole("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(figure.locator("a")).toHaveAttribute("target", "_blank");
    await expect(figure.locator("figcaption")).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
