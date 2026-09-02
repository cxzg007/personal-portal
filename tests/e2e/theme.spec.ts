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

test("page canvas paints the warm paper token as a solid background", async ({ page }) => {
  await page.goto("/");
  const colors = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--page)";
    document.body.appendChild(probe);
    const tokenColor = getComputedStyle(probe).color;
    probe.remove();
    return {
      tokenColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(colors.bodyBackground).toBe(colors.tokenColor);
});

test("sticky navigation uses a translucent cream panel with a soft shadow", async ({ page }) => {
  await page.goto("/blog");
  const nav = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const style = getComputedStyle(header!);
    const match = style.backgroundColor.match(/^rgba?\(([^)]+)\)$/);
    const parts = match ? match[1].split(",").map((part) => Number.parseFloat(part.trim())) : [];
    return {
      background: style.backgroundColor,
      alpha: parts.length === 4 ? parts[3] : 1,
      red: parts[0] ?? 0,
      green: parts[1] ?? 0,
      blue: parts[2] ?? 0,
      shadow: style.boxShadow,
    };
  });
  expect(nav.background).toBe("rgba(255, 250, 240, 0.82)");
  expect(nav.alpha).toBeGreaterThan(0.5);
  expect(nav.red).toBe(255);
  expect(nav.green).toBe(250);
  expect(nav.blue).toBe(240);
  expect(nav.shadow).not.toBe("none");
});

test("focused navigation and call-to-action links show a terracotta ring of at least 2px", async ({ page }) => {
  await page.goto("/");
  const navLink = page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "信息", exact: true });
  const cta = page.getByRole("link", { name: "查看实习", exact: true });
  for (let i = 0; i < 6 && !(await navLink.evaluate((element) => element === document.activeElement)); i += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(navLink).toBeFocused();
  const navRing = await navLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });
  for (let i = 0; i < 10; i += 1) {
    if (await cta.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(cta).toBeFocused();
  const ctaRing = await cta.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
  });
  for (const ring of [navRing, ctaRing]) {
    expect(ring.style).not.toBe("none");
    expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
    expect(ring.color).toBe("rgb(184, 95, 63)");
  }
});

test("homepage alternates warm portfolio section themes", async ({ page }) => {
  await page.goto("/");
  // 外层分区与 .profile-info 组件根都带 id="info"，用 .profile-stage 限定外层。
  await expect(page.locator("#info.profile-stage")).toHaveClass(/profile-stage--cream/);
  await expect(page.locator("#internships")).toHaveClass(/profile-stage--sage/);
  await expect(page.locator("#systems")).toHaveClass(/profile-stage--cream/);
  await expect(page.locator("#open-source")).toHaveClass(/profile-stage--terracotta/);
  await expect(page.locator("#writing")).toHaveClass(/profile-stage--sage/);
  await expect(page.locator("#contact")).toHaveClass(/profile-stage--terracotta/);
});