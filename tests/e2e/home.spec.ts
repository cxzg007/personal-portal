import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: /cxzg007 Profile/ });

  await expect(page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ })).toBeVisible();
  await expect(hero.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
  await expect(hero.getByText("AI Agent / 后端开发", { exact: true })).toBeVisible();
  await expect(hero.getByText("2027 届校招｜AI Agent / 后端开发")).toBeVisible();
  await expect(hero.getByText("电子信息", { exact: true })).toBeVisible();
  await expect(hero.getByText("通信工程", { exact: true })).toBeVisible();
  await expect(hero.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" })).toHaveAttribute(
    "href",
    "mailto:jiangjunjie_tj@foxmail.com",
  );
  await expect(hero.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/cxzg007",
  );
  await expect(page.getByRole("link", { name: "查看实习" })).toHaveAttribute("href", "#internships");
  await expect(hero.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
  await expect(page.getByRole("link", { name: "教育" })).toHaveCount(0);
});

test("internships, system cases, and contact form a keyboard-accessible recruiting narrative", async ({
  page,
}) => {
  await page.goto("/");

  const internships = page.locator("main > section#internships");
  const internshipArticles = internships.getByRole("article");
  await expect(internshipArticles).toHaveCount(3);
  await expect(internships.getByText("京东", { exact: true })).toBeVisible();
  await expect(internships.getByText("智元机器人", { exact: true })).toBeVisible();
  await expect(internships.getByText("中国船舶集团 722 研究所", { exact: true })).toBeVisible();
  await expect(internships.getByLabel("京东 能力建设记录")).toBeVisible();
  await expect(internships.getByLabel("智元机器人 能力建设记录")).toBeVisible();
  await expect(internships.getByLabel("中国船舶集团 722 研究所 能力建设记录")).toBeVisible();

  const systems = page.locator("main > section#systems");
  const tabs = systems.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(systems.getByRole("tabpanel")).toContainText("本体驱动的 Agent 数据智能平台");

  for (let step = 0; step < 40; step += 1) {
    if (await tabs.nth(0).evaluate((button) => document.activeElement === button)) break;
    await page.keyboard.press("Tab");
  }
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(systems.getByRole("tabpanel")).toContainText("机器人多传感器数据流式回放平台");

  await page.keyboard.press("End");
  await expect(tabs.nth(3)).toBeFocused();
  await expect(systems.getByRole("tabpanel")).toContainText("Semantica 开源贡献与工程复盘");

  await page.keyboard.press("Home");
  await expect(tabs.nth(0)).toBeFocused();
  await expect(systems.getByRole("tabpanel")).toContainText("本体驱动的 Agent 数据智能平台");

  const openSource = page.locator("main > section#open-source");
  await expect(openSource.getByRole("heading", { name: "Semantica", exact: true })).toBeVisible();
  await expect(openSource.getByText(/截至 2026-08-21/)).toBeVisible();
  await expect(openSource.getByRole("link", { name: "Semantica GitHub 仓库" })).toHaveAttribute(
    "href",
    "https://github.com/semantica-agi/semantica",
  );
  await expect(openSource.getByRole("link", { name: "阅读 Semantica 贡献复盘" })).toHaveAttribute(
    "href",
    "/blog/first-agent-system",
  );

  const contact = page.locator("main > section#contact");
  const email = contact.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" });
  const github = contact.getByRole("link", { name: "GitHub", exact: true });
  const resume = contact.getByRole("link", { name: "下载简历 PDF" });
  await expect(email).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(github).toHaveAttribute("href", "https://github.com/cxzg007");
  await expect(resume).toHaveAttribute("href", "/resume.pdf");

  for (const link of [email, github, resume]) {
    for (let step = 0; step < 40; step += 1) {
      if (await link.evaluate((element) => document.activeElement === element)) break;
      await page.keyboard.press("Tab");
    }
    await expect(link).toBeFocused();
  }
});

test("homepage navigation remains usable without horizontal overflow", async ({ page }) => {
  await page.goto("/");

  const menuToggle = page.getByRole("button", { name: "打开导航菜单" });
  if (await menuToggle.isVisible()) {
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "移动导航" })).toBeVisible();

    await page.getByRole("button", { name: "关闭导航菜单" }).click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  } else {
    await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile navigation resets cleanly across the desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuToggle = page.getByRole("button", { name: "打开导航菜单" });
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "移动导航" })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "移动导航" })).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menuToggle).toBeVisible();
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation", { name: "移动导航" })).toHaveCount(0);
});

test("homepage exposes the reference-style section order", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main > section")).toHaveCount(8);
  expect(await page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id))).toEqual([
    "profile", "info", "internships", "systems", "open-source", "honors", "writing", "contact",
  ]);
});