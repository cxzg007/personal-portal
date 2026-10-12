import type { Metadata } from "next";

import { LatentSceneMount } from "@/components/lab/latent-scene-mount";

export const metadata: Metadata = {
  title: "潜空间原型 · Latent Terminal",
  description: "AI 主题交互原型：可导航的模型内部结构与三段式镜头。",
  // 实验路由，不进搜索结果，也不进站点地图。
  robots: { index: false, follow: false },
};

export default function LatentLabPage() {
  return <LatentSceneMount />;
}
