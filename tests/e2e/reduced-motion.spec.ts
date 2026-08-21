import { expect, test } from "@playwright/test";

test("uses the static scene without hiding core hero content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("static-network")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("uses the lite scene on a narrow viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  await expect(page.locator(".agent-network")).toHaveAttribute(
    "data-scene-mode",
    "lite",
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
