"use client";

import { useEffect } from "react";

// 激活线取页头下方 240px：页面在窄视口（如 768×1024 tablet）缩短后，
// 靠底部的 writing 分区顶部最多只能进入页头下方约 216px 处（更小的窗口
// 会先触发页底兜底），160px 的旧阈值会使其永远无法被高亮。
const ACTIVE_SECTION_OFFSET = 240;

export function selectActiveSection(
  entries: Array<{ id: string; top: number }>,
  headerHeight: number,
): string {
  return (
    entries.filter(({ top }) => top <= headerHeight + ACTIVE_SECTION_OFFSET).at(-1)?.id ?? "profile"
  );
}

const DEFAULT_HEADER_HEIGHT = 72;

function getHeaderHeight(): number {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return DEFAULT_HEADER_HEIGHT;
  const height = header.getBoundingClientRect().height;
  return height > 0 ? height : DEFAULT_HEADER_HEIGHT;
}

function getSectionIds(): string[] {
  const ids = new Set<string>(["profile"]);
  document.querySelectorAll<HTMLElement>("[data-nav-section]").forEach((link) => {
    const id = link.getAttribute("data-nav-section");
    if (id) ids.add(id);
  });
  return [...ids];
}

function setNavigationState(activeId: string) {
  document.querySelectorAll<HTMLElement>("[data-nav-section]").forEach((link) => {
    if (link.getAttribute("data-nav-section") === activeId) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function clearMotionState() {
  document.querySelectorAll<HTMLElement>(".profile-reveal").forEach((element) => {
    element.removeAttribute("data-in-view");
  });
  document.querySelectorAll<HTMLElement>("[data-nav-section]").forEach((element) => {
    element.removeAttribute("aria-current");
  });
  document.documentElement.removeAttribute("data-active-section");
}

export function PageMotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewportPreference = window.matchMedia("(max-width: 760px)");
    let frameId: number | null = null;
    let observer: IntersectionObserver | null = null;
    let listening = false;
    const update = () => {
      frameId = null;
      const headerHeight = getHeaderHeight();
      const entries = getSectionIds()
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null)
        .map((element) => ({ id: element.id, top: element.getBoundingClientRect().top }));
      const activeSection =
        window.scrollY + window.innerHeight >= root.scrollHeight - 1
          ? entries.at(-1)?.id ?? "profile"
          : selectActiveSection(entries, headerHeight);
      root.dataset.activeSection = activeSection;
      setNavigationState(activeSection);
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = -1;
      const handle = window.requestAnimationFrame(update);
      if (frameId === -1) frameId = handle;
    };

    const stopEnhanced = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (listening) {
        window.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("resize", scheduleUpdate);
        listening = false;
      }
    };

    const applyPreference = () => {
      if (motionPreference.matches || viewportPreference.matches) {
        stopEnhanced();
        clearMotionState();
        root.dataset.profileMotion = "static";
        return;
      }

      root.dataset.profileMotion = "enhanced";
      if (!observer) {
        const revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;
            if (entry.isIntersecting) {
              target.dataset.inView = "true";
            } else {
              target.removeAttribute("data-in-view");
            }
          });
        });
        document.querySelectorAll<HTMLElement>(".profile-reveal").forEach((element) => {
          revealObserver.observe(element);
        });
        observer = revealObserver;
      }
      if (!listening) {
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        listening = true;
      }
      update();
    };

    applyPreference();
    motionPreference.addEventListener?.("change", applyPreference);
    viewportPreference.addEventListener?.("change", applyPreference);

    return () => {
      stopEnhanced();
      motionPreference.removeEventListener?.("change", applyPreference);
      viewportPreference.removeEventListener?.("change", applyPreference);
      clearMotionState();
      root.removeAttribute("data-profile-motion");
    };
  }, []);

  return null;
}