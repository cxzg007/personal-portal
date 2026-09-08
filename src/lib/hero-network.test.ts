import { describe, expect, it } from "vitest";

import {
  clamp01,
  getHeroNetworkFrame,
  getHeroNetworkNode,
  getHeroProgress,
  HERO_NETWORK_EDGES,
  HERO_NETWORK_NODES,
  interpolatePoint,
} from "./hero-network";

describe("clamp01", () => {
  it("keeps values inside the unit interval", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.42)).toBe(0.42);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(1.7)).toBe(1);
  });
});

describe("getHeroProgress", () => {
  it("returns 0 while the hero is still at the top of the viewport", () => {
    expect(getHeroProgress(20, 500)).toBe(0);
    expect(getHeroProgress(0, 500)).toBe(0);
  });

  it("returns 1 once the hero has scrolled past the reveal window", () => {
    expect(getHeroProgress(-275, 500)).toBe(1);
    expect(getHeroProgress(-1_000, 500)).toBe(1);
  });

  it("maps the intermediate range linearly", () => {
    expect(getHeroProgress(-137.5, 500)).toBeCloseTo(0.5);
    expect(getHeroProgress(-68.75, 500)).toBeCloseTo(0.25);
  });

  it("does not divide by zero when the hero has no measurable height", () => {
    expect(getHeroProgress(-40, 0)).toBe(1);
    expect(getHeroProgress(0, 0)).toBe(0);
  });
});

describe("interpolatePoint", () => {
  it("interpolates the midpoint with smoothstep easing", () => {
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({
      x: 5,
      y: 10,
    });
  });

  it("returns the endpoints at the clamp boundaries", () => {
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0)).toEqual({
      x: 0,
      y: 0,
    });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 1)).toEqual({
      x: 10,
      y: 20,
    });
  });

  it("clamps out-of-range progress values instead of extrapolating", () => {
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, -3)).toEqual({
      x: 0,
      y: 0,
    });
    expect(interpolatePoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 4)).toEqual({
      x: 10,
      y: 20,
    });
  });
});

describe("hero network geometry tables", () => {
  it("keeps the fixed node and edge budget", () => {
    expect(HERO_NETWORK_NODES).toHaveLength(16);
    expect(HERO_NETWORK_NODES.filter((node) => node.core)).toHaveLength(4);
    expect(HERO_NETWORK_EDGES.length).toBeLessThanOrEqual(24);
  });

  it("places every edge endpoint on a known node", () => {
    const ids = new Set(HERO_NETWORK_NODES.map((node) => node.id));
    for (const edge of HERO_NETWORK_EDGES) {
      expect(ids.has(edge.from)).toBe(true);
      expect(ids.has(edge.to)).toBe(true);
    }
  });

  it("renders the collapsed chain at progress 0 and the scattered network at 1", () => {
    const collapsed = getHeroNetworkFrame(0);
    for (const node of collapsed) {
      const geometry = getHeroNetworkNode(node.id)!;
      expect(node.point).toEqual(geometry.collapsed);
    }

    const scattered = getHeroNetworkFrame(1);
    for (const node of scattered) {
      const geometry = getHeroNetworkNode(node.id)!;
      expect(node.point).toEqual(geometry.initial);
    }
  });

  it("moves every node monotonically between the two layouts", () => {
    const start = new Map(getHeroNetworkFrame(0).map((node) => [node.id, node.point]));
    const end = new Map(getHeroNetworkFrame(1).map((node) => [node.id, node.point]));
    const middle = new Map(getHeroNetworkFrame(0.5).map((node) => [node.id, node.point]));

    for (const id of start.keys()) {
      const from = start.get(id)!;
      const mid = middle.get(id)!;
      const to = end.get(id)!;
      expect(mid.x).toBeGreaterThanOrEqual(Math.min(from.x, to.x));
      expect(mid.x).toBeLessThanOrEqual(Math.max(from.x, to.x));
      expect(mid.y).toBeGreaterThanOrEqual(Math.min(from.y, to.y));
      expect(mid.y).toBeLessThanOrEqual(Math.max(from.y, to.y));
    }
  });

  it("resolves nodes by id and reports unknown ids", () => {
    expect(getHeroNetworkNode("understand")?.label).toBe("理解");
    expect(getHeroNetworkNode("understand-aux-1")?.core).toBe(false);
    expect(getHeroNetworkNode("missing")).toBeUndefined();
  });
});