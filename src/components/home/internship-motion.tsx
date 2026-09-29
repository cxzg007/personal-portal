"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import styles from "./internship-diagram.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToEnvironment(notify: () => void) {
  const preference = window.matchMedia?.(motionQuery);
  preference?.addEventListener("change", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    preference?.removeEventListener("change", notify);
    document.removeEventListener("visibilitychange", notify);
  };
}

function getEnvironment() {
  if (typeof window.matchMedia !== "function" || typeof IntersectionObserver !== "function") {
    return "static";
  }
  if (window.matchMedia(motionQuery).matches) return "reduced";
  return document.hidden ? "hidden" : "ready";
}

function getServerEnvironment() { return "static"; }

export function InternshipMotion({
  id, title, children,
}: { id: string; title: string; children: ReactNode }) {
  const figure = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const environment = useSyncExternalStore(subscribeToEnvironment, getEnvironment, getServerEnvironment);
  const staticMode = environment === "static" || environment === "reduced";
  const running = environment === "ready" && visible && !paused;

  useEffect(() => {
    if (!figure.current || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2);
    }, { threshold: 0.2 });
    observer.observe(figure.current);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={figure}
      className={styles.figure}
      data-engineering-kind={id}
      data-motion={running ? "running" : "paused"}
      aria-labelledby={`${id}-caption`}
    >
      <figcaption className={styles.caption} id={`${id}-caption`}>
        <span className={styles.captionMarker} aria-hidden="true" />
        {title}
      </figcaption>
      {children}
      <div className={styles.footer}>
        <span>工程示意</span>
        <button
          type="button"
          className={styles.control}
          hidden={environment === "static"}
          disabled={staticMode}
          aria-label={`${title}：${staticMode ? "静态示意" : paused ? "播放动画" : "暂停动画"}`}
          onClick={() => setPaused((value) => !value)}
        >
          <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
            {staticMode ? <path d="M3 3h6v6H3z" /> : paused ? <path d="m3 2 7 4-7 4z" /> : <path d="M2 2h3v8H2zm5 0h3v8H7z" />}
          </svg>
          {staticMode ? "静态示意" : paused ? "播放" : "暂停"}
        </button>
      </div>
    </figure>
  );
}
