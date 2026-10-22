import type { ReactNode } from "react";
import { BlogTheme } from "@/components/blog/blog-theme";
import { BlogHeader } from "@/components/blog/blog-header";
import { BlogFooter } from "@/components/blog/blog-footer";
import { getAllPosts } from "@/content/posts";

export default function BlogLayout({ children }: { children: ReactNode }) {
  const posts = getAllPosts().map(({ slug, title, description }) => ({ slug, title, description }));
  return <BlogTheme><BlogHeader posts={posts} />{children}<BlogFooter /></BlogTheme>;
}
