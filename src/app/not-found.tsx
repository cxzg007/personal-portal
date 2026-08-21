import Link from "next/link";
import { Header } from "@/components/shell/header";

export default function NotFound() {
  return (
    <div className="page-shell">
      <Header />
      <main id="main-content">
        <section className="not-found-panel">
          <p className="eyebrow">404 / ROUTE NOT FOUND</p>
          <h1>这里没有可公开展示的内容</h1>
          <p>链接可能已经变更，或这篇文章尚未公开。</p>
          <Link className="button button-primary" href="/">
            返回首页
          </Link>
        </section>
      </main>
    </div>
  );
}
