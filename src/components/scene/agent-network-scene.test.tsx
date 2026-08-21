import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScenePerformanceMonitor } from "@/components/scene/agent-network-scene";

type FrameCallback = (
  state: { performance: { regress: () => void } },
  delta: number,
) => void;

const frameCallbacks = vi.hoisted(() => [] as FrameCallback[]);

vi.mock("@react-three/fiber", () => ({
  useFrame: (callback: FrameCallback) => frameCallbacks.push(callback),
}));

afterEach(() => {
  cleanup();
  frameCallbacks.length = 0;
});

describe("ScenePerformanceMonitor", () => {
  it("regresses R3F and requests one quality reduction after sustained low FPS", () => {
    const regress = vi.fn();
    const onPerformanceDecline = vi.fn();
    render(
      <ScenePerformanceMonitor onPerformanceDecline={onPerformanceDecline} />,
    );

    for (let frame = 0; frame < 60; frame += 1) {
      frameCallbacks[0]({ performance: { regress } }, 0.05);
    }

    expect(regress).toHaveBeenCalledTimes(1);
    expect(onPerformanceDecline).toHaveBeenCalledTimes(1);
  });
});
