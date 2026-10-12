"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { LabUnavailable } from "./lab-unavailable";

/**
 * 场景依赖 WebGL 和 DOM，只能在客户端跑，所以关掉预渲染。
 * 按 Next 文档的要求，ssr: false 必须写在客户端组件里。
 */
const LatentScene = dynamic(() => import("./latent-scene"), {
  ssr: false,
  loading: () => <div className="latent-scene-placeholder" />,
});

/** 终端那一程只有悬停能触发，低于这个尺寸也摆不下，所以这两条是硬门槛。 */
const MIN_WIDTH = 760;
const MIN_HEIGHT = 480;

type Support = "unknown" | "ok" | "pointer" | "webgl";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function detect(): Exclude<Support, "unknown"> {
  const coarse = window.matchMedia("(hover: none)").matches;
  const tooSmall = window.innerWidth < MIN_WIDTH || window.innerHeight < MIN_HEIGHT;
  if (coarse || tooSmall) return "pointer";
  if (!hasWebGL()) return "webgl";
  return "ok";
}

export function LatentSceneMount() {
  // 这个组件本身会被服务端渲染，探测只能放进 effect，不能写在 useState 初始化里。
  const [support, setSupport] = useState<Support>("unknown");

  useEffect(() => {
    const sync = () => setSupport(detect());
    sync();

    // 把桌面窗口拖窄也要能切过去，所以这两个信号都得一直听着。
    const hover = window.matchMedia("(hover: none)");
    hover.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      hover.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  // 判断出来之前先占住位置，免得静帧闪一下又被场景顶掉。
  if (support === "unknown") return <div className="latent-scene-placeholder" />;
  // 门槛不过就不去 import 场景，手机因此完全不会下载 three.js 那个分包。
  if (support !== "ok") return <LabUnavailable reason={support} />;
  return <LatentScene />;
}
