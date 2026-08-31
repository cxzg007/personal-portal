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
  await expect(openSource.getByText(/截至 2026-08-31/)).toBeVisible();
  await expect(openSource.getByRole("link", { name: "Semantica GitHub 仓库" })).toHaveAttribute(
    "href",
    "https://github.com/semantica-agi/semantica",
  );
  await expect(openSource.getByRole("link", { name: "阅读 Semantica 贡献复盘" })).toHaveAttribute(
    "href",
    "/blog/first-agent-system",
  );
  await expect(
    openSource.getByRole("img", { name: "GitHub Trending #1 Repository of the Day" }),
  ).toBeVisible();
  await expect(
    openSource.getByRole("img", { name: "Trendshift · Python #3 Repository of the Week" }),
  ).toBeVisible();

  const contact = page.locator("main > section#contact");
  const email = contact.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" });
  const github = contact.getByRole("link", { name: "GitHub", exact: true });
  await expect(email).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(github).toHaveAttribute("href", "https://github.com/cxzg007");

  for (const link of [email, github]) {
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

  await expect(page.locator("main > section")).toHaveCount(7);
  expect(await page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id))).toEqual([
    "profile", "info", "internships", "systems", "open-source", "writing", "contact",
  ]);
});

test("internship cards ship brand logos, alternating layouts, and desktop sticky stacking", async (
  { page },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "chromium", "sticky stacking is a desktop-only layout");
  await page.goto("/");

  const internships = page.locator("main > section#internships");
  const logos = ["京东品牌标志", "智元机器人 AGIBOT 品牌标志", "中国船舶集团 CSSC 品牌标志"];
  const layouts = ["copy-visual", "visual-copy", "copy-visual"];

  for (let index = 0; index < 3; index += 1) {
    const card = internships.locator(`article[data-card-index="${index}"]`);
    await expect(card).toBeVisible();
    await expect(card.getByRole("img", { name: logos[index] })).toBeVisible();
    await expect(card).toHaveAttribute("data-layout", layouts[index]);
    const position = await card.evaluate((element) => window.getComputedStyle(element).position);
    expect(position).toBe("sticky");
  }

  await expect(internships.getByRole("button")).toHaveCount(0);
});

test("open source showcase exposes thirteen PR links and statuses", async ({ page }) => {
  await page.goto("/");

  const openSource = page.locator("main > section#open-source");
  await expect(openSource.getByRole("link", { name: /^PR #/ })).toHaveCount(13);
  await expect(openSource.getByText("MERGED", { exact: true })).toHaveCount(9);
  await expect(openSource.getByText("OPEN", { exact: true })).toHaveCount(4);
  await expect(openSource.getByLabel("Semantica 能力链路")).toBeVisible();
  await expect(openSource.getByLabel("Semantica 公开资料")).toBeVisible();
});

test("honors section and its navigation entry are fully removed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section#honors")).toHaveCount(0);
  await expect(page.getByText("荣誉与长期积累")).toHaveCount(0);
  await expect(page.getByText("国家励志奖学金")).toHaveCount(0);
  await expect(page.getByText("大唐杯上海市二等奖")).toHaveCount(0);
  await expect(page.locator('header a[href="#honors"]')).toHaveCount(0);
});

test("writing stage renders the single article with a full-read destination", async ({ page }) => {
  await page.goto("/");

  const writing = page.locator("main > section#writing");
  await expect(writing.getByRole("article")).toHaveCount(1);
  await expect(
    writing.getByRole("heading", { name: "从 Semantica 开源贡献看 Agent 项目的工程协作" }),
  ).toBeVisible();
  await expect(
    writing.getByRole("link", { name: "阅读《从 Semantica 开源贡献看 Agent 项目的工程协作》全文" }),
  ).toHaveAttribute("href", "/blog/first-agent-system");
});

test("brand marks load eagerly and never shift page height after load", async ({ page }) => {
  await page.goto("/");

  const marks = page.locator("main .brand-mark img");
  await expect(marks).toHaveCount(4);

  // `page.goto` waits for the load event, so every brand mark (including the
  // below-the-fold Semantica logo) must already be decoded at this point.
  const unloaded = await marks.evaluateAll((images) =>
    images
      .map((image, index) => ({
        index,
        alt: image.getAttribute("alt") ?? "",
        complete: (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
      }))
      .filter((entry) => !entry.complete),
  );
  expect(unloaded).toEqual([]);

  const heightAtLoad = await page.evaluate(() => document.documentElement.scrollHeight);

  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(heightAtLoad);

  // Scrolling must not trigger any late logo-driven reflow either.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(heightAtLoad);
});