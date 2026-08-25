import type { PostMeta } from "@/content/posts";

import { WritingCarousel } from "./writing-carousel";

export function WritingStage({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) {
    return null;
  }

  if (posts.length === 1) {
    const post = posts[0];

    return (
      <section aria-labelledby="writing-stage-title">
        <article>
          <h2 id="writing-stage-title">{post.title}</h2>
          <p>{post.description}</p>
          <ul>
            {post.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <p>{post.publishedAt}</p>
          <a href={`/blog/${post.slug}`}>阅读《{post.title}》全文</a>
        </article>
      </section>
    );
  }

  return <WritingCarousel posts={posts} />;
}