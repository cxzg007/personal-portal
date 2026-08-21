import { expect, test } from "@playwright/test";

const siteOrigin = "https://portfolio.example.test";
const articleSlug = "first-agent-system";
const articleTitle = "从 Semantica 开源贡献看 Agent 项目的工程协作";
const articleDescription = "江俊杰基于 Semantica 公开 PR 快照，对 Agent 项目中的数据契约、回归测试与开源协作进行工程复盘。";
const blogDescription = "关于 AI Agent、后端系统、知识图谱与工程协作的公开技术文章。";

test("homepage publishes canonical, share metadata, and validated ProfilePage JSON-LD", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", siteOrigin);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${siteOrigin}/social-card.svg`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const graph = await page.locator('script[type="application/ld+json"]').evaluate((script) =>
    JSON.parse(script.textContent ?? "{}"),
  );
  const person = graph["@graph"].find((entry: { "@type": string }) => entry["@type"] === "Person");
  const profile = graph["@graph"].find(
    (entry: { "@type": string }) => entry["@type"] === "ProfilePage",
  );

  expect(person).toMatchObject({
    name: "江俊杰",
    alternateName: "cxzg007",
    email: "mailto:jiangjunjie_tj@foxmail.com",
    sameAs: ["https://github.com/cxzg007"],
  });
  expect(profile).toMatchObject({ url: siteOrigin, name: "江俊杰｜AI Agent / 后端开发" });
  await expect(page.locator("#writing").getByRole("article")).toHaveCount(1);
});

test("public resume and share card are stable, sanitized assets", async ({ request }) => {
  const resume = await request.get("/resume.pdf");
  expect(resume.ok()).toBe(true);
  expect(resume.headers()["content-type"]).toContain("application/pdf");
  expect((await resume.body()).subarray(0, 5).toString()).toBe("%PDF-");

  const socialCard = await request.get("/social-card.svg");
  expect(socialCard.ok()).toBe(true);
  expect(await socialCard.text()).not.toContain("jiangjunjie_tj@foxmail.com");
});

test("blog index publishes independent canonical and social metadata", async ({ page }) => {
  await page.goto("/blog");

  await expect(page).toHaveTitle("技术博客｜江俊杰");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    blogDescription,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteOrigin}/blog`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${siteOrigin}/blog`,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "技术博客｜江俊杰",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    blogDescription,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${siteOrigin}/social-card.svg`,
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "技术博客｜江俊杰",
  );
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    "content",
    blogDescription,
  );
});

test("sitemap, robots, and RSS expose every public article with absolute URLs", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain(`<loc>${siteOrigin}</loc>`);
  expect(sitemapXml).toContain(`<loc>${siteOrigin}/blog</loc>`);
  expect(sitemapXml).toContain(`<loc>${siteOrigin}/blog/${articleSlug}</loc>`);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("User-Agent: *");
  expect(robotsText).toContain("Allow: /");
  expect(robotsText).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`);

  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBe(true);
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
  const rssXml = await rss.text();
  expect(rssXml).toContain(`<title>${articleTitle}</title>`);
  expect(rssXml).toContain(`<link>${siteOrigin}/blog/${articleSlug}</link>`);
  expect(rssXml).toContain("<pubDate>Fri, 21 Aug 2026 00:00:00 GMT</pubDate>");
  expect(rssXml).toContain("<category>Agent 工程</category>");
});

test("article publishes its own metadata and BlogPosting JSON-LD", async ({ page }) => {
  await page.goto(`/blog/${articleSlug}`);

  await expect(page).toHaveTitle(`${articleTitle}｜江俊杰`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    articleDescription,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${siteOrigin}/blog/${articleSlug}`,
  );

  const jsonLd = await page.locator('script[type="application/ld+json"]').evaluate((script) =>
    JSON.parse(script.textContent ?? "{}"),
  );
  expect(jsonLd).toMatchObject({
    "@type": "BlogPosting",
    headline: articleTitle,
    description: articleDescription,
    datePublished: "2026-08-21",
    dateModified: "2026-08-21",
    url: `${siteOrigin}/blog/${articleSlug}`,
    author: { "@type": "Person", name: "江俊杰" },
  });
});
