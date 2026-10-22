"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const key = "portal-blog-theme";
const eventName = "portal-blog-theme-change";
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(eventName, onChange);
  const syncStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    if (event.newValue === "light" || event.newValue === "dark") document.documentElement.dataset.blogPreference = event.newValue;
    else delete document.documentElement.dataset.blogPreference;
    onChange();
  };
  window.addEventListener("storage", syncStorage);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(eventName, onChange);
    window.removeEventListener("storage", syncStorage);
    media.removeEventListener("change", onChange);
  };
}
function getSnapshot() {
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* A blocked storage API still permits an in-memory theme. */ }
  const temporary = document.documentElement.dataset.blogPreference;
  if (temporary === "light" || temporary === "dark") return temporary;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function useBlogTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system");
  const toggle = () => {
    const next = getSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.blogPreference = next;
    try { localStorage.setItem(key, next); } catch { /* Use the current session preference. */ }
    window.dispatchEvent(new Event(eventName));
  };
  return { theme, toggle };
}
export function BlogTheme({ children }: { children: ReactNode }) {
  const { theme } = useBlogTheme();
  return <div className="blog-theme-shell" data-blog-theme={theme}>{children}</div>;
}
