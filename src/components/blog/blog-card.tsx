import Link from "next/link";
import type { PostMeta } from "@/content/posts";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function BlogCard({ post }: { post: PostMeta }) {
  return (
    <article className="blog-card" data-post-slug={post.slug}>
      <div className="blog-card-meta">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <span>{post.readingMinutes} 分钟阅读</span>
      </div>
      <h2>
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p>{post.description}</p>
      <ul aria-label="文章标签" className="blog-tag-list">
        {post.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <Link aria-label={`阅读文章：${post.title}`} className="blog-card-action" href={`/blog/${post.slug}`}>
        阅读文章 <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
