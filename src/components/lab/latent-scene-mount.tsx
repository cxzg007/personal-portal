"use client";

import dynamic from "next/dynamic";

/**
 * 场景依赖 WebGL 和 DOM，只能在客户端跑，所以关掉预渲染。
 * 按 Next 文档的要求，ssr: false 必须写在客户端组件里。
 */
const LatentScene = dynamic(() => import("./latent-scene"), {
  ssr: false,
  loading: () => <div className="latent-scene-placeholder" />,
});

export function LatentSceneMount() {
  return <LatentScene />;
}
