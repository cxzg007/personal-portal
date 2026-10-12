import type { Metadata } from "next";

import TerminalUI from "@/components/lab/terminal-ui";

export const metadata: Metadata = {
  title: "Latent Terminal · 屏幕内容",
  description: "嵌在潜空间原型屏幕里的终端界面。",
  // 这个页面是给 iframe 用的，单独被搜到没有意义。
  robots: { index: false, follow: false },
};

export default function LatentTerminalPage() {
  return <TerminalUI />;
}
