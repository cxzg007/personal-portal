"use client";

import { useEffect, useRef, useState } from "react";
import type { PostMeta } from "@/content/posts";

export function ArticleToc({ headings }: Pick<PostMeta, "headings">) {
  const [activeId, setActiveId] = useState("");
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const elements = headings.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    const header = document.querySelector(".blog-header");
    const prose = document.querySelector(".article-prose");
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const rootSize = parseFloat(rootStyle.fontSize);
        const scrollPadding = parseFloat(rootStyle.scrollPaddingTop) || 0;
        const readingLine = (header?.getBoundingClientRect().bottom ?? 0) + rootSize * 2;
        let current = "";
        for (const element of elements) {
          // Native anchors apply both root scroll-padding and heading scroll-margin.
          const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
          const threshold = Math.max(readingLine, scrollPadding + margin + 2);
          if (element.getBoundingClientRect().top > threshold) break;
          current = element.id;
        }
        setActiveId(current);
      });
    };
    const observer = new ResizeObserver(update);
    if (prose) observer.observe(prose);
    if (header) observer.observe(header);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
  }, [headings]);

  useEffect(() => {
    const aside = asideRef.current;
    const active = aside?.querySelector<HTMLElement>('.article-toc-desktop a[aria-current="location"]');
    if (!aside || !active || active.getClientRects().length === 0) return;
    const bounds = aside.getBoundingClientRect();
    const link = active.getBoundingClientRect();
    // Scroll only the directory's own overflow, never the article or focused link.
    if (link.top < bounds.top) aside.scrollTop += link.top - bounds.top;
    else if (link.bottom > bounds.bottom) aside.scrollTop += link.bottom - bounds.bottom;
  }, [activeId]);

  if (headings.length === 0) return null;

  const items = headings.map((heading) => (
    <li className={heading.level === 3 ? "article-toc-nested" : undefined} key={heading.id}>
      <a aria-current={activeId === heading.id ? "location" : undefined} href={`#${heading.id}`}>
        {heading.text}
      </a>
    </li>
  ));

  return (
    <aside className="article-toc" ref={asideRef}>
      <nav aria-label="文章目录">
        <div className="article-toc-desktop">
          <p>文章目录 <span lang="en">ON THIS PAGE</span></p>
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
