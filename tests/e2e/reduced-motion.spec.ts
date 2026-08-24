import { expect, test } from "@playwright/test";

test("uses the static scene without hiding core hero content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("static-network")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
  await expect(page.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-enhancement",
    "disabled",
  );
  await expect(page.locator(".agent-network")).not.toHaveAttribute(
    "data-scene-transition",
    /.+/,
  );
  await expect(page.locator(".architecture-flow").first()).not.toHaveAttribute(
    "data-chain-stage",
    /.+/,
  );
});

test("exposes deterministic scroll-linked states when motion is allowed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-enhancement",
    "enabled",
  );
  await page.locator("#internships").scrollIntoViewIfNeeded();
  await expect(page.locator(".agent-network")).toHaveAttribute(
    "data-scene-transition",
    /decomposing|timeline/,
  );

  const firstChain = page.locator(".architecture-flow").first();
  await firstChain.scrollIntoViewIfNeeded();
  await expect(firstChain).toHaveAttribute("data-chain-stage", /[1-3]/);
});

test("uses the lite scene on a narrow viewport", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  await expect(page.locator(".agent-network")).toHaveAttribute(
    "data-scene-mode",
    "lite",
  );
  await expect(page.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
});
