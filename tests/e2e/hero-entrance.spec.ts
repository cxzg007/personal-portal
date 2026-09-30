import { expect, test, type Page } from "@playwright/test";

const hero = "#profile";
const title = ".profile-hero-title-text";
const rows = ".hero-experience-index li";

async function freezeEntrance(page: Page) {
  const time = new Date("2026-09-30T03:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(hero)).toHaveAttribute("data-hero-entrance", "running");
  const animations = await page.locator(hero).evaluateHandle((element) => {
    const animations = element.getAnimations({ subtree: true });
    animations.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    return animations;
  });
  await page.evaluate(() => document.fonts.ready);
  return animations;
}

async function expectStatic(page: Page) {
  await expect(page.locator(hero)).not.toHaveAttribute("data-hero-entrance", "running");
  await expect(page.locator(title)).toHaveCSS("opacity", "1");
  await expect(page.locator(title)).toHaveCSS("transform", "none");
  await expect(page.locator(rows)).toHaveCount(3);
  for (const row of await page.locator(rows).all()) {
    await expect(row).toHaveCSS("opacity", "1");
  }
  const entrances = await page.locator(hero).evaluate((element) => element.getAnimations({ subtree: true }).filter(
    (animation) => animation instanceof CSSAnimation && animation.animationName.startsWith("hero-entrance-"),
  ).length);
  expect(entrances).toBe(0);
}

test.describe("desktop entrance", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "First-visit choreography is desktop only");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("reveals the identity before experiences and preserves final layout", async ({ page }) => {
    const animations = await freezeEntrance(page);
    const layout = () => page.locator("#profile, .hero-experience-index, .profile-dock, #internships").evaluateAll((elements) =>
      elements.map((element) => ({ width: (element as HTMLElement).offsetWidth, height: (element as HTMLElement).offsetHeight, top: (element as HTMLElement).offsetTop })),
    );
    const before = await layout();
    await expect(page.locator(title)).toHaveCSS("opacity", "0");
    await expect(page.locator(rows).first()).toHaveCSS("opacity", "0");
    const end = await animations.evaluate((items) => Math.max(...items.map((item) => Number(item.effect!.getComputedTiming().endTime))));
    expect(end).toBeGreaterThanOrEqual(900);
    expect(end).toBeLessThanOrEqual(1000);

    await animations.evaluate((items) => items.forEach((item) => { item.currentTime = 300; }));
    expect(await page.locator(title).evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.8);
    await expect(page.locator(rows).first()).toHaveCSS("opacity", "0");
    await animations.evaluate((items) => items.forEach((item) => { item.currentTime = 600; }));
    const opacity = await page.locator(rows).evaluateAll((elements) => elements.map((element) => Number(getComputedStyle(element).opacity)));
    expect(opacity[0]).toBeGreaterThan(opacity[1]);
    expect(opacity[1]).toBeGreaterThan(opacity[2]);
    expect(opacity[0]).toBeGreaterThan(0.8);

    await animations.evaluate((items, endTime) => items.forEach((item) => { item.currentTime = endTime; }), end);
    await expect(page.locator(title)).toHaveCSS("opacity", "1");
    await expect(page.locator(rows).last()).toHaveCSS("opacity", "1");
    expect(await layout()).toEqual(before);
  });

  test("finishes naturally without hydration errors and does not replay on reload or blog return", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(hero)).toHaveAttribute("data-hero-entrance", "complete");
    await expectStatic(page);
    await page.reload();
    await expectStatic(page);
    await page.locator("#writing").getByRole("link", { name: "全部文章", exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await page.locator(".site-mark").click();
    await expect(page.locator(hero)).toBeVisible();
    await expectStatic(page);
    expect(errors).toEqual([]);
  });

  test("keyboard input immediately reveals content and preserves focus", async ({ page }) => {
    await freezeEntrance(page);
    await page.keyboard.press("Tab");
    await expectStatic(page);
    await expect(page.getByRole("link", { name: "跳到主要内容" })).toBeFocused();
  });

  test("a pointer click during the reveal still follows the experience link", async ({ page }) => {
    await freezeEntrance(page);
    const box = await page.getByRole("link", { name: "查看实习", exact: true }).boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expectStatic(page);
    await expect(page).toHaveURL(/#internships$/);
  });

  test("a changed motion preference ends the entrance permanently", async ({ page }) => {
    await freezeEntrance(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expectStatic(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expectStatic(page);
  });

  test("the entrance completes even when Next client scripts cannot load", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(hero)).toHaveAttribute("data-hero-entrance", "complete");
    await expectStatic(page);
    await page.getByRole("link", { name: "查看实习", exact: true }).click();
    await expect(page).toHaveURL(/#internships$/);
  });
});

test("reduced motion shows the complete hero immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expectStatic(page);
});

test("a narrow viewport shows the complete hero immediately", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.goto("/");
  await expectStatic(page);
});

test("blocked session storage keeps the homepage readable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage unavailable"); } });
  });
  await page.goto("/");
  await expectStatic(page);
});

test("direct anchors and arriving from the blog stay static", async ({ page }) => {
  await page.goto("/#internships");
  await expectStatic(page);
  await page.evaluate(() => sessionStorage.clear());
  await page.goto("/blog");
  await page.locator(".site-mark").click();
  await expect(page.locator(hero)).toBeVisible();
  await expectStatic(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the hero and its links remain available", async ({ page }) => {
    await page.goto("/");
    await expectStatic(page);
    await page.getByRole("link", { name: "查看实习", exact: true }).click();
    await expect(page).toHaveURL(/#internships$/);
  });
});
