import { expect, test } from "@playwright/test";
import { expectNoRotation } from "./helpers/css";

test("content cards stay horizontal and pointer hover moves at most two pixels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
  const cards = page.locator(
    ".profile-info-facts, .sticky-internship-card, .system-project-panel, .open-source-showcase, #writing article, #contact > div, .blog-card",
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