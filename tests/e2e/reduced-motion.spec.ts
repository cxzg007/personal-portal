import { expect, test } from "@playwright/test";

const NAV_SECTIONS = ["info", "internships", "systems", "open-source", "writing", "contact"];

test("reduced motion preference keeps the layout static without hiding content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "static");
  await expect(page.locator("[data-in-view]")).toHaveCount(0);
  await expect(page.locator(".sticky-internship-card[data-stack-progress]")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);

  await expect(page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习" })).toBeVisible();
  await expect(page.locator("main > section#internships .sticky-internship-card")).toHaveCount(3);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
});

test("enhanced motion marks one active navigation link after scrolling each section", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "enhanced");

  const scrollToSectionTop = (sectionId: string) =>
    page.evaluate((id) => {
      const section = document.querySelector(`main > section#${id}`);
      const header = document.querySelector("header");
      if (!section || !header) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const target = section.getBoundingClientRect().top + window.scrollY - headerBottom - 60;
      window.scrollTo(0, Math.max(0, target));
    }, sectionId);

  for (const sectionId of NAV_SECTIONS) {
    await scrollToSectionTop(sectionId);
    await expect(page.locator("html")).toHaveAttribute("data-active-section", sectionId);
    const activeLink = page.locator(`nav[aria-label="主导航"] a[data-nav-section="${sectionId}"]`);
    await expect(activeLink).toHaveAttribute("aria-current", "location");
  }

  await scrollToSectionTop("writing");
  await expect
    .poll(async () => page.locator('.sticky-internship-card[data-stack-progress="2"]').count())
    .toBeGreaterThan(0);
});

test("layout stays static at 390px and restores enhanced motion above the 760px breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "static");
  await expect(page.locator("[data-in-view]")).toHaveCount(0);
  await expect(page.locator(".sticky-internship-card[data-stack-progress]")).toHaveCount(0);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "enhanced");
});