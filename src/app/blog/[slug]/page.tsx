import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { Header } from "@/components/shell/header";
import { getAllPosts, getPost } from "@/content/posts";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title}｜江俊杰`,
    description: post.seoDescription,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const posts = getAllPosts();
  const postIndex = posts.findIndex((candidate) => candidate.slug === post.slug);
  const previous = posts[postIndex + 1];
  const next = posts[postIndex - 1];
  const { Content } = post;

  return (
    <div className="page-shell article-page-shell">
      <ReadingProgress />
      <Header />
      <main id="main-content">
        <Link className="article-back-link" href="/blog">
          <span aria-hidden="true">←</span> 返回博客
        </Link>

        <article className="article-layout">
          <header className="article-header">
            <p className="eyebrow">TECHNICAL NOTE / {post.publishedAt}</p>
            <h1>{post.title}</h1>
            <p className="article-deck">{post.description}</p>
            <div className="article-meta">
              <time dateTime={post.publishedAt}>发布于 {post.publishedAt}</time>
              <span>更新于 {post.updatedAt}</span>
              <span>{post.readingMinutes} 分钟阅读</span>
            </div>
            <ul aria-label="文章标签" className="blog-tag-list">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </header>

          <aside className="article-toc">
            <nav aria-label="文章目录">
              <p>ON THIS PAGE</p>
              <ol>
                {post.headings.map((heading) => (
                  <li className={heading.level === 3 ? "article-toc-nested" : undefined} key={heading.id}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="article-prose">
            <Content />
          </div>
        </article>

        <nav aria-label="相邻文章" className="article-pagination">
          {previous ? (
            <Link href={`/blog/${previous.slug}`}>
              <span>上一篇</span>
              {previous.title}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {next ? (
            <Link href={`/blog/${next.slug}`}>
              <span>下一篇</span>
              {next.title}
            </Link>
          ) : null}
        </nav>
      </main>
    </div>
  );
}
