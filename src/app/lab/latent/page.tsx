import type { Metadata } from "next";

import { LatentSceneMount } from "@/components/lab/latent-scene-mount";

export const metadata: Metadata = {
  title: "潜空间原型 · Latent Terminal",
  description: "AI 主题交互原型：一叠按内容分域的结构，问一句话就能看见检索穿过哪几层。",
  // 首页「交互实验」一节已经指过来了，藏着反而奇怪，所以放开收录。
  // 屏幕里那张内页仍是 noindex：它是给 iframe 用的片段。
};

export default function LatentLabPage() {
  return <LatentSceneMount />;
}
