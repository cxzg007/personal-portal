import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCaseChainStage,
  getSceneTransition,
  ScrollEnhancements,
} from "./scroll-enhancements";

describe("scroll-linked progressive enhancement", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-scroll-enhancement");
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("maps geometry to deterministic scene and case-chain stages", () => {
    expect(getSceneTransition(0, 800, 1_600)).toBe("network");
    expect(getSceneTransition(900, 800, 1_600)).toBe("decomposing");
    expect(getSceneTransition(1_400, 800, 1_600)).toBe("timeline");
    expect(getCaseChainStage({ bottom: 1_300, top: 900 }, 800)).toBe(0);
    expect(getCaseChainStage({ bottom: 900, top: 500 }, 800)).toBe(1);
    expect(getCaseChainStage({ bottom: 700, top: 300 }, 800)).toBe(2);
    expect(getCaseChainStage({ bottom: 500, top: 100 }, 800)).toBe(3);
  });

  it("does not activate scroll effects when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    document.body.innerHTML = `
      <div class="agent-network"></div>
      <section id="internships"></section>
      <ol class="architecture-flow"></ol>
    `;

    render(<ScrollEnhancements />);

    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "disabled",
    );
    expect(document.querySelector(".agent-network")).not.toHaveAttribute(
      "data-scene-transition",
    );
    expect(document.querySelector(".architecture-flow")).not.toHaveAttribute(
      "data-chain-stage",
    );
  });

  it("exposes enhanced scene and case-chain states in normal mode", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 900 });
    document.body.innerHTML = `
      <div class="agent-network"></div>
      <section id="internships"></section>
      <ol class="architecture-flow"></ol>
    `;
    vi.spyOn(document.querySelector<HTMLElement>("#internships")!, "getBoundingClientRect")
      .mockReturnValue({ top: 700 } as DOMRect);
    vi.spyOn(document.querySelector<HTMLElement>(".architecture-flow")!, "getBoundingClientRect")
      .mockReturnValue({ bottom: 700, top: 300 } as DOMRect);

    render(<ScrollEnhancements />);
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(document.documentElement).toHaveAttribute(
      "data-scroll-enhancement",
      "enabled",
    );
    expect(document.querySelector(".agent-network")).toHaveAttribute(
      "data-scene-transition",
      "decomposing",
    );
    expect(document.querySelector(".architecture-flow")).toHaveAttribute(
      "data-chain-stage",
      "2",
    );
  });
});
