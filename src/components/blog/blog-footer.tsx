import Link from "next/link";
import { BlogClouds } from "./blog-clouds";
import { BlogWordmark } from "./blog-header";

export function BlogFooter() {
  return <footer className="blog-footer">
    <BlogClouds variant="footer" />
    <div className="blog-footer-inner">
      <div className="blog-footer-intro">
        <Link href="/blog" aria-label="江俊杰的技术博客"><BlogWordmark /></Link>
        <p>写代码，也记录代码背后的思考。<br />关于 Agent、知识图谱与系统设计。</p>
        <a className="blog-subscribe" href="/rss.xml">通过 RSS 订阅 <span aria-hidden="true">↗</span></a>
        <span className="blog-footer-note">新文章直接送到你的阅读器。</span>
      </div>
      <nav aria-label="博客页脚导航">
        <div><h2>阅读 <span lang="en">READ</span></h2><Link href="/blog">全部文章</Link><Link href="/blog#categories">文章分类</Link><a href="/rss.xml">RSS 订阅</a></div>
        <div><h2>探索 <span lang="en">EXPLORE</span></h2><Link href="/playground">交互空间</Link><Link href="/#open-source">开源贡献</Link><a href="https://github.com/cxzg007" target="_blank" rel="noreferrer">GitHub ↗</a></div>
        <div><h2>关于 <span lang="en">ABOUT</span></h2><Link className="blog-back-link" href="/#top">返回个人首页</Link><Link href="/#internships">实习经历</Link><Link href="/#profile">关于我</Link></div>
      </nav>
      <p className="blog-colophon">© {new Date().getFullYear()} 江俊杰 <span>保持好奇，持续构建。</span></p>
    </div>
  </footer>;
}
