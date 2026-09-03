import { expect, test } from "@playwright/test";
import { expectNoRotation } from "./helpers/css";

const columnCount = async (page: import("@playwright/test").Page) => {
  const value = await page.getByLabel("Semantica 项目工作链").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns,
  );
  return value.split(" ").filter(Boolean).length;
};

test("capability map uses five, three, and one column without unreadable muting", async ({ page }) => {
  for (const [width, expectedColumns] of [[1280, 5], [768, 3], [390, 1]] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByLabel("Semantica 项目工作链")).toBeVisible();
    expect(await columnCount(page)).toBe(expectedColumns);
  }

  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
  const map = page.getByRole("region", { name: "Semantica 双层能力地图" });
  await map.getByRole("button", { name: "能力节点：Rule & Decision" }).click();
  const opacity = await map.getByTestId("domain-graph-data-adapters").evaluate(
    (element) => Number(getComputedStyle(element).opacity),
  );
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