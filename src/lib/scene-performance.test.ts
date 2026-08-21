import { describe, expect, it } from "vitest";

import {
  createFrameSample,
  getSceneRenderBudget,
  recordFrame,
} from "@/lib/scene-performance";

describe("scene performance fallback", () => {
  it("turns a sustained low frame rate into a smaller rendering budget", () => {
    let sample = createFrameSample();
    let shouldDegrade = false;

    for (let frame = 0; frame < 30; frame += 1) {
      const result = recordFrame(sample, 0.05);
      sample = result.sample;
      shouldDegrade ||= result.shouldDegrade;
    }

    const normal = getSceneRenderBudget("full", false);
    const degraded = getSceneRenderBudget("full", shouldDegrade);

    expect(shouldDegrade).toBe(true);
    expect(degraded).toEqual({ maxDpr: 1, nodeLimit: 18, particleLimit: 10 });
    expect(degraded.maxDpr).toBeLessThan(normal.maxDpr);
    expect(degraded.nodeLimit).toBeLessThan(normal.nodeLimit);
    expect(degraded.particleLimit).toBeLessThan(normal.particleLimit);
  });

  it("keeps the full rendering budget when frame rate stays healthy", () => {
    let sample = createFrameSample();
    let shouldDegrade = false;

    for (let frame = 0; frame < 90; frame += 1) {
      const result = recordFrame(sample, 1 / 60);
      sample = result.sample;
      shouldDegrade ||= result.shouldDegrade;
    }

    expect(shouldDegrade).toBe(false);
    expect(getSceneRenderBudget("full", shouldDegrade)).toEqual({
      maxDpr: 1.5,
      nodeLimit: 48,
      particleLimit: 30,
    });
  });

  it("further reduces an already-lite scene after a low frame-rate sample", () => {
    expect(getSceneRenderBudget("lite", true)).toEqual({
      maxDpr: 1,
      nodeLimit: 10,
      particleLimit: 6,
    });
  });
});
