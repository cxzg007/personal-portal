"use client";

import { useMemo, useState } from "react";
import type { PostMeta } from "@/content/posts";
import { BlogCard } from "./blog-card";

export function BlogFilter({ posts }: { posts: PostMeta[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = useMemo(() => Array.from(new Set(posts.flatMap((post) => post.tags))), [posts]);
  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");

    return posts.filter((post) => {
      const matchesTag = activeTag === null || post.tags.includes(activeTag);
      const matchesQuery =
        normalizedQuery === "" ||
        `${post.title} ${post.description}`.toLocaleLowerCase("zh-CN").includes(normalizedQuery);
      return matchesTag && matchesQuery;
    });
  }, [activeTag, posts, query]);

  const clearFilters = () => {
    setQuery("");
    setActiveTag(null);
  };

  return (
    <div className="blog-browser">
      <div className="blog-filter-panel">
        <label className="blog-search-field">
          <span>搜索文章</span>
          <input
            aria-label="搜索文章"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题或摘要"
            type="search"
            value={query}
          />
        </label>

        <div aria-label="按标签筛选" className="blog-tag-filter" role="group">
          <button
            aria-pressed={activeTag === null}
            onClick={() => setActiveTag(null)}
            type="button"
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              aria-pressed={activeTag === tag}
              key={tag}
              onClick={() => setActiveTag(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="blog-result-count">
        {filteredPosts.length.toString().padStart(2, "0")} 篇公开文章
      </p>

      {filteredPosts.length > 0 ? (
        <div className="blog-card-grid">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="blog-empty-state">
          <span aria-hidden="true">⌕</span>
          <h2>没有找到匹配的文章</h2>
          <p>换一个关键词或重置标签，继续浏览公开技术复盘。</p>
          <button onClick={clearFilters} type="button">
            清除筛选
          </button>
        </div>
      )}
    </div>
  );
}
