import type { PostMeta } from "@/content/posts";

export function ArticleToc({ headings }: Pick<PostMeta, "headings">) {
  if (headings.length === 0) return null;

  const items = headings.map((heading) => (
    <li className={heading.level === 3 ? "article-toc-nested" : undefined} key={heading.id}>
      <a href={`#${heading.id}`}>{heading.text}</a>
    </li>
  ));

  return (
    <aside className="article-toc">
      <nav aria-label="文章目录">
        <div className="article-toc-desktop">
          <p>文章目录</p>
          <ol>{items}</ol>
        </div>
        <details className="article-toc-mobile">
          <summary>文章目录 <span aria-hidden="true">⌄</span></summary>
          <ol>{items}</ol>
        </details>
      </nav>
    </aside>
  );
}
