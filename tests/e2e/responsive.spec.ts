import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
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
    const allowedOverflow = ".hero-visual, .hero-visual *, .table-scroll, .table-scroll *";
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
        const overflowComesFromAllowedHeroDecoration = element.matches(".hero");
        if (!overflowComesFromAllowedHeroDecoration && element.scrollWidth > element.clientWidth + tolerance) {
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
    await expect(page.getByRole("heading", { level: 1, name: "江俊杰" })).toBeVisible();
    const hero = page.getByRole("region", { name: "江俊杰" });
    await expectHorizontallyContained(hero.locator(".hero-copy"));
    await expectHorizontallyContained(hero.locator(".hero-actions"));
    await expectHorizontallyContained(hero.getByRole("link", { name: "查看实习经历" }));
    await expectHorizontallyContained(hero.getByRole("link", { name: "下载简历" }));

    if (viewport.width <= 760) {
      await expect(page.getByRole("button", { name: "打开导航菜单" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
    }

    const firstInternship = page.locator("#internships").getByRole("article").first();
    await firstInternship.getByRole("button", { name: "查看技术细节" }).click();
    await expect(firstInternship.getByRole("heading", { name: "业务背景" })).toBeVisible();
    await expect(firstInternship.getByRole("heading", { name: "交付结果" })).toBeVisible();
    await expectHorizontallyContained(firstInternship);

    const internshipDetails = firstInternship.locator(".internship-details");
    await expectHorizontallyContained(internshipDetails);
    for (const detailSection of await internshipDetails.locator(":scope > section").all()) {
      await expectHorizontallyContained(detailSection);
    }

    const firstCaseStudy = page.locator("#case-studies").getByRole("article").first();
    await expectHorizontallyContained(firstCaseStudy);
    await expectHorizontallyContained(firstCaseStudy.locator(".architecture-flow"));

    const contactPanel = page.locator("#about .contact-panel");
    await expectHorizontallyContained(contactPanel);
    await expectHorizontallyContained(page.locator("#about").getByRole("link", { name: "发送邮件联系江俊杰" }));
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
