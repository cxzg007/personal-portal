import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  const visualViewports: Record<string, { width: number; height: number }> = {
    chromium: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
  };
  const viewport = visualViewports[testInfo.project.name];
  if (!viewport) throw new Error(`Missing visual viewport for ${testInfo.project.name}`);

  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function prepareStablePage(page: Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function combinedRegion(page: Page, locators: Locator[]) {
  const boxes = [];
  for (const locator of locators) {
    const box = await locator.boundingBox();
    expect(box, `expected visible geometry for ${locator}`).not.toBeNull();
    boxes.push(box!);
  }

  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  return {
    x,
    y,
    width: Math.max(...boxes.map((box) => box.x + box.width)) - x,
    height: Math.max(...boxes.map((box) => box.y + box.height)) - y,
  };
}

test("profile hero visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  await expect(page.locator("section.profile-hero")).toHaveScreenshot("profile-hero-1440.png");
});

test("profile information visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  await expect(page.locator("main > section#info")).toHaveScreenshot("profile-information-1440.png");
});

test("internship story stack visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  await expect(page.locator("main > section#internships")).toHaveScreenshot("sticky-internships-1440.png");
});

test("system project tabs visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  await expect(page.locator("main > section#systems")).toHaveScreenshot("system-tabs-1440.png");
});

test("open source showcase visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  const openSource = page.locator("main > section#open-source");
  const clip = await combinedRegion(page, [openSource]);

  await expect(page).toHaveScreenshot("open-source-1440.png", { fullPage: true, clip });
});

test("writing stage and contact visual at 1440", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1440 baseline");

  await prepareStablePage(page, "/");
  const writing = page.locator("main > section#writing");
  const contact = page.locator("main > section#contact");
  const clip = await combinedRegion(page, [writing, contact]);

  await expect(page).toHaveScreenshot("writing-contact-1440.png", { fullPage: true, clip });
});

test("full homepage visual at 1280x800", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1280x800 baseline");

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepareStablePage(page, "/");

  await expect(page).toHaveScreenshot("homepage-1280.png", { fullPage: true });
});

test("full homepage narrative visual at 1920x1080", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1920x1080 narrative snapshot");

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await prepareStablePage(page, "/");

  await expect(page).toHaveScreenshot("homepage-narrative-1920.png", { fullPage: true });
});

test("tablet and mobile homepage overflow regression", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "chromium", "tablet/mobile-only overflow regression baseline");

  await prepareStablePage(page, "/");

  await expect(page).toHaveScreenshot("homepage-overflow-regression.png", { fullPage: true });
});

test("blog index visual", async ({ page }) => {
  await prepareStablePage(page, "/blog");

  await expect(page.locator("#main-content")).toHaveScreenshot("blog-index.png");
});

test("article detail visual", async ({ page }) => {
  await prepareStablePage(page, "/blog/first-agent-system");

  await expect(page.locator(".article-layout")).toHaveScreenshot("article-detail.png");
});

test("Semantica capability map remains stable", async ({ page }) => {
  await prepareStablePage(page, "/");
  const map = page.getByRole("region", { name: "Semantica 双层能力地图" });
  await expect(map).toBeVisible();
  await expect(map).toHaveScreenshot("semantica-capability-map.png", {
    animations: "disabled",
  });

  await map.getByRole("button", { name: "能力节点：Rule & Decision" }).click();
  await expect(map).toHaveScreenshot("semantica-rule-decision.png", {
    animations: "disabled",
  });
});