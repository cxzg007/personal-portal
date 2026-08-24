import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentNetworkScene, ScenePerformanceMonitor } from "@/components/scene/agent-network-scene";

type FrameState = {
  performance: { regress: () => void; current: number };
  pointer: { x: number; y: number };
};
type FrameCallback = (state: FrameState, delta: number) => void;

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
      frameCallbacks[0]({ performance: { regress, current: 1 }, pointer: { x: 0, y: 0 } }, 0.05);
    }

    expect(regress).toHaveBeenCalledTimes(1);
    expect(onPerformanceDecline).toHaveBeenCalledTimes(1);
  });
});

describe("AgentNetworkScene warm palette", () => {
  it("applies warm material colors to lights, lines, nodes, and particles", () => {
    const { container } = render(
      <AgentNetworkScene
        nodeLimit={8}
        onPerformanceDecline={vi.fn()}
        particleLimit={12}
      />,
    );

    const lights = Array.from(container.querySelectorAll("pointlight"));
    expect(lights.map((light) => light.getAttribute("color"))).toEqual([
      "#ffb457",
      "#ff7a59",
    ]);

    const lineMaterial = container.querySelector("linebasicmaterial");
    expect(lineMaterial).toHaveAttribute("color", "#ffb457");

    const nodeMaterials = Array.from(
      container.querySelectorAll("meshstandardmaterial"),
    );
    expect(
      nodeMaterials.filter((material) => material.getAttribute("color") === "#ff7a59"),
    ).not.toHaveLength(0);
    expect(
      nodeMaterials.filter((material) => material.getAttribute("color") === "#ffb457"),
    ).not.toHaveLength(0);
    expect(
      nodeMaterials.filter((material) => material.getAttribute("emissive") === "#fff2dd"),
    ).not.toHaveLength(0);

    expect(container.querySelector("pointsmaterial")).toHaveAttribute(
      "color",
      "#fff2dd",
    );
  });

  it("still regresses performance exactly once when the scene runs warm colors", () => {
    const regress = vi.fn();
    const onPerformanceDecline = vi.fn();
    const { container } = render(
      <AgentNetworkScene
        nodeLimit={8}
        onPerformanceDecline={onPerformanceDecline}
        particleLimit={12}
      />,
    );

    const group = container.querySelector("group");
    if (group) {
      Object.assign(group, {
        rotation: { x: 0, y: 0 },
        position: { x: 0 },
      });
    }
    const points = container.querySelector("points");
    if (points) {
      Object.assign(points, { rotation: { x: 0, y: 0, z: 0 } });
    }

    for (let frame = 0; frame < 60; frame += 1) {
      for (const callback of frameCallbacks) {
        callback({ performance: { regress, current: 1 }, pointer: { x: 0, y: 0 } }, 0.05);
      }
    }

    expect(regress).toHaveBeenCalledTimes(1);
    expect(onPerformanceDecline).toHaveBeenCalledTimes(1);
  });
});
