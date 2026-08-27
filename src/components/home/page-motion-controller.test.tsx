import { act, cleanup, render } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "../shell/header";
import {
  getStackProgress,
  PageMotionController,
  selectActiveSection,
} from "./page-motion-controller";

vi.mock("next/link", () => ({
  default: (props: { href: string; children?: React.ReactNode } & Record<string, unknown>) => {
    const { href, children, ...rest } = props;
    return (
      <a href={href} {...(rest as React.ComponentProps<"a">)}>
        {children}
      </a>
    );
  },
}));

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
      return {
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      };
    }),
  );
  return {
    set(key: MediaKey, value: boolean) {
      state[key] = value;
      for (const listener of listeners[key]) listener();
    },
  };
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;
  callback: (entries: IntersectionObserverEntry[]) => void;

  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.add(target);
  }

  unobserve(target: Element) {
    this.observed.delete(target);
  }

  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  trigger(target: Element, isIntersecting: boolean) {
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry]);
  }
}

function mockRect(element: Element, rect: Partial<DOMRect>) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
}

const pageFixture = `
  <div class="profile-reveal"></div>
  <section id="profile"></section>
  <section id="info"></section>
  <section id="internships"></section>
  <article class="sticky-internship-card"></article>
`;

function mountEnhancedPage() {
  document.body.innerHTML = pageFixture;
  render(<Header />);
  const header = document.querySelector<HTMLElement>(".site-header")!;
  mockRect(header, { top: 0, bottom: 72, height: 72, width: 1_200 });
  mockRect(document.querySelector("#profile")!, {
    top: 0,
    bottom: 800,
    height: 800,
    width: 1_000,
  });
  mockRect(document.querySelector("#info")!, { top: 100, bottom: 300, height: 200, width: 1_000 });
  mockRect(document.querySelector("#internships")!, {
    top: 400,
    bottom: 900,
    height: 500,
    width: 1_000,
  });
  mockRect(document.querySelector(".sticky-internship-card")!, {
    top: 200,
    bottom: 600,
    height: 400,
    width: 1_000,
  });
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(5_000);
  render(<PageMotionController />);
}

function dispatchScroll() {
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function dispatchPointer(clientX: number, clientY: number) {
  act(() => {
    document
      .getElementById("profile")!
      .dispatchEvent(new MouseEvent("pointermove", { clientX, clientY }));
  });
}

function expectMotionStateCleared() {
  expect(document.querySelector(".profile-reveal")).not.toHaveAttribute("data-in-view");
  expect(document.querySelector(".sticky-internship-card")).not.toHaveAttribute(
    "data-stack-progress",
  );
  document.querySelectorAll("a[data-nav-section]").forEach((link) => {
    expect(link).not.toHaveAttribute("aria-current");
  });
  expect(document.documentElement.style.getPropertyValue("--profile-pointer-x")).toBe("");
  expect(document.documentElement.style.getPropertyValue("--profile-pointer-y")).toBe("");
  expect(document.documentElement).not.toHaveAttribute("data-active-section");
}

describe("page motion controller pure helpers", () => {
  it("maps sticky geometry to the three stack progress stages", () => {
    expect(getStackProgress(250, 100)).toBe(0);
    expect(getStackProgress(221, 100)).toBe(0);
    expect(getStackProgress(220, 100)).toBe(1);
    expect(getStackProgress(150, 100)).toBe(1);
    expect(getStackProgress(100, 100)).toBe(2);
    expect(getStackProgress(90, 100)).toBe(2);
    expect(getStackProgress(120, 0)).toBe(1);
    expect(getStackProgress(121, 0)).toBe(0);
    expect(getStackProgress(0, 0)).toBe(2);
    expect(getStackProgress(-10, 0)).toBe(2);
  });

  it("selects the last section within the header offset window", () => {
    const entries = [
      { id: "profile", top: 0 },
      { id: "info", top: 100 },
      { id: "internships", top: 400 },
    ];
    expect(selectActiveSection(entries, 72)).toBe("info");
    expect(selectActiveSection(entries, 240)).toBe("internships");
    expect(selectActiveSection(entries, 0)).toBe("info");
    expect(
      selectActiveSection(
        [
          { id: "a", top: 160 },
          { id: "b", top: 161 },
        ],
        0,
      ),
    ).toBe("a");
    expect(selectActiveSection([{ id: "far", top: 500 }], 0)).toBe("profile");
    expect(selectActiveSection([], 72)).toBe("profile");
  });
});

describe("page motion controller", () => {
  let rafCount: number;

  beforeEach(() => {
    rafCount = 0;
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCount += 1;
      callback(0);
      return rafCount;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-profile-motion");
    document.documentElement.removeAttribute("data-active-section");
    document.documentElement.style.removeProperty("--profile-pointer-x");
    document.documentElement.style.removeProperty("--profile-pointer-y");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("marks the reveal element in view through one intersection observer", () => {
    stubMatchMedia({});
    mountEnhancedPage();

    expect(document.documentElement).toHaveAttribute("data-profile-motion", "enhanced");
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    const observer = FakeIntersectionObserver.instances[0]!;
    expect(observer.observed.has(document.querySelector(".profile-reveal")!)).toBe(true);

    act(() => observer.trigger(document.querySelector(".profile-reveal")!, true));
    expect(document.querySelector(".profile-reveal")).toHaveAttribute("data-in-view", "true");

    act(() => observer.trigger(document.querySelector(".profile-reveal")!, false));
    expect(document.querySelector(".profile-reveal")).not.toHaveAttribute("data-in-view");
  });

  it("tracks the active section, stack progress and aria-current in enhanced mode", () => {
    stubMatchMedia({});
    mountEnhancedPage();

    expect(document.documentElement).toHaveAttribute("data-active-section", "info");
    expect(document.querySelector('a[data-nav-section="info"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(document.querySelector('a[data-nav-section="internships"]')).not.toHaveAttribute(
      "aria-current",
    );
    expect(document.querySelector(".sticky-internship-card")).toHaveAttribute(
      "data-stack-progress",
      "0",
    );

    mockRect(document.querySelector(".sticky-internship-card")!, { top: 50, bottom: 450 });
    dispatchScroll();
    expect(document.querySelector(".sticky-internship-card")).toHaveAttribute(
      "data-stack-progress",
      "1",
    );

    mockRect(document.querySelector(".sticky-internship-card")!, { top: -10, bottom: 390 });
    dispatchScroll();
    expect(document.querySelector(".sticky-internship-card")).toHaveAttribute(
      "data-stack-progress",
      "2",
    );

    mockRect(document.querySelector("#info")!, { top: 400, bottom: 600 });
    mockRect(document.querySelector("#internships")!, { top: 100, bottom: 300 });
    dispatchScroll();
    expect(document.documentElement).toHaveAttribute("data-active-section", "internships");
    expect(document.querySelector('a[data-nav-section="internships"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(document.querySelector('a[data-nav-section="info"]')).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("activates the last navigation section when the page is scrolled to the bottom", () => {
    stubMatchMedia({});
    mountEnhancedPage();

    vi.spyOn(window, "scrollY", "get").mockReturnValue(5_000);
    dispatchScroll();

    const lastSectionId = [
      ...document.querySelectorAll<HTMLAnchorElement>("a[data-nav-section]"),
    ]
      .map((link) => link.getAttribute("data-nav-section"))
      .filter((id): id is string => id !== null && document.getElementById(id) !== null)
      .at(-1)!;
    expect(document.documentElement).toHaveAttribute("data-active-section", lastSectionId);
    expect(
      document.querySelector(`a[data-nav-section="${lastSectionId}"]`),
    ).toHaveAttribute("aria-current", "location");
  });

  it("schedules at most one requestAnimationFrame per scroll or pointer event", () => {
    stubMatchMedia({});
    mountEnhancedPage();
    const framesAfterMount = rafCount;
    expect(framesAfterMount).toBe(0);

    dispatchScroll();
    expect(rafCount).toBe(1);
    dispatchScroll();
    expect(rafCount).toBe(2);

    dispatchPointer(750, 200);
    expect(rafCount).toBe(3);
    dispatchPointer(100, 300);
    expect(rafCount).toBe(4);
  });

  it("writes normalized pointer coordinates as paint-only css variables", () => {
    stubMatchMedia({});
    mountEnhancedPage();

    dispatchPointer(750, 200);
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-x")).toBe("0.5");
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-y")).toBe("-0.5");

    dispatchPointer(2_000, -400);
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-x")).toBe("1");
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-y")).toBe("-1");

    dispatchPointer(0, 800);
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-x")).toBe("-1");
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-y")).toBe("1");
  });

  it("stays static without listeners when reduced motion is requested", () => {
    stubMatchMedia({ reduced: true });
    mountEnhancedPage();

    expect(document.documentElement).toHaveAttribute("data-profile-motion", "static");
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expectMotionStateCleared();

    const framesBefore = rafCount;
    dispatchScroll();
    dispatchPointer(500, 400);
    expect(rafCount).toBe(framesBefore);
    expectMotionStateCleared();
  });

  it("stays static without listeners on a narrow viewport", () => {
    stubMatchMedia({ narrow: true });
    mountEnhancedPage();

    expect(document.documentElement).toHaveAttribute("data-profile-motion", "static");
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expectMotionStateCleared();

    const framesBefore = rafCount;
    dispatchScroll();
    dispatchPointer(500, 400);
    expect(rafCount).toBe(framesBefore);
    expectMotionStateCleared();
  });

  it("clears every attribute and css variable when preferences switch to static", () => {
    const media = stubMatchMedia({});
    mountEnhancedPage();

    const observer = FakeIntersectionObserver.instances[0]!;
    act(() => observer.trigger(document.querySelector(".profile-reveal")!, true));
    dispatchPointer(750, 200);
    expect(document.querySelector(".profile-reveal")).toHaveAttribute("data-in-view", "true");
    expect(document.documentElement.style.getPropertyValue("--profile-pointer-x")).toBe("0.5");

    act(() => media.set("reduced", true));
    expect(document.documentElement).toHaveAttribute("data-profile-motion", "static");
    expectMotionStateCleared();
    expect(observer.disconnected).toBe(true);

    act(() => media.set("reduced", false));
    expect(document.documentElement).toHaveAttribute("data-profile-motion", "enhanced");
    dispatchScroll();
    expect(document.documentElement).toHaveAttribute("data-active-section", "info");
    expect(document.querySelector('a[data-nav-section="info"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("clears every attribute and css variable on unmount", () => {
    stubMatchMedia({});
    mountEnhancedPage();

    const observer = FakeIntersectionObserver.instances[0]!;
    act(() => observer.trigger(document.querySelector(".profile-reveal")!, true));
    dispatchPointer(750, 200);

    cleanup();

    expect(document.documentElement).not.toHaveAttribute("data-profile-motion");
    expect(observer.disconnected).toBe(true);
    expectMotionStateCleared();
  });

  it("keeps the controller a no-op render target without any matching elements", () => {
    stubMatchMedia({});
    render(<PageMotionController />);

    expect(document.documentElement).toHaveAttribute("data-profile-motion", "enhanced");
    expect(document.documentElement).toHaveAttribute("data-active-section", "profile");

    dispatchScroll();
    expect(document.documentElement).toHaveAttribute("data-active-section", "profile");
  });

  it("annotates header navigation links with section ids only for in-page anchors", () => {
    stubMatchMedia({});
    render(<Header />);

    const expected: Record<string, string> = {
      "#info": "info",
      "#internships": "internships",
      "#systems": "systems",
      "#open-source": "open-source",
      "#honors": "honors",
      "#writing": "writing",
      "#contact": "contact",
    };

    for (const [href, section] of Object.entries(expected)) {
      const link = document.querySelector(`a[data-nav-section="${section}"]`);
      expect(link).not.toBeNull();
      expect(link).toHaveAttribute("href", href);
      expect(link).not.toHaveAttribute("aria-current");
    }

    expect(document.querySelectorAll("a[data-nav-section]")).toHaveLength(7);
    expect(document.querySelector('a[href="https://github.com/cxzg007"]')).not.toHaveAttribute(
      "data-nav-section",
    );
    expect(document.querySelector('a[href="/resume.pdf"]')).not.toHaveAttribute(
      "data-nav-section",
    );
  });
});