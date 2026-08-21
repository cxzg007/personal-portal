import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { Section } from "@/components/shell/section";
import type { PostMeta } from "@/content/posts";

export function FeaturedWriting({ posts }: { posts: PostMeta[] }) {
  const featuredPosts = posts.filter((post) => post.featured && !post.draft).slice(0, 4);
  if (featuredPosts.length === 0) return null;

  return (
    <Section eyebrow="03 / WRITING" id="writing" title="精选文章">
      <div className="featured-writing-header">
        <p>记录 Agent 工程、后端架构与可靠系统实践。</p>
        <Link href="/blog">查看全部文章 <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="blog-card-grid featured-writing-grid">
        {featuredPosts.map((post) => <BlogCard key={post.slug} post={post} />)}
      </div>
    </Section>
  );
}
