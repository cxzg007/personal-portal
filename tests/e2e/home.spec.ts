import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const hero = page.locator("#profile");

  await expect(hero.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
  await expect(hero.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
  await expect(hero.getByText("2027 届校招 · AI Agent / 后端开发", { exact: true })).toBeVisible();
  await expect(hero.getByText("电子信息", { exact: true })).toBeVisible();
  await expect(hero.getByText("通信工程", { exact: true })).toBeVisible();
  await expect(hero.getByRole("link", { name: "jiangjunjie_tj@foxmail.com" })).toHaveAttribute(
    "href",
    "mailto:jiangjunjie_tj@foxmail.com",
  );
  await expect(hero.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute(
    "href",
    "https://github.com/cxzg007",
  );

  const viewInternships = hero.getByRole("link", { name: "查看实习" });
  const githubCta = hero.getByRole("link", { name: "GitHub ↗" });
  await expect(viewInternships).toHaveAttribute("href", "#internships");
  await expect(githubCta).toHaveAttribute("href", "https://github.com/cxzg007");
  await expect(githubCta).toHaveAttribute("target", "_blank");

  // 简历 PDF 下载能力已整体下线：页面不再提供入口，静态资源亦不再暴露。
  await expect(page.getByRole("link", { name: "下载简历 PDF" })).toHaveCount(0);
  const resume = await page.request.get("/resume.pdf");
  expect(resume.status()).toBe(404);

  for (const target of [
    hero.locator(".profile-dock-name"),
    hero.getByRole("list", { name: "教育经历" }),
    hero.getByRole("link", { name: "查看实习", exact: true }),
    hero.getByRole("link", { name: "GitHub ↗", exact: true }),
  ]) {
    await expect(target).toBeInViewport({ ratio: 1 });
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  }

  const headerBox = await page.locator("#top").boundingBox();
  expect(headerBox).not.toBeNull();
  const headerBottom = headerBox!.y + headerBox!.height;
  const educationEntries = hero.getByRole("list", { name: "教育经历" }).getByRole("listitem");
  await expect(educationEntries).toHaveCount(2);
  for (const entry of await educationEntries.all()) {
    const box = await entry.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(headerBottom);
    expect(box!.y + box!.height).toBeLessThanOrEqual(720);
  }
  const githubCtaBox = await githubCta.boundingBox();
  expect(githubCtaBox).not.toBeNull();
  expect(githubCtaBox!.y).toBeGreaterThanOrEqual(headerBottom);
  expect(githubCtaBox!.y + githubCtaBox!.height).toBeLessThanOrEqual(720);

  await expect(page.locator("section#info")).toHaveCount(0);
  await expect(page.locator('header a[href="#info"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "教育" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "信息" })).toHaveCount(0);

  const duplicateIds = await page.evaluate(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    document.querySelectorAll("[id]").forEach((element) => {
      if (seen.has(element.id)) duplicates.add(element.id);
      seen.add(element.id);
    });
    return [...duplicates];
  });
  expect(duplicateIds).toEqual([]);
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
  for (const outcome of [
    "支持 13 个比较算子、11 个聚合算子，批量写回具备事务与行数校验。",
    "50 并发下，已接纳请求 P99 时延由 810ms 降至 375ms。",
    "默认评测集上 Recall@5 达 91.67%。",
  ]) {
    await expect(internships.getByText(outcome, { exact: true })).toBeVisible();
  }

  // 未展开的 details 内记录不可见但存在，保持渐进披露语义。
  const jdDetails = internshipArticles.nth(0).locator("details.internship-details");
  await expect(jdDetails).not.toHaveAttribute("open");
  await expect(internshipArticles.nth(0).getByLabel("京东 能力建设记录")).toBeHidden();
  for (const index of [0, 1, 2]) {
    await expect(internshipArticles.nth(index).locator("ul.capability-records li")).toHaveCount(3);
  }

  for (let step = 0; step < 60; step += 1) {
    if (
      await jdDetails.locator("summary").evaluate((node) => document.activeElement === node)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(jdDetails.locator("summary")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(jdDetails).toHaveAttribute("open", "");
  await expect(internshipArticles.nth(0).getByLabel("京东 能力建设记录")).toBeVisible();
  await expect(
    internshipArticles.nth(0).getByLabel("京东 能力建设记录").getByRole("listitem"),
  ).toHaveCount(3);

  const systems = page.locator("main > section#systems");
  const tabs = systems.getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(systems.getByRole("tabpanel")).toContainText("本体驱动的数据资产治理与 Agent 动作平台");

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
  await expect(systems.getByRole("tabpanel")).toContainText("本体驱动的数据资产治理与 Agent 动作平台");

  const openSource = page.locator("main > section#open-source");
  await expect(openSource.getByRole("heading", { name: "Semantica", exact: true })).toBeVisible();
  await expect(openSource.getByText(/截至 2026-09-20：17 个贡献已合并/)).toBeVisible();
  await expect(openSource.getByRole("link", { name: "Semantica GitHub repository" })).toHaveAttribute(
    "href",
    "https://github.com/semantica-agi/semantica",
  );
  await expect(openSource.getByRole("link", { name: "阅读相关技术文章" })).toHaveAttribute(
    "href",
    "/blog/graph-engineering-ontology",
  );

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

  await expect(page.locator("main > section")).toHaveCount(6);
  expect(await page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id))).toEqual([
    "profile", "internships", "systems", "open-source", "writing", "contact",
  ]);
});

test("internship cards keep a static editorial layout without stacking or engineering figures", async ({
  page,
}) => {
  await page.goto("/");

  const internships = page.locator("main > section#internships");
  const logos = ["京东品牌标志", "智元机器人 AGIBOT 品牌标志", "中国船舶集团 CSSC 品牌标志"];

  const cards = internships.locator("article");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS("position", "static");
    await expect(card).not.toHaveAttribute("data-layout");
    await expect(card).not.toHaveAttribute("data-stack-progress");
  }
  await expect(page.locator("#internships figure[data-engineering-kind]")).toHaveCount(0);

  for (let index = 0; index < 3; index += 1) {
    const card = internships.locator(`article[data-card-index="${index}"]`);
    await expect(card.getByRole("img", { name: logos[index] })).toBeVisible();
  }

  await expect(internships.getByRole("button")).toHaveCount(0);
});

test("expanding any internship disclosure keeps detail items unobstructed and cards non-overlapping", async ({
  page,
}) => {
  await page.goto("/");

  const internships = page.locator("main > section#internships");
  const internshipCards = internships.getByRole("article");
  const disclosureLabels = [
    "查看京东工程细节",
    "查看智元机器人工程细节",
    "查看中国船舶集团 722 研究所工程细节",
  ];
  const recordLabels = ["京东 能力建设记录", "智元机器人 能力建设记录", "中国船舶集团 722 研究所 能力建设记录"];

  for (let index = 0; index < 3; index += 1) {
    const card = internshipCards.nth(index);
    const details = card.locator("details.internship-details");

    await card.getByText(disclosureLabels[index]).click();
    await expect(details).toHaveAttribute("open", "");
    for (let check = 0; check < 3; check += 1) {
      const position = await internshipCards
        .nth(check)
        .evaluate((element) => window.getComputedStyle(element).position);
      expect(position).toBe("static");
    }

    // 展开与关闭两种状态下相邻卡片都不允许垂直重叠。
    const openBoxes = [];
    for (let check = 0; check < 3; check += 1) {
      openBoxes.push(await internshipCards.nth(check).boundingBox());
    }
    for (let check = 0; check < openBoxes.length - 1; check += 1) {
      const current = openBoxes[check]!;
      const next = openBoxes[check + 1]!;
      expect(current.y + current.height).toBeLessThanOrEqual(next.y + 1);
    }

    // 滚动至该卡最后一条能力建设记录，几何级验证中心点不被页头/相邻卡遮挡。
    const recordItems = card.getByLabel(recordLabels[index]).getByRole("listitem");
    const lastItem = recordItems.last();
    await lastItem.scrollIntoViewIfNeeded();
    await expect(lastItem).toBeVisible();

    const hit = await lastItem.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const target = document.elementFromPoint(point.x, point.y);
      if (!target) return { point, inside: false };
      return { point, inside: node.contains(target) };
    });
    expect(hit.inside).toBe(true);
    expect(hit.point.y).toBeGreaterThan(0);
    expect(hit.point.y).toBeLessThan(page.viewportSize()!.height);

    // 关闭 details 后布局保持 static。
    await card.getByText(disclosureLabels[index]).click();
    await expect(details).not.toHaveAttribute("open");
    const restored = await internshipCards
      .nth(0)
      .evaluate((element) => window.getComputedStyle(element).position);
    expect(restored).toBe("static");
  }
});

test("open source showcase groups PRs by resume theme with a collapsed remainder", async ({ page }) => {
  await page.goto("/");

  const openSource = page.locator("main > section#open-source");
  const themeList = openSource.getByRole("list", { name: "Semantica 贡献主题" });
  await expect(themeList).toBeVisible();
  await expect(themeList.locator("> li.open-source-theme-item")).toHaveCount(4);
  const recognition = openSource.getByRole("region", { name: "项目影响力与荣誉" });
  await expect(recognition.getByRole("link", { name: "13,300 GitHub Stars" })).toHaveAttribute(
    "href", "https://github.com/semantica-agi/semantica",
  );
  await expect(recognition.getByRole("link", { name: /#1 GitHub Trending 日榜/ })).toBeVisible();
  await expect(recognition.getByRole("link", { name: /#3 Trendshift · Python 周榜/ })).toBeVisible();
  await expect(openSource.getByRole("link", { name: /^已合并 · PR #/ })).toHaveCount(6);
  await expect(openSource.getByText("MERGED", { exact: true })).toHaveCount(0);
  await expect(openSource.getByText("OPEN", { exact: true })).toHaveCount(0);
  await expect(openSource.locator("button")).toHaveCount(0);
  await expect(openSource.getByLabel("Semantica 公开资料")).toBeVisible();

  const details = openSource.locator("details.open-source-showcase-details");
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute("open");

  await details.locator("summary").click();
  await expect(openSource.getByRole("link", { name: /^已合并 · PR #/ })).toHaveCount(17);
  const otherLinks = details.getByRole("link", { name: /^已合并 · PR #/ });
  await expect(otherLinks).toHaveCount(11);
  for (const [index, number] of [
    1364, 1360, 1217, 1215, 1208, 1160, 1153, 1143, 1113, 1094, 1081,
  ].entries()) {
    await expect(otherLinks.nth(index)).toHaveAttribute(
      "href",
      `https://github.com/semantica-agi/semantica/pull/${number}`,
    );
  }
  await details.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(details).not.toHaveAttribute("open");
  await expect(openSource.getByRole("link", { name: /^已合并 · PR #/ })).toHaveCount(6);
});

test("honors section and its navigation entry are fully removed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section#honors")).toHaveCount(0);
  await expect(page.getByText("荣誉与长期积累")).toHaveCount(0);
  await expect(page.getByText("国家励志奖学金")).toHaveCount(0);
  await expect(page.getByText("大唐杯上海市二等奖")).toHaveCount(0);
  await expect(page.locator('header a[href="#honors"]')).toHaveCount(0);
});

test("writing stage renders the public articles with full-read destinations", async ({ page }) => {
  await page.goto("/");

  const writing = page.locator("main > section#writing");
  await expect(writing.getByRole("article")).toHaveCount(2);
  await expect(
    writing.getByRole("heading", { name: "图工程之后：多智能体系统缺的是一层语义" }),
  ).toBeVisible();
  await expect(
    writing.getByRole("link", { name: "阅读文章：图工程之后：多智能体系统缺的是一层语义" }),
  ).toHaveAttribute("href", "/blog/graph-engineering-ontology");
  await expect(
    writing.getByRole("heading", { name: "Palantir 本体论：把业务语义做成可执行的操作层" }),
  ).toBeVisible();
  await expect(
    writing.getByRole("link", { name: "阅读文章：Palantir 本体论：把业务语义做成可执行的操作层" }),
  ).toHaveAttribute("href", "/blog/palantir-ontology-notes");
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
