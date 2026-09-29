import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";
import { InternshipStoryCard } from "./internship-story-card";

const { internships } = loadSiteContent();
let reduced = false;
let hidden = false;
let preference: EventTarget;
const observers = new Map<Element, (visible: boolean) => void>();

function enter(figure: Element, visible: boolean) {
  act(() => observers.get(figure)?.(visible));
}

function renderCard(index = 0) {
  render(<InternshipStoryCard internship={internships[index]} index={index} />);
  return screen.getAllByRole("figure")[index];
}

beforeEach(() => {
  reduced = false;
  hidden = false;
  preference = new EventTarget();
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reduced; },
    addEventListener: preference.addEventListener.bind(preference),
    removeEventListener: preference.removeEventListener.bind(preference),
  }));
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("IntersectionObserver", class {
    private targets = new Set<Element>();
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.targets.add(target);
      observers.set(target, (visible) => this.callback([
        { target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry,
      ], this as unknown as IntersectionObserver));
    }
    disconnect() { this.targets.forEach((target) => observers.delete(target)); }
  });
});

afterEach(() => {
  cleanup();
  observers.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("internship illustration playback", () => {
  it("runs only while visible and preserves a manual pause across reentry", () => {
    const figure = renderCard();
    expect(figure).toHaveAttribute("data-motion", "paused");
    enter(figure, true);
    expect(figure).toHaveAttribute("data-motion", "running");
    fireEvent.click(within(figure).getByRole("button", { name: /暂停/ }));
    expect(figure).toHaveAttribute("data-motion", "paused");
    enter(figure, false);
    enter(figure, true);
    expect(figure).toHaveAttribute("data-motion", "paused");
    fireEvent.click(within(figure).getByRole("button", { name: /播放/ }));
    expect(figure).toHaveAttribute("data-motion", "running");
    enter(figure, false);
    expect(figure).toHaveAttribute("data-motion", "paused");
  });

  it("stops when the tab is hidden, then resumes only if the user has not paused", () => {
    const figure = renderCard();
    enter(figure, true);
    act(() => { hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    expect(figure).toHaveAttribute("data-motion", "paused");
    act(() => { hidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    expect(figure).toHaveAttribute("data-motion", "running");
    fireEvent.click(within(figure).getByRole("button", { name: /暂停/ }));
    act(() => { hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    act(() => { hidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    expect(figure).toHaveAttribute("data-motion", "paused");
  });

  it("shows a static illustration when reduced motion is enabled, including preference changes", () => {
    reduced = true;
    const figure = renderCard();
    enter(figure, true);
    expect(figure).toHaveAttribute("data-motion", "paused");
    expect(within(figure).getByText("静态示意")).toBeVisible();
    expect(within(figure).getByRole("button")).toBeDisabled();
    act(() => { reduced = false; preference.dispatchEvent(new Event("change")); });
    expect(figure).toHaveAttribute("data-motion", "running");
    act(() => { reduced = true; preference.dispatchEvent(new Event("change")); });
    expect(figure).toHaveAttribute("data-motion", "paused");
  });

  it("lets each internship be paused independently", () => {
    const first = renderCard(0);
    const second = renderCard(1);
    enter(first, true);
    enter(second, true);
    fireEvent.click(within(first).getByRole("button", { name: /暂停/ }));
    expect(first).toHaveAttribute("data-motion", "paused");
    expect(second).toHaveAttribute("data-motion", "running");
  });

  it("keeps the remaining diagram responsive after another diagram unmounts", () => {
    const first = render(<InternshipStoryCard internship={internships[0]} index={0} />);
    const second = renderCard(1);
    enter(second, true);
    first.unmount();
    enter(second, false);
    expect(second).toHaveAttribute("data-motion", "paused");
    enter(second, true);
    expect(second).toHaveAttribute("data-motion", "running");
    act(() => { reduced = true; preference.dispatchEvent(new Event("change")); });
    expect(second).toHaveAttribute("data-motion", "paused");
  });
});
