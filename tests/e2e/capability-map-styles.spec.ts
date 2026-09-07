import { expect, test, type Page } from "@playwright/test";
import { expectNoRotation } from "./helpers/css";

const layerColumnCount = async (page: Page) => {
  const value = await page
    .getByRole("region", { name: "Semantica 核心架构" })
    .locator(".arch-layer")
    .first()
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  return value === "none" ? 1 : value.split(" ").filter(Boolean).length;
};

test("architecture diagram stacks on mobile and forms a two-column desktop layout", async ({ page }) => {
  const map = page.getByRole("region", { name: "Semantica 核心架构" });

  // Mobile: capabilities stack under their layer title and the spanning
  // traceability rail stays a horizontal pill.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(map).toBeVisible();
  expect(await layerColumnCount(page)).toBe(1);
  expect(
    await map.locator(".arch-spanning").evaluate((element) => getComputedStyle(element).writingMode),
  ).toBe("horizontal-tb");

  // Tablet and desktop: two-column layer bands, a vertical spanning rail, and
  // connectors between consecutive layers only.
  for (const width of [768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(map).toBeVisible();
    expect(await layerColumnCount(page)).toBe(2);
    expect(
      await map.locator(".arch-spanning").evaluate((element) => getComputedStyle(element).writingMode),
    ).toBe("vertical-rl");

    const layers = map.locator(".arch-layer");
    for (let index = 0; index < 3; index += 1) {
      const connector = await layers
        .nth(index)
        .evaluate((element) => getComputedStyle(element, "::after").content);
      expect(connector).not.toBe("none");
    }
    expect(
      await layers.nth(3).evaluate((element) => getComputedStyle(element, "::after").content),
    ).toBe("none");
  }
});

test("content cards stay horizontal and pointer hover moves at most two pixels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
  const cards = page.locator(
    ".profile-info-facts, .sticky-internship-card, .system-project-panel, .open-source-showcase, #writing article, #contact > section, .blog-card",
  );
  await expectNoRotation(cards);

  const card = page.locator(".open-source-showcase");
  await card.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  const before = await card.boundingBox();
  await card.hover();
  await page.waitForTimeout(250);
  const after = await card.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  const deltaY = after!.y - before!.y;
  expect(deltaY).toBeGreaterThanOrEqual(-2.1);
  expect(deltaY).toBeLessThanOrEqual(0.1);
});