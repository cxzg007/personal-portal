import type { MetadataRoute } from "next";
import { getAllPosts } from "@/content/posts";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const posts = getAllPosts().filter((post) => !post.draft);

  return [
    {
      url: siteUrl.origin,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: new URL("/blog", siteUrl).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      // 实验页放开了收录，站点地图里也要有，否则只有首页那条链接指过去。
      url: new URL("/lab/latent", siteUrl).toString(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: new URL("/playground", siteUrl).toString(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...posts.map((post) => ({
      url: new URL(`/blog/${post.slug}`, siteUrl).toString(),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
