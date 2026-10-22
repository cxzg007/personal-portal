"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { PostMeta } from "@/content/posts";
import { BlogCard } from "./blog-card";

export function BlogFilter({ posts }: { posts: PostMeta[] }) {
  const results = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = useMemo(() => Array.from(new Set(posts.flatMap(post => post.tags))), [posts]);
  const primaryTags = ["Agent 工程", "系统架构", "知识图谱", "Semantica", "本体工程", "读书笔记", "开源实践"].filter(tag => tags.includes(tag));
  const otherTags = tags.filter(tag => !primaryTags.includes(tag));
  const selectTag = (tag: string | null) => {
    setActiveTag(tag);
    if (window.matchMedia("(max-width: 850px)").matches) requestAnimationFrame(() => results.current?.scrollIntoView({ behavior: "instant", block: "start" }));
  };
  const tagButton = (tag: string) => <button aria-pressed={activeTag === tag} key={tag} onClick={() => selectTag(tag)} type="button">{tag}</button>;
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    return posts.filter(post => (activeTag === null || post.tags.includes(activeTag)) &&
      `${post.title} ${post.description}`.toLocaleLowerCase("zh-CN").includes(normalizedQuery));
  }, [activeTag, posts, query]);
  const clearFilters = () => { setQuery(""); setActiveTag(null); };
  const featured = posts.filter(post => post.featured).slice(0, 3);

  return <div className="blog-browser">
    <section ref={results} id="articles" className="blog-articles" aria-labelledby="blog-articles-title">
      <h2 className="blog-section-label" id="blog-articles-title" lang="en">ARTICLES AND TUTORIALS</h2>
      <p aria-live="polite" className="blog-result-count">{filteredPosts.length.toString().padStart(2, "0")} 篇公开文章{activeTag ? ` · ${activeTag}` : ""}</p>
      {filteredPosts.length ? <div className="blog-card-grid">{filteredPosts.map(post => <BlogCard key={post.slug} post={post} />)}</div> :
        <div className="blog-empty-state"><h2>没有找到匹配的文章</h2><p>换一个关键词，或清除筛选后查看全部文章。</p><button onClick={clearFilters} type="button">清除筛选</button></div>}
    </section>
    <aside className="blog-sidebar">
      <section className="blog-filter-panel" id="categories" aria-labelledby="blog-categories-title">
        <h2 className="blog-section-label" id="blog-categories-title" lang="en">BROWSE BY CATEGORY</h2>
        <div aria-label="按标签筛选" className="blog-tag-filter" role="group">
          <button aria-pressed={activeTag === null} onClick={() => selectTag(null)} type="button">全部</button>
          {primaryTags.map(tagButton)}
        </div>
        <details className="blog-more-categories"><summary>更多分类</summary><div className="blog-tag-filter" aria-label="更多标签">{otherTags.map(tagButton)}</div></details>
      </section>
      <section className="blog-featured" aria-labelledby="blog-featured-title">
        <h2 className="blog-section-label" id="blog-featured-title">精选文章 <span lang="en">SELECTED</span></h2>
        <ul>{featured.map(post => <li key={post.slug}><Link href={`/blog/${post.slug}`} aria-label={`精选：${post.title}`}><span aria-hidden="true">→</span>{post.title}</Link></li>)}</ul>
      </section>
      <label className="blog-search-field"><span>搜索文章</span><input aria-label="搜索文章" onChange={event => setQuery(event.target.value)} placeholder="搜索标题或摘要" type="search" value={query} /></label>
      {(query || activeTag) && <a className="blog-filter-results-link" href="#articles">查看 {filteredPosts.length} 篇筛选结果 ↑</a>}
    </aside>
  </div>;
}
