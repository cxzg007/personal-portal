"use client";

import { useState } from "react";

import type { PostMeta } from "@/content/posts";

export function WritingCarousel({ posts }: { posts: PostMeta[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const post = posts[activeIndex];

  const goToPrevious = () => {
    setActiveIndex((activeIndex - 1 + posts.length) % posts.length);
  };

  const goToNext = () => {
    setActiveIndex((activeIndex + 1 + posts.length) % posts.length);
  };

  return (
    <section aria-labelledby={`writing-carousel-title-${post.slug}`}>
      <article>
        <h2 id={`writing-carousel-title-${post.slug}`}>{post.title}</h2>
        <p>{post.description}</p>
        <ul>
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <p>{post.publishedAt}</p>
        <a href={`/blog/${post.slug}`}>阅读《{post.title}》全文</a>
      </article>
      <div>
        <button type="button" onClick={goToPrevious}>
          上一篇文章
        </button>
        <button type="button" onClick={goToNext}>
          下一篇文章
        </button>
      </div>
      <div aria-hidden="true">
        <pre>{`agent
  ├─ planner ──▶ tool registry
  ├─ memory   ──▶ vector store
  └─ executor ──▶ event bus
        ▼
  streaming response`}</pre>
      </div>
    </section>
  );
}