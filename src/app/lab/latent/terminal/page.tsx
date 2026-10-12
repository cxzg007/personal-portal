import type { Metadata } from "next";

import TerminalUI from "@/components/lab/terminal-ui";
import { loadSiteContent } from "@/content/load-site-content";
import { getAllPosts } from "@/content/posts";
import { buildLatentIndex } from "@/lib/latent-index";

export const metadata: Metadata = {
  title: "Latent Terminal · 屏幕内容",
  description: "嵌在潜空间原型屏幕里的终端界面，可检索我的实习、系统、开源与博客。",
  // 这个页面是给 iframe 用的，单独被搜到没有意义；首页才是这些内容的正本。
  robots: { index: false, follow: false },
};

/**
 * 索引在服务端构建。
 *
 * 放在客户端也能跑，但那意味着把整份 site-content.json 和全部博客元数据
 * 打进这块屏幕的 JS 包里。索引只在构建期变，服务端算完当 props 传下去，
 * 客户端拿到的是已经拼好 haystack 的扁平数组，检索时不用再碰原始内容。
 */
export default function LatentTerminalPage() {
  const index = buildLatentIndex(loadSiteContent(), getAllPosts());
  return <TerminalUI index={index} />;
}
