import type { Metadata } from "next";
import { BlogFilter } from "@/components/blog/blog-filter";
import { Header } from "@/components/shell/header";
import { getAllPosts } from "@/content/posts";

export const metadata: Metadata = {
  title: "技术博客｜江俊杰",
  description: "关于 AI Agent、后端系统、知识图谱与工程协作的公开技术文章。",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="page-shell blog-page-shell">
      <Header />
      <main id="main-content">
        <header className="blog-hero">
          <p className="eyebrow">ENGINEERING NOTES / {posts.length.toString().padStart(2, "0")}</p>
          <h1>技术博客</h1>
          <p>
            记录 Agent 工程、后端系统与开源协作中的问题边界、技术取舍和可验证结论。
          </p>
        </header>
        <BlogFilter posts={posts} />
      </main>
    </div>
  );
}
