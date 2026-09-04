import { expect, test } from "@playwright/test";
import { expectNoRotation } from "./helpers/css";

const columnCount = async (page: import("@playwright/test").Page) => {
  const value = await page.getByLabel("Semantica 架构支柱").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns,
  );
  return value.split(" ").filter(Boolean).length;
};

test("capability map uses six, three, and one column without unreadable muting", async ({ page }) => {
  for (const [width, expectedColumns] of [[1280, 6], [768, 3], [390, 1]] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByLabel("Semantica 架构支柱")).toBeVisible();
    expect(await columnCount(page)).toBe(expectedColumns);
  }

  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
  const map = page.getByRole("region", { name: "Semantica 架构与合并贡献" });
  await map.getByRole("button", { name: /^架构支柱：确定性推理/ }).click();
  const domainGraph = map.locator('[data-testid="merged-contribution"][data-pr-number="1081"]');
  const readOpacity = () => domainGraph.evaluate((element) => Number(getComputedStyle(element).opacity));
  // The 240ms opacity transition may not have rendered its first frame right
  // after the click, so poll until the muted state settles below 1.
  await expect.poll(readOpacity, { timeout: 5_000 }).toBeLessThan(1);
  const opacity = await readOpacity();
  expect(opacity).toBeGreaterThanOrEqual(0.65);
  expect(opacity).toBeLessThan(1);
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