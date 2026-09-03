import { expect, test } from "@playwright/test";

import { expectNoRotation } from "./helpers/css";

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

  const map = page.getByRole("region", { name: "Semantica 双层能力地图" });
  const motionTargets = map.locator(
    ".open-source-capability-node, .open-source-contribution-domain, .open-source-pr-link",
  );
  const transitionDurations = await motionTargets.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).transitionDuration),
  );
  expect(transitionDurations.length).toBeGreaterThan(0);
  expect(transitionDurations.every((duration) => duration === "0s")).toBe(true);

  const cards = page.locator(
    ".profile-info-facts, .sticky-internship-card, .system-project-panel, .open-source-showcase, #writing article, #contact > section, .blog-card",
  );
  await expectNoRotation(cards);
  const transformsBeforeHover = await cards.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).transform),
  );
  for (const [index, before] of transformsBeforeHover.entries()) {
    await cards.nth(index).hover();
    const after = await cards.nth(index).evaluate(
      (element) => getComputedStyle(element).transform,
    );
    expect(after).toBe(before);
  }

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

  const scrollToSectionTop = (sectionId: string, allowBottom = false) =>
    page.evaluate(({ id, allowBottom }) => {
      const section = document.querySelector(`main > section#${id}`);
      const header = document.querySelector("header");
      if (!section || !header) return;
      const headerBottom = header.getBoundingClientRect().bottom;
      const desired = section.getBoundingClientRect().top + window.scrollY - headerBottom - 60;
      // 滚动位置到达页面底部会触发 motion controller 的页底兜底（高亮最后一个
      // section）。非最后一个 section 保留 2px 余量，确保判定走常规命中路径。
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = allowBottom ? desired : Math.min(desired, maxScroll - 2);
      window.scrollTo(0, Math.max(0, target));
    }, { id: sectionId, allowBottom });

  for (const sectionId of NAV_SECTIONS) {
    await scrollToSectionTop(sectionId, sectionId === NAV_SECTIONS.at(-1));
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

test("reduced motion removes reveal transitions while keeping section content visible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const reveals = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".profile-reveal")).map((element) => {
      const style = getComputedStyle(element);
      return {
        transitionDuration: style.transitionDuration,
        transform: style.transform,
        opacity: style.opacity,
      };
    }),
  );

  expect(reveals.length).toBeGreaterThan(0);
  for (const reveal of reveals) {
    expect(reveal.transitionDuration).toBe("0s");
    expect(reveal.transform).toBe("none");
    expect(reveal.opacity).toBe("1");
  }
});