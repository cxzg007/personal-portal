"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./retro-experience.module.css";

type Mode = "room" | "desktop";
const simpleViewQuery = "(prefers-reduced-motion: reduce)";

const subscribeToHydration = () => () => {};

function ExperienceFrame({ mode, onDesktop }: { mode: Mode; onDesktop: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setStatus("error"), 45000);
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "henry:ready") {
        window.clearTimeout(timeout);
        setStatus("ready");
      } else if (event.data?.type === "henry:error") {
        window.clearTimeout(timeout);
        setStatus("error");
      }
    };
    window.addEventListener("message", receiveMessage);
    frame.current?.contentWindow?.postMessage({ type: "henry:ping" }, window.location.origin);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", receiveMessage);
    };
  }, [attempt]);

  return (
    <div className={styles.viewport}>
      <iframe
        allow="autoplay; fullscreen"
        className={styles.frame}
        key={attempt}
        onLoad={() => frame.current?.contentWindow?.postMessage({ type: "henry:ping" }, window.location.origin)}
        ref={frame}
        src={`/experiments/henry/${mode}/index.html`}
        title={mode === "room" ? "复古 3D 电脑房间" : "Jiang Junjie 复古桌面"}
      />
      {status === "loading" ? <p className={styles.loading} role="status">{mode === "room" ? "正在启动电脑、载入房间…" : "正在打开桌面…"}</p> : null}
      {status === "error" ? (
        <div className={styles.error} role="alert">
          <h2>暂时无法打开{mode === "room" ? "房间" : "桌面"}</h2>
          <p>{mode === "room" ? "可以重试，或直接进入不需要 3D 的桌面。" : "请检查网络后重试。"}</p>
          <div>
            <button onClick={() => { setStatus("loading"); setAttempt((value) => value + 1); }} type="button">重新加载</button>
            {mode === "room" ? <button onClick={onDesktop} type="button">进入 2D 桌面</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MountedExperience() {
  const [mode, setSelectedMode] = useState<Mode>(() => window.matchMedia(simpleViewQuery).matches ? "desktop" : "room");

  return (
    <main className={styles.experience} id="main-content" tabIndex={-1}>
      <header className={styles.toolbar}>
        <Link className={styles.back} href="/#playground"><span aria-hidden="true">←</span> 返回主页</Link>
        <h1>cxzg007<span> / PERSONAL SPACE</span></h1>
        <div aria-label="体验模式" className={styles.modes} role="group">
          <button aria-pressed={mode === "room"} onClick={() => setSelectedMode("room")} type="button">3D 房间</button>
          <button aria-pressed={mode === "desktop"} onClick={() => setSelectedMode("desktop")} type="button">2D 桌面</button>
        </div>
      </header>
      <ExperienceFrame key={mode} mode={mode} onDesktop={() => setSelectedMode("desktop")} />
      <footer className={styles.footer}>
        <span>{mode === "room" ? "点击 START 开始 · 点击电脑进入 · 左下角切换自由视角" : "双击图标打开应用 · 拖动标题栏移动窗口"}</span>
      </footer>
    </main>
  );
}

export function RetroExperience() {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  if (!hydrated) {
    return <main className={styles.experience} id="main-content"><p role="status">正在准备体验…</p></main>;
  }
  return <MountedExperience />;
}
