import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage uses the light warm paper tokens", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".profile-shell");
    const styles = getComputedStyle(shell!);
    return {
      ink: styles.getPropertyValue("--profile-ink").trim(),
      bg: styles.getPropertyValue("--profile-bg").trim(),
      muted: styles.getPropertyValue("--profile-muted").trim(),
    };
  });
  expect(tokens.ink).toBe("#382d22");
  expect(tokens.bg).toBe("#f8efdc");
  expect(tokens.muted).toBe("#382d229e");
});

test("homepage keeps readable contrast on the light theme", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  expect(contrast).toEqual([]);
});

test("site exposes the warm portfolio token and type system", async ({ page }) => {
  await page.goto("/");
  const values = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const heading = getComputedStyle(document.querySelector(".profile-stage h2")!);
    const meta = getComputedStyle(document.querySelector(".profile-hero-kicker")!);
    return {
      page: root.getPropertyValue("--page").trim(),
      terracotta: root.getPropertyValue("--terracotta").trim(),
      sage: root.getPropertyValue("--sage").trim(),
      heading: heading.fontFamily,
      meta: meta.fontFamily,
    };
  });
  expect(values).toMatchObject({ page: "#f8efdc", terracotta: "#b85f3f", sage: "#7d9270" });
  expect(values.heading).toContain("Noto Serif SC");
  expect(values.meta).toMatch(/Mono|monospace/);
});

test("root document background is light, not dark", async ({ page }) => {
  await page.goto("/");
  const pageColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--page").trim(),
  );
  expect(pageColor).toBe("#f8efdc");
});