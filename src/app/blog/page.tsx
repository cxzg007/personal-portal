import type { Metadata } from "next";
import { BlogFilter } from "@/components/blog/blog-filter";
import { BlogClouds } from "@/components/blog/blog-clouds";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts } from "@/content/posts";

const profile = loadSiteContent().profile;
const blogTitle = `技术博客｜${profile.name}`;
const blogDescription = "关于 AI Agent、后端系统、知识图谱与工程协作的公开技术文章。";

export const metadata: Metadata = {
  title: "技术博客",
  description: blogDescription,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/blog",
    title: blogTitle,
    description: blogDescription,
    images: [{ url: "/social-card.svg", width: 1200, height: 630, alt: blogTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: blogTitle,
    description: blogDescription,
    images: ["/social-card.svg"],
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="page-shell blog-page-shell">
      <main id="main-content" tabIndex={-1}>
        <header className="blog-hero">
          <h1 className="blog-visually-hidden">技术博客</h1>
          <BlogClouds variant="home" />
        </header>
        <BlogFilter posts={posts} />
      </main>
    </div>
  );
}
