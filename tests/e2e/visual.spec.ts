import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const viewport = testInfo.project.name === "mobile"
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 };

  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function prepareStablePage(page: import("@playwright/test").Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("canvas")).toHaveCount(0);
}

test("homepage hero visual", async ({ page }) => {
  await prepareStablePage(page, "/");

  await expect(page.locator(".hero")).toHaveScreenshot("homepage-hero.png");
});

test("expanded internship visual", async ({ page }) => {
  await prepareStablePage(page, "/");

  const internship = page.locator("#internships").getByRole("article").first();
  await internship.getByRole("button", { name: "查看技术细节" }).click();
  await expect(internship.getByRole("heading", { name: "业务背景" })).toBeVisible();

  await expect(internship).toHaveScreenshot("expanded-internship.png");
});

test("blog index visual", async ({ page }) => {
  await prepareStablePage(page, "/blog");

  await expect(page.locator("#main-content")).toHaveScreenshot("blog-index.png");
});

test("article detail visual", async ({ page }) => {
  await prepareStablePage(page, "/blog/first-agent-system");

  await expect(page.locator(".article-layout")).toHaveScreenshot("article-detail.png");
});
