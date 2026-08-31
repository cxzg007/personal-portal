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
  expect(tokens.ink).toBe("#3d2f1e");
  expect(tokens.bg).toBe("#f7efdd");
  expect(tokens.muted).toBe("#3d2f1e9e");
});

test("homepage keeps readable contrast on the light theme", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  expect(contrast).toEqual([]);
});

test("root document background is light, not dark", async ({ page }) => {
  await page.goto("/");
  const pageColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--page").trim(),
  );
  expect(pageColor).toBe("#faf3e3");
});