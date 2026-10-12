import { describe, expect, it } from "vitest";

import {
  PANEL_SIZE,
  easeInOutQuint,
  lerpVec3,
  stageOnAdvance,
  stageOnClick,
  stageOnEscape,
  stageOnPanelHover,
  terminalDistance,
} from "./camera-rig";

describe("stage transitions", () => {
  it("toggles between overview and approach on click", () => {
    expect(stageOnClick("idle")).toBe("approach");
    expect(stageOnClick("approach")).toBe("idle");
  });

  it("keeps the camera parked while the terminal is in focus", () => {
    // 贴近终端后点击属于终端内部的操作，不能把镜头拉走。
    expect(stageOnClick("terminal")).toBe("terminal");
  });

  it("only pulls into the terminal from the approach stage", () => {
    expect(stageOnPanelHover("approach", true)).toBe("terminal");
    expect(stageOnPanelHover("idle", true)).toBe("idle");
  });

  it("returns to approach when the pointer leaves the panel", () => {
    expect(stageOnPanelHover("terminal", false)).toBe("approach");
    expect(stageOnPanelHover("approach", false)).toBe("approach");
  });

  it("steps back one stage at a time on escape", () => {
    expect(stageOnEscape("terminal")).toBe("approach");
    expect(stageOnEscape("approach")).toBe("idle");
    expect(stageOnEscape("idle")).toBe("idle");
  });

  it("gives keyboard users the same path forward", () => {
    expect(stageOnAdvance("idle")).toBe("approach");
    expect(stageOnAdvance("approach")).toBe("terminal");
    expect(stageOnAdvance("terminal")).toBe("terminal");
  });
});

describe("terminalDistance", () => {
  it("frames the whole panel on a wide viewport", () => {
    const aspect = 16 / 9;
    const distance = terminalDistance(35, aspect, 1);
    const halfHeight = Math.tan((35 / 2) * (Math.PI / 180)) * distance;
    expect(halfHeight).toBeGreaterThanOrEqual(PANEL_SIZE.height / 2 - 1e-6);
    expect(halfHeight * aspect).toBeGreaterThanOrEqual(PANEL_SIZE.width / 2 - 1e-6);
  });

  it("backs off further on a narrow viewport so the panel still fits", () => {
    const wide = terminalDistance(35, 16 / 9);
    const narrow = terminalDistance(35, 3 / 4);
    expect(narrow).toBeGreaterThan(wide);
  });
});

describe("easeInOutQuint", () => {
  it("stays within range and is symmetric around the midpoint", () => {
    expect(easeInOutQuint(-1)).toBe(0);
    expect(easeInOutQuint(0)).toBe(0);
    expect(easeInOutQuint(0.5)).toBeCloseTo(0.5, 6);
    expect(easeInOutQuint(1)).toBe(1);
    expect(easeInOutQuint(2)).toBe(1);
    expect(easeInOutQuint(0.25) + easeInOutQuint(0.75)).toBeCloseTo(1, 6);
  });
});

describe("lerpVec3", () => {
  it("interpolates each axis independently", () => {
    const from = { x: 0, y: 10, z: -4 };
    const to = { x: 4, y: 0, z: 4 };
    expect(lerpVec3(from, to, 0.5)).toEqual({ x: 2, y: 5, z: 0 });
  });
});
