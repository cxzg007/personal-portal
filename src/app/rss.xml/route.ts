import { getAllPosts } from "@/content/posts";
import { escapeXml } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export function GET() {
  const siteUrl = getSiteUrl();
  const posts = getAllPosts().filter((post) => !post.draft);
  const items = posts.map((post) => {
    const link = new URL(`/blog/${post.slug}`, siteUrl).toString();
    const tags = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");

    return `<item>
      <title>${escapeXml(post.title)}</title>
      <description>${escapeXml(post.description)}</description>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(`${post.publishedAt}T00:00:00.000Z`).toUTCString()}</pubDate>
      ${tags}
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml("江俊杰的技术博客")}</title>
    <description>${escapeXml("Agent 工程、后端架构与可靠系统实践。")}</description>
    <link>${escapeXml(new URL("/blog", siteUrl).toString())}</link>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
