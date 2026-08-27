"use client";

import { useEffect } from "react";

export function getStackProgress(top: number, stickyTop: number): 0 | 1 | 2 {
  if (top > stickyTop + 120) return 0;
  if (top > stickyTop) return 1;
  return 2;
}

export function selectActiveSection(
  entries: Array<{ id: string; top: number }>,
  headerHeight: number,
): string {
  return entries.filter(({ top }) => top <= headerHeight + 160).at(-1)?.id ?? "profile";
}

const DEFAULT_HEADER_HEIGHT = 72;
const STICKY_TOP = 0;

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

function clampPointer(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function clearMotionState() {
  document.querySelectorAll<HTMLElement>(".profile-reveal").forEach((element) => {
    element.removeAttribute("data-in-view");
  });
  document.querySelectorAll<HTMLElement>(".sticky-internship-card").forEach((element) => {
    element.removeAttribute("data-stack-progress");
  });
  document.querySelectorAll<HTMLElement>("[data-nav-section]").forEach((element) => {
    element.removeAttribute("aria-current");
  });
  document.documentElement.style.removeProperty("--profile-pointer-x");
  document.documentElement.style.removeProperty("--profile-pointer-y");
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
    let hero: HTMLElement | null = null;
    let pointer: { x: number; y: number } | null = null;

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

      document.querySelectorAll<HTMLElement>(".sticky-internship-card").forEach((card) => {
        card.dataset.stackProgress = String(
          getStackProgress(card.getBoundingClientRect().top, STICKY_TOP),
        );
      });

      if (pointer && hero) {
        const bounds = hero.getBoundingClientRect();
        if (bounds.width > 0 && bounds.height > 0) {
          root.style.setProperty(
            "--profile-pointer-x",
            String(clampPointer((pointer.x / bounds.width) * 2 - 1)),
          );
          root.style.setProperty(
            "--profile-pointer-y",
            String(clampPointer((pointer.y / bounds.height) * 2 - 1)),
          );
        }
      }
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = -1;
      const handle = window.requestAnimationFrame(update);
      if (frameId === -1) frameId = handle;
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      scheduleUpdate();
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
      if (hero) {
        hero.removeEventListener("pointermove", handlePointerMove);
        hero = null;
      }
      pointer = null;
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
      hero = document.getElementById("profile");
      hero?.addEventListener("pointermove", handlePointerMove, { passive: true });
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