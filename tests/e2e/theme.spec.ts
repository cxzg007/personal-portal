import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage uses graphite exhibition and light reading tokens", async ({ page }) => {
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
  expect(tokens.ink).toBe("#19283b");
  expect(tokens.bg).toBe("#f5f7fa");
  expect(tokens.muted).toBe("#596779");
  await expect(page.locator("#profile")).toHaveCSS("background-color", "rgb(16, 19, 23)");
  await expect(page.locator("#contact")).toHaveCSS("background-color", "rgb(16, 19, 23)");
});

test("homepage paints a solid editorial surface without gradients or card shadows", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".profile-shell")).toHaveCSS("background-color", "rgb(245, 247, 250)");
  await expect(page.locator("#internships article").first()).toHaveCSS("box-shadow", "none");
  const font = await page
    .locator("#profile h1")
    .evaluate((node) => getComputedStyle(node).fontFamily);
  expect(font).toContain("system-ui");
});

test("homepage keeps readable contrast across dark and light sections", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  expect(contrast).toEqual([]);
});

test("homepage keeps its scoped blue type system", async ({ page }) => {
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
  expect(values.heading).toContain("system-ui");
  expect(values.meta).toContain("system-ui");
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

test("blog navigation retains its independent white and blue surface", async ({ page }) => {
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
  expect(nav.background).toBe("rgba(255, 255, 255, 0.94)");
  expect(nav.alpha).toBeGreaterThan(0.5);
  expect(nav.red).toBe(255);
  expect(nav.green).toBe(255);
  expect(nav.blue).toBe(255);
  expect(nav.shadow).toBe("none");
});

test("focused navigation and call-to-action links show a blue ring of at least 2px", async ({ page }) => {
  await page.goto("/");
  // 移动视口（<=760px）下桌面主导航被隐藏，链接只存在于汉堡菜单抽屉中，
  // 需先打开菜单并改用「移动导航」定位，否则 Tab 无法聚焦到目标链接。
  const desktopNav = page.getByRole("navigation", { name: "主导航" });
  const isDesktopNavVisible = await desktopNav.isVisible();
  if (!isDesktopNavVisible) {
    await page.getByRole("button", { name: "打开导航菜单" }).click();
  }
  const navLink = isDesktopNavVisible
    ? desktopNav.getByRole("link", { name: "实习", exact: true })
    : page.getByRole("navigation", { name: "移动导航" }).getByRole("link", { name: "实习", exact: true });
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
    expect(ring.color).toBe("rgb(138, 180, 255)");
  }
});

test("homepage sections use the same undecorated reading surface", async ({ page }) => {
  await page.goto("/");
  for (const id of ["internships", "systems", "open-source", "writing", "contact"]) {
    const section = page.locator(`#${id}`);
    await expect(section).toBeVisible();
    const decoration = await section.evaluate((element) => getComputedStyle(element, "::before").content);
    expect(decoration).toBe("none");
  }
});
