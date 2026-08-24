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
  await expect(page.locator("html")).toHaveAttribute(
    "data-brand-motion",
    "static",
  );
  await expect(page.locator(".metric-card").first()).not.toHaveAttribute(
    "data-metric-visible",
    /.+/,
  );
  await expect(page.locator(".internship-card").first()).not.toHaveAttribute(
    "data-story-stage",
    /.+/,
  );
  await expect(page.locator(".open-source-spotlight")).not.toHaveAttribute(
    "data-open-source-stage",
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
  await expect(page.locator("html")).toHaveAttribute(
    "data-brand-motion",
    "enhanced",
  );

  const firstMetric = page.locator(".metric-card").first();
  await firstMetric.scrollIntoViewIfNeeded();
  await expect(firstMetric).toHaveAttribute("data-metric-visible", "true");

  await page.locator("#internships").scrollIntoViewIfNeeded();
  await expect(page.locator(".agent-network")).toHaveAttribute(
    "data-scene-transition",
    /decomposing|timeline/,
  );

  const firstCard = page.locator(".internship-card").first();
  await firstCard.scrollIntoViewIfNeeded();
  await expect(firstCard).toHaveAttribute("data-story-stage", /[0-3]/);

  const firstChain = page.locator(".architecture-flow").first();
  await firstChain.scrollIntoViewIfNeeded();
  await expect(firstChain).toHaveAttribute("data-chain-stage", /[1-3]/);

  await page.locator("#open-source").scrollIntoViewIfNeeded();
  await expect(page.locator(".open-source-spotlight")).toHaveAttribute(
    "data-open-source-stage",
    /[0-3]/,
  );
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
  await expect(page.locator("html")).toHaveAttribute(
    "data-brand-motion",
    "static",
  );
  await expect(page.locator(".metric-card").first()).not.toHaveAttribute(
    "data-metric-visible",
    /.+/,
  );
  await expect(page.locator(".internship-card").first()).not.toHaveAttribute(
    "data-story-stage",
    /.+/,
  );
  await expect(page.locator(".open-source-spotlight")).not.toHaveAttribute(
    "data-open-source-stage",
    /.+/,
  );
});
