import Link from "next/link";

import type { PostMeta } from "@/content/posts";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

type WritingStageProps = {
  posts: PostMeta[];
};

export function WritingStage({ posts }: WritingStageProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section aria-label="工程复盘" className="writing-stage">
      <ul className="writing-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="writing-entry">
              <div className="writing-entry-meta">
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                <span className="writing-entry-minutes">{`${post.readingMinutes} 分钟阅读`}</span>
              </div>
              <div className="writing-entry-body">
                <h3>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p>{post.description}</p>
                <ul aria-label="文章标签" className="tag-list">
                  {post.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <Link
                  aria-label={`阅读文章：${post.title}`}
                  className="writing-entry-link"
                  href={`/blog/${post.slug}`}
                >
                  阅读全文
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <footer className="writing-stage-footer">
        <Link href="/blog">全部文章</Link>
      </footer>
    </section>
  );
}