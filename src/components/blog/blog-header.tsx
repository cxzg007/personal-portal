"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PostMeta } from "@/content/posts";
import { BlogIcon } from "./blog-icons";
import { useBlogTheme } from "./blog-theme";

type SearchPost = Pick<PostMeta, "slug" | "title" | "description">;
const navigation = [
  { href: "/blog#categories", label: "分类", english: "Categories" },
  { href: "/blog", label: "文章", english: "Articles" },
  { href: "/playground", label: "实验", english: "Playground" },
  { href: "/#profile", label: "关于", english: "About" },
];
export function BlogWordmark() {
  return <span className="blog-wordmark">Jiang<span className="blog-wordmark-j">J<span aria-hidden="true">⌃</span></span>Junjie</span>;
}
export function BlogHeader({ posts }: { posts: SearchPost[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const [sound, setSound] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle } = useBlogTheme();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    window.addEventListener("keydown", closeMenu);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("keydown", closeMenu);
      void audio.current?.close();
      audio.current = null;
    };
  }, []);
  const chime = () => {
    try {
      const context = audio.current ??= new AudioContext();
      void context.resume().then(() => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.frequency.setValueAtTime(660, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.07);
        gain.gain.setValueAtTime(0.025, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
        oscillator.start(); oscillator.stop(context.currentTime + 0.13);
      }).catch(() => {});
    } catch { /* Navigation remains usable without Web Audio. */ }
  };
  const closeSearch = () => { dialog.current?.close(); };
  const matches = posts.filter(p => `${p.title} ${p.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <header className="blog-header" data-scrolled={scrolled}>
    <div className="blog-header-inner">
      <Link className="blog-brand" href="/blog" aria-label="江俊杰的技术博客"><BlogWordmark /></Link>
      <nav className="blog-desktop-nav" aria-label="博客导航" onClick={() => { if (sound) chime(); }}>
        {navigation.map(item => <Link key={item.label} href={item.href} title={item.english}>{item.label}</Link>)}
      </nav>
      <div className="blog-header-tools">
        <button className="blog-icon-button" aria-label="搜索博客" title="搜索博客" ref={searchButton} onClick={() => { dialog.current?.showModal(); searchInput.current?.focus(); }}><BlogIcon name="search" /></button>
        <button className="blog-icon-button blog-sound-button" aria-label={sound ? "关闭交互音效" : "开启交互音效"} aria-pressed={sound} title="交互音效" onClick={() => { if (!sound) chime(); setSound(!sound); }}><BlogIcon name={sound ? "sound" : "mute"} /></button>
        <button className="blog-icon-button" aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"} title="切换主题" onClick={() => { toggle(); if (sound) chime(); }}><BlogIcon name={theme === "dark" ? "moon" : "sun"} /></button>
        <a className="blog-icon-button blog-rss-button" href="/rss.xml" aria-label="RSS 订阅" title="RSS 订阅"><BlogIcon name="rss" /></a>
      </div>
      <details className="blog-mobile-nav" ref={menu}>
        <summary aria-label="博客导航菜单"><span /><span /><span /></summary>
        <nav aria-label="博客移动导航">
          {navigation.map(item => <Link key={item.label} href={item.href} onClick={() => { if (menu.current) menu.current.open = false; }}>{item.label}<span lang="en">{item.english}</span></Link>)}
          <Link href="/#internships">实习经历</Link>
          <Link href="/#top">返回个人首页</Link>
        </nav>
      </details>
    </div>
    <dialog className="blog-search-dialog" ref={dialog} aria-labelledby="blog-search-title" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSearch(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')].filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }} onClose={() => searchButton.current?.focus()} onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSearch(); } }}>
      <div className="blog-search-dialog-top"><h2 id="blog-search-title">搜索文章</h2><button className="blog-icon-button" aria-label="关闭搜索" onClick={closeSearch}><BlogIcon name="close" /></button></div>
      <label className="blog-search-field"><span>标题或关键词</span><input ref={searchInput} type="search" aria-label="搜索博客文章" value={query} onChange={e => setQuery(e.target.value)} placeholder="Agent、知识图谱、系统设计…" /></label>
      <p className="blog-search-count" aria-live="polite">找到 {matches.length} 篇文章</p>
      <ul className="blog-search-results">{matches.map(post => <li key={post.slug}><Link href={`/blog/${post.slug}`} onClick={closeSearch}>{post.title}<span>{post.description}</span></Link></li>)}</ul>
      {!matches.length && <p className="blog-search-empty">没有找到匹配的文章，试试其他关键词。</p>}
    </dialog>
  </header>;
}
