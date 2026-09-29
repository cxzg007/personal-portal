import { expect, test, type Locator } from "@playwright/test";

const figures = "#internships figure[data-engineering-kind]";

async function animationTime(figure: Locator) {
  return figure.evaluate((element) => {
    const animation = element.getAnimations({ subtree: true }).find((item) =>
      item instanceof CSSAnimation && /flow|playhead/.test(item.animationName),
    );
    return Number(animation?.currentTime ?? -1);
  });
}

test("each diagram moves, pauses at its current frame, and resumes from keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  for (const figure of await page.locator(figures).all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute("data-motion", "running");
    const start = await animationTime(figure);
    expect(start).toBeGreaterThanOrEqual(0);
    await expect.poll(() => animationTime(figure)).toBeGreaterThan(start + 100);
    const pause = figure.getByRole("button", { name: /暂停/ });
    await pause.focus();
    await page.keyboard.press("Enter");
    await expect(figure).toHaveAttribute("data-motion", "paused");
    // Two animation frames allow the pending CSS style to settle before sampling.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const frozen = await animationTime(figure);
    await page.waitForTimeout(180);
    expect(await animationTime(figure)).toBe(frozen);
    await page.keyboard.press("Enter");
    await expect.poll(() => animationTime(figure)).toBeGreaterThan(frozen + 100);
  }
});

test("offscreen figures stop and a manual pause survives scrolling away and back", async ({ page }) => {
  await page.goto("/");
  const figure = page.locator(figures).first();
  await expect(figure).toHaveAttribute("data-motion", "paused");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-motion", "running");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-motion", "paused");
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-motion", "running");
  await figure.getByRole("button").click();
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveAttribute("data-motion", "paused");
});

test("reduced motion gives complete diagrams without running animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const figure of await page.locator(figures).all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.getByRole("img")).toBeVisible();
    await expect(figure.getByRole("button", { name: /静态示意/ })).toBeDisabled();
    expect(await animationTime(figure)).toBe(-1);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(figures).last()).toHaveAttribute("data-motion", "running");
});

test("without JavaScript diagrams and internship text remain visible with no inactive controls", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(baseURL!);
    for (const figure of await page.locator(figures).all()) {
      await expect(figure.getByRole("img")).toBeVisible();
      await expect(figure.getByRole("button")).toHaveCount(0);
      await expect(figure).toHaveAttribute("data-motion", "paused");
      const states = await figure.evaluate((element) => element.getAnimations({ subtree: true }).map((animation) => animation.playState));
      expect(states.every((state) => state === "paused")).toBe(true);
    }
    await expect(page.locator(".internship-contribution")).toHaveCount(3);
  } finally { await context.close(); }
});
