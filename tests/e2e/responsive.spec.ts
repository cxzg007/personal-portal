import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "laptop", width: 1280, height: 800 },
  { label: "desktop", width: 1440, height: 900 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.scrollWidth).toBe(dimensions.viewportWidth);
}

async function expectHorizontallyContained(
  locator: Locator,
  { allowSelfScroll = false }: { allowSelfScroll?: boolean } = {},
) {
  await expect(locator).toBeVisible();

  const result = await locator.evaluate((element, options) => {
    const tolerance = 1;
    const viewportWidth = window.innerWidth;
    const rect = element.getBoundingClientRect();
    const issues: string[] = [];

    if (rect.left < -tolerance || rect.right > viewportWidth + tolerance) {
      issues.push(`element bounds ${rect.left.toFixed(2)}..${rect.right.toFixed(2)} exceed viewport 0..${viewportWidth}`);
    }

    if (!options.allowSelfScroll && element.scrollWidth > element.clientWidth + tolerance) {
      issues.push(`element hides or scrolls ${element.scrollWidth - element.clientWidth}px of horizontal content`);
    }

    let ancestor = element.parentElement;
    while (ancestor) {
      const style = getComputedStyle(ancestor);
      const overflowClips = ["auto", "clip", "hidden", "scroll"].includes(style.overflowX);

      if (overflowClips) {
        const ancestorRect = ancestor.getBoundingClientRect();
        if (rect.left < ancestorRect.left - tolerance || rect.right > ancestorRect.right + tolerance) {
          issues.push(
            `${ancestor.tagName.toLowerCase()}.${ancestor.className} clips element at ${ancestorRect.left.toFixed(2)}..${ancestorRect.right.toFixed(2)}`,
          );
        }
      }

      ancestor = ancestor.parentElement;
    }

    return issues;
  }, { allowSelfScroll });

  expect(result).toEqual([]);
}

async function expectNoHiddenOffscreenContent(page: Page) {
  const offenders = await page.evaluate(() => {
    const tolerance = 1;
    const allowedOverflow = ".table-scroll, .table-scroll *";
    const labels = (element: Element) => {
      const className = typeof element.className === "string" ? `.${element.className.trim().replaceAll(" ", ".")}` : "";
      return `${element.tagName.toLowerCase()}${className}`;
    };

    return Array.from(document.body.querySelectorAll("*"))
      .filter((element) => !element.matches(allowedOverflow))
      .flatMap((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) {
          return [];
        }

        const issues: string[] = [];
        if (rect.left < -tolerance || rect.right > window.innerWidth + tolerance) {
          issues.push(`${labels(element)} is offscreen at ${rect.left.toFixed(2)}..${rect.right.toFixed(2)}`);
        }
        if (element.scrollWidth > element.clientWidth + tolerance) {
          issues.push(`${labels(element)} has hidden/scrolling width ${element.clientWidth}..${element.scrollWidth}`);
        }
        return issues;
      });
  });

  expect(offenders).toEqual([]);
}

for (const viewport of viewports) {
  test(`homepage remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expectNoHorizontalOverflow(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ }),
    ).toBeVisible();

    const hero = page.getByRole("region", { name: /cxzg007 Profile/ });
    await expectHorizontallyContained(hero.locator(".profile-hero-copy"));
    await expectHorizontallyContained(hero.getByRole("link", { name: "查看实习", exact: true }));
    await expectHorizontallyContained(hero.getByLabel("联系方式"));
    await expectHorizontallyContained(hero.getByLabel("教育经历"));

    if (viewport.width <= 760) {
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
    }

    const internships = page.locator("main > section#internships");
    const firstInternship = internships.locator('article[data-card-index="0"]');
    await expectHorizontallyContained(firstInternship);
    await expectHorizontallyContained(firstInternship.getByRole("img", { name: "京东品牌标志" }));
    await expectHorizontallyContained(firstInternship.getByLabel("京东 能力建设记录"));
    await expectHorizontallyContained(internships.getByLabel("中国船舶集团 722 研究所 能力建设记录"));

    const systems = page.locator("main > section#systems");
    await expectHorizontallyContained(systems.getByRole("tablist"));
    await expectHorizontallyContained(systems.locator("#system-panel-ontology-agent-platform"));

    const openSource = page.locator("main > section#open-source");
    await expectHorizontallyContained(openSource.locator(".open-source-showcase"));
    await expectHorizontallyContained(openSource.getByLabel("Semantica 能力链路"));
    await expectHorizontallyContained(openSource.getByLabel("Semantica 公开资料"));

    await expectHorizontallyContained(page.locator("main > section#writing").getByRole("article"));

    const contact = page.locator("main > section#contact");
    await expectHorizontallyContained(contact);
    await expectHorizontallyContained(contact.getByRole("link", { name: /jiangjunjie_tj@foxmail\.com/ }));

    await expectNoHiddenOffscreenContent(page);
    await expectNoHorizontalOverflow(page);
  });

  test(`blog index remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog");

    await expectNoHorizontalOverflow(page);
    await expectHorizontallyContained(page.locator(".blog-hero"));
    await expectHorizontallyContained(page.locator(".blog-filter-panel"));
    await expectHorizontallyContained(page.getByRole("searchbox", { name: "搜索文章" }));
    await expectHorizontallyContained(page.getByRole("group", { name: "按标签筛选" }));
    await expectHorizontallyContained(page.locator(".blog-card").first());
    await expectHorizontallyContained(page.getByRole("link", { name: "阅读文章：从 Semantica 开源贡献看 Agent 项目的工程协作" }));

    if (viewport.width <= 760) {
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
    }

    await expectNoHiddenOffscreenContent(page);
  });

  test(`article remains complete at ${viewport.label} ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/blog/first-agent-system");

    await expectNoHorizontalOverflow(page);
    const articleHeading = page.getByRole("heading", {
      level: 1,
      name: "从 Semantica 开源贡献看 Agent 项目的工程协作",
    });
    await expectHorizontallyContained(articleHeading);
    await expectHorizontallyContained(page.locator(".article-header"));
    await expectHorizontallyContained(page.getByRole("navigation", { name: "文章目录" }));
    await expectHorizontallyContained(page.locator(".article-prose"));
    await expectHorizontallyContained(page.locator(".code-frame"));
    await expectHorizontallyContained(page.getByRole("link", { name: "返回博客" }));
    await expectHorizontallyContained(page.locator(".table-scroll"), { allowSelfScroll: true });
    await expectNoHiddenOffscreenContent(page);
  });
}

test("homepage reference profile keeps visible geometry at 1920x1080", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "chromium-only 1920x1080 desktop acceptance");

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expectNoHorizontalOverflow(page);

  const heroHeading = page.getByRole("heading", { level: 1, name: /cxzg007 Profile/ });
  const brandCards = page.locator("main > section#internships").getByRole("article");
  const openSourceCard = page.locator("main > section#open-source .open-source-showcase");
  await expect(brandCards).toHaveCount(3);

  const geometryTargets = [heroHeading, ...(await brandCards.all()), openSourceCard];
  for (const target of geometryTargets) {
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `expected visible geometry for ${await target.evaluate((element) => element.className)}`)
      .not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  }

  await expectNoHiddenOffscreenContent(page);
  await expectNoHorizontalOverflow(page);
});