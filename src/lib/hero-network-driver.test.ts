import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getHeroNetworkFrame,
  HERO_NETWORK_EDGES,
  HERO_NETWORK_NODES,
  type Point,
} from "./hero-network";
import { createHeroNetworkDriver, type HeroNetworkDriver } from "./hero-network-driver";

const SVG_NS = "http://www.w3.org/2000/svg";

function parseTranslate(element: Element): Point {
  const transform = element.getAttribute("transform") ?? "";
  const match = /translate\((-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)\)/.exec(transform);
  if (!match) throw new Error(`unexpected transform: ${transform}`);
  return { x: Number(match[1]), y: Number(match[2]) };
}

function expectAlmostEqual(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-6);
}

function buildNetworkSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("data-hero-network", "");
  svg.setAttribute("viewBox", "0 0 560 360");
  const collapsed = new Map(
    getHeroNetworkFrame(0).map(({ id, point }) => [id, point] as const),
  );
  HERO_NETWORK_EDGES.forEach(({ from, to }) => {
    const line = document.createElementNS(SVG_NS, "line");
    const start = collapsed.get(from)!;
    const end = collapsed.get(to)!;
    line.setAttribute("data-network-from", from);
    line.setAttribute("data-network-to", to);
    line.setAttribute("x1", String(start.x));
    line.setAttribute("y1", String(start.y));
    line.setAttribute("x2", String(end.x));
    line.setAttribute("y2", String(end.y));
    svg.appendChild(line);
  });
  HERO_NETWORK_NODES.forEach((node) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-network-node", node.id);
    const point = collapsed.get(node.id)!;
    group.setAttribute("transform", `translate(${point.x} ${point.y})`);
    svg.appendChild(group);
  });
  document.body.appendChild(svg);
  return svg;
}

function mockSvgRect(svg: SVGSVGElement, rect: Partial<DOMRect>) {
  vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 560,
    height: 360,
    top: 0,
    left: 0,
    right: 560,
    bottom: 360,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

function nodeGroup(svg: SVGSVGElement, id: string): SVGGElement {
  return svg.querySelector<SVGGElement>(`[data-network-node="${id}"]`)!;
}

function edgeLine(svg: SVGSVGElement, from: string, to: string): SVGLineElement {
  return svg.querySelector<SVGLineElement>(
    `[data-network-from="${from}"][data-network-to="${to}"]`,
  )!;
}

function highlightedNode(svg: SVGSVGElement): string | null {
  return (
    svg.querySelector<SVGGElement>("[data-network-highlight]")?.getAttribute("data-network-node") ??
    null
  );
}

function activeEdges(svg: SVGSVGElement): string[] {
  return [...svg.querySelectorAll<SVGLineElement>("[data-network-edge-active]")].map((line) =>
    `${line.getAttribute("data-network-from")}->${line.getAttribute("data-network-to")}`,
  );
}

function expectGeometryAtProgress(svg: SVGSVGElement, progress: number) {
  const frame = new Map(getHeroNetworkFrame(progress).map(({ id, point }) => [id, point] as const));
  HERO_NETWORK_NODES.forEach((node) => {
    const point = frame.get(node.id)!;
    const transform = parseTranslate(nodeGroup(svg, node.id));
    expectAlmostEqual(transform.x, point.x);
    expectAlmostEqual(transform.y, point.y);
  });
  HERO_NETWORK_EDGES.forEach(({ from, to }) => {
    const line = edgeLine(svg, from, to);
    const start = frame.get(from)!;
    const end = frame.get(to)!;
    expectAlmostEqual(Number(line.getAttribute("x1")), start.x);
    expectAlmostEqual(Number(line.getAttribute("y1")), start.y);
    expectAlmostEqual(Number(line.getAttribute("x2")), end.x);
    expectAlmostEqual(Number(line.getAttribute("y2")), end.y);
  });
}

describe("createHeroNetworkDriver", () => {
  let svg: SVGSVGElement;
  let driver: HeroNetworkDriver;

  beforeEach(() => {
    svg = buildNetworkSvg();
    mockSvgRect(svg, {});
    driver = createHeroNetworkDriver(svg);
  });

  afterEach(() => {
    driver.destroy();
    svg.remove();
    vi.restoreAllMocks();
  });

  it("updates every node transform and edge endpoint for the requested progress", () => {
    driver.update(0.5, null);
    expectGeometryAtProgress(svg, 0.5);

    driver.update(0, null);
    expectGeometryAtProgress(svg, 0);

    driver.update(1, null);
    expectGeometryAtProgress(svg, 1);
  });

  it("keeps unrelated attributes untouched while updating geometry", () => {
    const group = nodeGroup(svg, "understand");
    group.setAttribute("data-mark", "keep");
    const line = edgeLine(svg, "understand", "retrieve");
    line.setAttribute("stroke-width", "2");

    driver.update(1, null);

    expect(group).toHaveAttribute("data-mark", "keep");
    expect(line).toHaveAttribute("stroke-width", "2");
    expect(svg.querySelectorAll("[data-network-node]")).toHaveLength(HERO_NETWORK_NODES.length);
  });

  it("highlights the core node within 48 viewBox units and its connected edges", () => {
    driver.update(1, { x: 100, y: 94 });

    expect(highlightedNode(svg)).toBe("understand");
    const expected = HERO_NETWORK_EDGES.filter(
      ({ from, to }) => from === "understand" || to === "understand",
    ).map(({ from, to }) => `${from}->${to}`);
    expect(activeEdges(svg).sort()).toEqual(expected.sort());
  });

  it("clears the highlight when the pointer moves away or becomes null", () => {
    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBe("understand");

    driver.update(1, { x: 300, y: 330 });
    expect(highlightedNode(svg)).toBeNull();
    expect(activeEdges(svg)).toHaveLength(0);

    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBe("understand");

    driver.update(1, null);
    expect(highlightedNode(svg)).toBeNull();
    expect(activeEdges(svg)).toHaveLength(0);
  });

  it("maps pointer coordinates through the svg rect with letterboxing", () => {
    mockSvgRect(svg, { width: 1_120, height: 720 });
    driver.update(1, { x: 192, y: 180 });
    expect(highlightedNode(svg)).toBe("understand");

    mockSvgRect(svg, { width: 800, height: 600 });
    driver.update(1, { x: 137.142857, y: 171.714286 });
    expect(highlightedNode(svg)).toBe("understand");

    mockSvgRect(svg, {});
    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBe("understand");
  });

  it("ignores pointers when the svg rect is empty", () => {
    mockSvgRect(svg, { width: 0, height: 0 });
    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBeNull();
  });

  it("does not highlight while running is false and clears existing highlight", () => {
    driver.setRunning(false);
    expect(svg).toHaveAttribute("data-network-running", "false");

    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBeNull();

    driver.setRunning(true);
    expect(svg).toHaveAttribute("data-network-running", "true");
    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBe("understand");

    driver.setRunning(false);
    expect(highlightedNode(svg)).toBeNull();
    expect(activeEdges(svg)).toHaveLength(0);
  });

  it("resets to the collapsed chain geometry and clears highlight", () => {
    driver.update(1, { x: 100, y: 94 });
    expect(highlightedNode(svg)).toBe("understand");

    driver.reset();

    expectGeometryAtProgress(svg, 0);
    expect(highlightedNode(svg)).toBeNull();
    expect(activeEdges(svg)).toHaveLength(0);
  });

  it("destroy clears driver state and is idempotent", () => {
    driver.update(1, { x: 100, y: 94 });

    driver.destroy();

    expectGeometryAtProgress(svg, 0);
    expect(highlightedNode(svg)).toBeNull();
    expect(activeEdges(svg)).toHaveLength(0);
    expect(svg).not.toHaveAttribute("data-network-running");

    expect(() => driver.destroy()).not.toThrow();
    expect(() => driver.update(1, { x: 100, y: 94 })).not.toThrow();
    expect(() => driver.reset()).not.toThrow();
    expect(() => driver.setRunning(true)).not.toThrow();

    expectGeometryAtProgress(svg, 0);
    expect(highlightedNode(svg)).toBeNull();
    expect(svg).not.toHaveAttribute("data-network-running");
  });

  it("tolerates a network svg with missing nodes and edges", () => {
    const emptySvg = document.createElementNS(SVG_NS, "svg");
    emptySvg.setAttribute("data-hero-network", "");
    document.body.appendChild(emptySvg);
    const emptyDriver = createHeroNetworkDriver(emptySvg);

    expect(() => emptyDriver.update(0.5, { x: 100, y: 94 })).not.toThrow();
    expect(() => emptyDriver.reset()).not.toThrow();
    expect(() => emptyDriver.destroy()).not.toThrow();

    emptySvg.remove();
  });
});