import { expect, test } from "@playwright/test";

const internships = [
  { company: "京东", id: "jd-ontology-platform" },
  { company: "智元机器人", id: "agibot-agent" },
  { company: "中国船舶集团 722 研究所", id: "cssc-722" },
];

test("experience index links to each actual internship without obscuring its heading", async ({ page }) => {
  await page.goto("/");
  const index = page.getByRole("navigation", { name: "经历索引" });
  await expect(index.getByRole("link")).toHaveCount(3);

  for (const { company, id } of internships) {
    await index.getByRole("link", { name: `查看${company}实习经历` }).click();
    await expect(page).toHaveURL(new RegExp(`#internship-${id}$`));
    const article = page.locator(`#internship-${id}`);
    await expect(article.getByRole("heading", { level: 3 })).toBeInViewport();
    await expect.poll(async () => {
      const header = await page.locator(".site-header").boundingBox();
      const title = await article.getByRole("heading", { level: 3 }).boundingBox();
      return title!.y - (header!.y + header!.height);
    }).toBeGreaterThanOrEqual(0);
  }
});

test("experience index stays usable across motion preference and route changes", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-hero-network]")).toHaveCount(0);
  const hero = page.locator(".profile-hero-copy");
  const before = await hero.boundingBox();
  await page.mouse.move(240, 250);
  await expect(hero).toHaveCSS("transform", "none");
  expect(await hero.boundingBox()).toEqual(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "static");
  await page.getByRole("navigation", { name: "经历索引" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/#internship-jd-ontology-platform$/);

  await page.locator("#writing").getByRole("link", { name: "全部文章", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-active-section");
  await expect(page.locator("html")).not.toHaveAttribute("data-profile-motion");
  await page.locator(".site-mark").click();
  await expect(page.getByRole("navigation", { name: "经历索引" }).getByRole("link")).toHaveCount(3);
  await expect(page.locator("[data-hero-network]")).toHaveCount(0);
});

test.describe("server-rendered homepage", () => {
  test.use({ javaScriptEnabled: false });

  test("experience index and expanded details work without JavaScript", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "查看京东实习经历", exact: true }).click();
    await expect(page).toHaveURL(/#internship-jd-ontology-platform$/);
    const article = page.locator("#internship-jd-ontology-platform");
    // Native anchor focus should continue directly to the disclosure, including
    // while the browser's smooth scroll is finishing.
    await page.keyboard.press("Tab");
    await expect(article.locator("summary")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(article.locator("details")).toHaveAttribute("open", "");
    await expect(article.getByRole("list", { name: "京东 能力建设记录" }).getByRole("listitem")).toHaveCount(7);
  });
});
