import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCaseChainStage,
  getNarrativeStage,
  getSceneTransition,
  ScrollEnhancements,
} from "./scroll-enhancements";

type MediaKey = "reduced" | "narrow";

function stubMatchMedia(initial: { narrow?: boolean; reduced?: boolean }) {
  const state: Record<MediaKey, boolean> = {
    narrow: initial.narrow ?? false,
    reduced: initial.reduced ?? false,
  };
  const listeners: Record<MediaKey, Set<() => void>> = {
    narrow: new Set(),
    reduced: new Set(),
  };
  const queries: Record<string, MediaKey> = {
    "(max-width: 760px)": "narrow",
    "(prefers-reduced-motion: reduce)": "reduced",
  };
  const mediaLists = new Map<string, { matches: boolean }>();
  const createList = (key: MediaKey) => {
    const list = {
      get matches() {
        return state[key];
      },
      addEventListener: (_type: string, listener: () => void) => {
        listeners[key].add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        listeners[key].delete(listener);
      },
    };
    return list;
  };
  for (const [query, key] of Object.entries(queries)) {
    mediaLists.set(query, createList(key));
  }
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const list = mediaLists.get(query);
      if (list) return list;
      return { matches: false };
    }),
  );
  return {
    set(key: MediaKey, value: boolean) {
      state[key] = value;
      for (const listener of listeners[key]) listener();
    },
  };
}

function mockRect(element: Element, rect: { bottom: number; top: number }) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
}

const narrativeFixture = `
  <div class="agent-network"></div>
  <section id="internships"></section>
  <ol class="architecture-flow"></ol>
  <article class="metric-card"></article>
  <article class="internship-card"></article>
  <section class="open-source-spotlight"></section>
`;

function mockNarrativeGeometry() {
  mockRect(document.querySelector("#internships")!, { top: 700 } as { bottom: number; top: number });
  mockRect(document.querySelector(".architecture-flow")!, { bottom: 700, top: 300 });
  mockRect(document.querySelector(".metric-card")!, { bottom: 900, top: 620 });
  mockRect(document.querySelector(".internship-card")!, { bottom: 720, top: 380 });
  mockRect(document.querySelector(".open-source-spotlight")!, { bottom: 520, top: 120 });
}

function expectNoNarrativeAttributes() {
  expect(document.querySelector(".metric-card")).not.toHaveAttribute(
    "data-metric-visible",
  );
  expect(document.querySelector(".internship-card")).not.toHaveAttribute(
    "data-story-stage",
  );
  expect(document.querySelector(".open-source-spotlight")).not.toHaveAttribute(
    "data-open-source-stage",
  );
}

function expectAllEnhancementAttributesCleared() {
  expect(document.querySelector(".agent-network")).not.toHaveAttribute(
    "data-scene-transition",
  );
  expect(document.querySelector(".architecture-flow")).not.toHaveAttribute(
    "data-chain-stage",
  );
  expectNoNarrativeAttributes();
}

describe("scroll-linked progressive enhancement", () => {
  let rafCount: number;

  beforeEach(() => {
    rafCount = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCount += 1;
      callback(0);
      return rafCount;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-scroll-enhancement");
    document.documentElement.removeAttribute("data-brand-motion");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("maps geometry to deterministic scene, case-chain and narrative stages", () => {
    expect(getSceneTransition(0, 800, 1_600)).toBe("network");
    expect(getSceneTransition(900, 800, 1_600)).toBe("decomposing");
    expect(getSceneTransition(1_400, 800, 1_600)).toBe("timeline");
    expect(getCaseChainStage({ bottom: 1_300, top: 900 }, 800)).toBe(0);
    expect(getCaseChainStage({ bottom: 900, top: 500 }, 800)).toBe(1);
    expect(getCaseChainStage({ bottom: 700, top: 300 }, 800)).toBe(2);
    expect(getCaseChainStage({ bottom: 500, top: 100 }, 800)).toBe(3);
    expect(getNarrativeStage({ bottom: 1_400, top: 900 }, 800)).toBe(0);
    expect(getNarrativeStage({ bottom: 900, top: 620 }, 800)).toBe(1);
    expect(getNarrativeStage({ bottom: 720, top: 380 }, 800)).toBe(2);
    expect(getNarrativeStage({ bottom: 520, top: 120 }, 800)).toBe(3);
  });

  it("does not activate scroll effects when reduced motion is requested", () => {
    stubMatchMedia({ reduced: true });
    document.body.innerHTML = narrativeFixture;

    render(<ScrollEnhancements />);

    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "disabled",
    );
    expect(document.documentElement).toHaveAttribute(
      "data-brand-motion",
      "static",
    );
    expectAllEnhancementAttributesCleared();

    act(() => window.dispatchEvent(new Event("scroll")));
    expectAllEnhancementAttributesCleared();
  });

  it("keeps brand motion static on a narrow viewport without scroll listeners", () => {
    stubMatchMedia({ narrow: true });
    document.body.innerHTML = narrativeFixture;

    render(<ScrollEnhancements />);

    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "disabled",
    );
    expect(document.documentElement).toHaveAttribute(
      "data-brand-motion",
      "static",
    );
    expectAllEnhancementAttributesCleared();

    act(() => window.dispatchEvent(new Event("scroll")));
    expectAllEnhancementAttributesCleared();
  });

  it("exposes enhanced scene, case-chain and narrative states in normal mode", () => {
    stubMatchMedia({});
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = narrativeFixture;
    mockNarrativeGeometry();

    render(<ScrollEnhancements />);
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "enabled",
    );
    expect(document.documentElement).toHaveAttribute(
      "data-brand-motion",
      "enhanced",
    );
    expect(document.querySelector(".agent-network")).toHaveAttribute(
      "data-scene-transition",
      "decomposing",
    );
    expect(document.querySelector(".architecture-flow")).toHaveAttribute(
      "data-chain-stage",
      "2",
    );
    expect(document.querySelector(".metric-card")).toHaveAttribute(
      "data-metric-visible",
      "true",
    );
    expect(document.querySelector(".internship-card")).toHaveAttribute(
      "data-story-stage",
      "2",
    );
    expect(document.querySelector(".open-source-spotlight")).toHaveAttribute(
      "data-open-source-stage",
      "3",
    );
  });

  it("writes narrative stages once per animation frame", () => {
    stubMatchMedia({});
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = narrativeFixture;
    mockNarrativeGeometry();

    render(<ScrollEnhancements />);
    const framesAfterMount = rafCount;

    act(() => window.dispatchEvent(new Event("scroll")));
    expect(rafCount - framesAfterMount).toBe(1);
    expect(document.querySelector(".internship-card")).toHaveAttribute(
      "data-story-stage",
      "2",
    );

    act(() => window.dispatchEvent(new Event("scroll")));
    expect(rafCount - framesAfterMount).toBe(2);
  });

  it("does not mark metrics visible before the first narrative stage", () => {
    stubMatchMedia({});
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = narrativeFixture;
    mockNarrativeGeometry();
    mockRect(document.querySelector(".metric-card")!, { bottom: 1_400, top: 900 });

    render(<ScrollEnhancements />);
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(document.querySelector(".metric-card")).not.toHaveAttribute(
      "data-metric-visible",
    );
  });

  it("clears every enhancement attribute when preferences switch to static", () => {
    const media = stubMatchMedia({});
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = narrativeFixture;
    mockNarrativeGeometry();

    render(<ScrollEnhancements />);
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(document.querySelector(".internship-card")).toHaveAttribute(
      "data-story-stage",
      "2",
    );

    act(() => media.set("narrow", true));

    expect(document.documentElement).toHaveAttribute("data-brand-motion", "static");
    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "disabled",
    );
    expectAllEnhancementAttributesCleared();

    act(() => window.dispatchEvent(new Event("scroll")));
    expectAllEnhancementAttributesCleared();
  });

  it("clears every enhancement attribute on unmount", () => {
    stubMatchMedia({});
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = narrativeFixture;
    mockNarrativeGeometry();

    const { unmount } = render(<ScrollEnhancements />);
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(document.querySelector(".internship-card")).toHaveAttribute(
      "data-story-stage",
      "2",
    );

    unmount();

    expectAllEnhancementAttributesCleared();
    expect(document.documentElement).not.toHaveAttribute("data-scroll-enhancement");
    expect(document.documentElement).not.toHaveAttribute("data-brand-motion");
  });
});