import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.goto("/");

  const hero = page.getByRole("region", { name: "江俊杰" });

  await expect(page.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "查看实习经历" })).toHaveAttribute("href", "#internships");
  await expect(hero.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
  await expect(page.getByRole("link", { name: "教育" })).toHaveCount(0);
});

test("internships, system cases, and contact form a keyboard-accessible recruiting narrative", async ({
  page,
}) => {
  await page.goto("/");

  const internships = page.locator("#internships");
  const internshipArticles = internships.getByRole("article");
  await expect(internshipArticles).toHaveCount(3);
  await expect(internships.getByText("京东", { exact: true })).toBeVisible();
  await expect(internships.getByText("智元机器人", { exact: true })).toBeVisible();
  await expect(internships.getByText("中国船舶集团 722 研究所", { exact: true })).toBeVisible();

  const internshipToggles = internships.getByRole("button", { name: "查看技术细节" });
  await expect(internshipToggles).toHaveCount(3);

  for (let index = 0; index < 3; index += 1) {
    const toggle = internshipToggles.nth(index);
    for (let step = 0; step < 20; step += 1) {
      if (await toggle.evaluate((button) => document.activeElement === button)) break;
      await page.keyboard.press("Tab");
    }
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    if (index === 0) {
      await expect(internshipArticles.first().getByRole("heading", { name: "业务背景" })).toBeVisible();
      await expect(internshipArticles.first().getByRole("heading", { name: "关键行动" })).toBeVisible();
      await expect(internshipArticles.first().getByRole("heading", { name: "个人贡献" })).toBeVisible();
      await expect(internshipArticles.first().getByRole("heading", { name: "交付结果" })).toBeVisible();
    }

    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }

  const cases = page.locator("#case-studies");
  await expect(cases.getByRole("article")).toHaveCount(2);

  const openSource = page.locator("#open-source");
  await expect(openSource.getByRole("heading", { name: "Semantica", exact: true })).toBeVisible();
  await expect(openSource.getByText(/截至 2026-08-21/)).toBeVisible();
  await expect(openSource.getByRole("link", { name: "查看 Semantica GitHub 项目" })).toHaveAttribute(
    "href",
    "https://github.com/semantica-agi/semantica",
  );
  await expect(openSource.getByRole("link", { name: "阅读 Semantica 贡献复盘" })).toHaveAttribute(
    "href",
    "/blog/first-agent-system",
  );

  const contact = page.locator("#about");
  const email = contact.getByRole("link", { name: "发送邮件联系江俊杰" });
  const github = contact.getByRole("link", { name: "查看 cxzg007 的 GitHub" });
  const resume = contact.getByRole("link", { name: "下载 PDF 简历" });
  await expect(email).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(github).toHaveAttribute("href", "https://github.com/cxzg007");
  await expect(resume).toHaveAttribute("href", "/resume.pdf");

  for (const link of [email, github, resume]) {
    for (let step = 0; step < 20; step += 1) {
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
