import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HERO_ENTRANCE_SCRIPT } from "./hero-entrance-script";

describe("hero entrance bootstrap", () => {
  let hero: HTMLElement;
  let media: EventTarget & { matches: boolean };

  function start() {
    const script = hero.querySelector("script")!;
    vi.spyOn(document, "currentScript", "get").mockReturnValue(script);
    // Run the exact static script emitted in the server HTML.
    new Function("window", "document", HERO_ENTRANCE_SCRIPT)(window, document);
  }

  function finishLastRow() {
    const event = new Event("animationend", { bubbles: true });
    Object.defineProperty(event, "animationName", { value: "hero-entrance-rise" });
    hero.querySelector("[data-hero-entrance-last]")!.dispatchEvent(event);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    document.body.innerHTML = '<section class="profile-hero"><script></script><h1>cxzg007</h1><li data-hero-entrance-last="true"></li></section>';
    hero = document.querySelector("section")!;
    media = Object.assign(new EventTarget(), { matches: true });
    vi.stubGlobal("matchMedia", () => media);
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    vi.spyOn(document, "referrer", "get").mockReturnValue("");
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([]);
  });

  afterEach(() => {
    window.dispatchEvent(new Event("pagehide"));
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("starts on the first eligible visit and ends after the last experience", () => {
    start();
    expect(hero.dataset.heroEntrance).toBe("running");
    hero.querySelector("h1")!.dispatchEvent(new Event("animationend", { bubbles: true }));
    expect(hero.dataset.heroEntrance).toBe("running");
    finishLastRow();
    expect(hero.dataset.heroEntrance).toBe("complete");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not replay within the same tab session", () => {
    start();
    finishLastRow();
    delete hero.dataset.heroEntrance;
    start();
    expect(hero).not.toHaveAttribute("data-hero-entrance");
  });

  it.each(["pointerdown", "keydown", "focusin", "wheel", "scroll", "hashchange", "pagehide"])("finishes immediately on %s and removes listeners", (eventName) => {
    const abort = vi.spyOn(window.AbortController.prototype, "abort");
    start();
    window.dispatchEvent(new Event(eventName));
    expect(hero.dataset.heroEntrance).toBe("complete");
    expect(abort).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    window.dispatchEvent(new Event(eventName));
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it("finishes if motion preference or viewport eligibility changes", () => {
    start();
    media.matches = false;
    media.dispatchEvent(new Event("change"));
    expect(hero.dataset.heroEntrance).toBe("complete");
    media.matches = true;
    media.dispatchEvent(new Event("change"));
    expect(hero.dataset.heroEntrance).toBe("complete");
  });

  it("finishes when the tab becomes hidden", () => {
    start();
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(hero.dataset.heroEntrance).toBe("complete");
  });

  it("bounds the lifetime even if CSS animation events never arrive", () => {
    start();
    vi.advanceTimersByTime(1600);
    expect(hero.dataset.heroEntrance).toBe("complete");
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["media", "hidden", "anchor", "scrolled", "history", "internal-referrer"])("starts static for %s", (reason) => {
    if (reason === "media") media.matches = false;
    if (reason === "hidden") vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    if (reason === "anchor") window.history.replaceState({}, "", "/#open-source");
    if (reason === "scrolled") vi.spyOn(window, "scrollY", "get").mockReturnValue(500);
    if (reason === "history") vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([{ type: "back_forward" } as PerformanceNavigationTiming]);
    if (reason === "internal-referrer") vi.spyOn(document, "referrer", "get").mockReturnValue(`${location.origin}/blog`);
    start();
    expect(hero).not.toHaveAttribute("data-hero-entrance");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("leaves the content visible when session storage is unavailable", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => { throw new Error("unavailable"); });
    expect(start).not.toThrow();
    expect(hero).not.toHaveAttribute("data-hero-entrance");
    expect(vi.getTimerCount()).toBe(0);
  });
});
