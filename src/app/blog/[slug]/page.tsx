import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleToc } from "@/components/blog/article-toc";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { Header } from "@/components/shell/header";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts, getPost } from "@/content/posts";
import { serializeJsonLd } from "@/lib/discovery";
import { getSiteUrl } from "@/lib/site-url";

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
    title: post.title,
    description: post.seoDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.seoDescription,
      publishedTime: `${post.publishedAt}T00:00:00.000Z`,
      modifiedTime: `${post.updatedAt}T00:00:00.000Z`,
      tags: post.tags,
      images: ["/social-card.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.seoDescription,
      images: ["/social-card.svg"],
    },
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
  const titleBreak = post.title.indexOf("：");
  const siteContent = loadSiteContent();
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    keywords: post.tags,
    url: new URL(`/blog/${post.slug}`, siteUrl).toString(),
    mainEntityOfPage: new URL(`/blog/${post.slug}`, siteUrl).toString(),
    author: {
      "@type": "Person",
      "@id": new URL("/#person", siteUrl).toString(),
      name: siteContent.profile.name,
    },
  };

  return (
    <div className="page-shell article-page-shell">
      <ReadingProgress />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          type="application/ld+json"
        />
        <Link className="article-back-link" href="/blog">
          <span aria-hidden="true">←</span> 返回博客
        </Link>

        <article className="article-layout">
          <header className="article-header">
            <p className="eyebrow">工程笔记 / ENGINEERING NOTES</p>
            <h1 aria-label={post.title}>
              {titleBreak >= 0 ? (
                <>
                  <span className="article-title-prefix">{post.title.slice(0, titleBreak + 1)}</span>
                  {post.title.slice(titleBreak + 1)}
                </>
              ) : post.title}
            </h1>
            <p className="article-deck">{post.description}</p>
            <div className="article-meta">
              <time dateTime={post.publishedAt}>发布于 {post.publishedAt}</time>
              <time dateTime={post.updatedAt}>更新于 {post.updatedAt}</time>
              <span>{post.readingMinutes} 分钟阅读</span>
            </div>
            <ul aria-label="文章标签" className="blog-tag-list">
              {post.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </header>

          <ArticleToc headings={post.headings} />

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
