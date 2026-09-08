import {
  clamp01,
  getHeroNetworkFrame,
  HERO_NETWORK_EDGES,
  HERO_NETWORK_NODES,
  type Point,
} from "./hero-network";

export interface HeroNetworkDriver {
  update(progress: number, pointer: Point | null): void;
  setRunning(running: boolean): void;
  reset(): void;
  destroy(): void;
}

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 360;
const HIGHLIGHT_RADIUS = 48;

interface NetworkNodeBinding {
  id: string;
  core: boolean;
  element: Element;
}

interface NetworkEdgeBinding {
  from: string;
  to: string;
  element: Element;
}

function buildFrameMap(progress: number): Map<string, Point> {
  return new Map(
    getHeroNetworkFrame(clamp01(progress)).map((entry) => [entry.id, entry.point] as const),
  );
}

/**
 * Framework-free driver that renders the semantic network geometry into an
 * existing static SVG structure. The caller owns all timing and event sources
 * (RAF scheduling, scroll/resize listeners) and simply feeds progress and
 * pointer state into `update`.
 */
export function createHeroNetworkDriver(svg: SVGSVGElement): HeroNetworkDriver {
  const nodes: NetworkNodeBinding[] = [];
  const edges: NetworkEdgeBinding[] = [];

  HERO_NETWORK_NODES.forEach((node) => {
    const element = svg.querySelector(`[data-network-node="${node.id}"]`);
    if (element) {
      nodes.push({ id: node.id, core: node.core, element });
    }
  });

  HERO_NETWORK_EDGES.forEach((edge) => {
    const element = svg.querySelector(
      `[data-network-from="${edge.from}"][data-network-to="${edge.to}"]`,
    );
    if (element) {
      edges.push({ from: edge.from, to: edge.to, element });
    }
  });

  let running = true;
  let destroyed = false;

  const applyFrame = (frame: Map<string, Point>) => {
    nodes.forEach((node) => {
      const point = frame.get(node.id);
      if (!point) return;
      node.element.setAttribute("transform", `translate(${point.x} ${point.y})`);
    });
    edges.forEach((edge) => {
      const start = frame.get(edge.from);
      const end = frame.get(edge.to);
      if (!start || !end) return;
      edge.element.setAttribute("x1", String(start.x));
      edge.element.setAttribute("y1", String(start.y));
      edge.element.setAttribute("x2", String(end.x));
      edge.element.setAttribute("y2", String(end.y));
    });
  };

  const clearHighlight = () => {
    nodes.forEach((node) => node.element.removeAttribute("data-network-highlight"));
    edges.forEach((edge) => edge.element.removeAttribute("data-network-edge-active"));
  };

  const applyHighlight = (frame: Map<string, Point>, pointer: Point) => {
    clearHighlight();
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // The svg uses preserveAspectRatio (default "xMidYMid meet"), so pointer
    // coordinates must be mapped through the letterboxed render box.
    const scale = Math.min(rect.width / VIEWBOX_WIDTH, rect.height / VIEWBOX_HEIGHT);
    if (!(scale > 0)) return;
    const offsetX = (rect.width - VIEWBOX_WIDTH * scale) / 2;
    const offsetY = (rect.height - VIEWBOX_HEIGHT * scale) / 2;
    const x = (pointer.x - rect.left - offsetX) / scale;
    const y = (pointer.y - rect.top - offsetY) / scale;

    let nearestId: string | null = null;
    let nearestDistance = HIGHLIGHT_RADIUS;
    nodes.forEach((node) => {
      if (!node.core) return;
      const point = frame.get(node.id);
      if (!point) return;
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance <= nearestDistance) {
        nearestId = node.id;
        nearestDistance = distance;
      }
    });

    if (nearestId === null) return;
    svg
      .querySelector(`[data-network-node="${nearestId}"]`)
      ?.setAttribute("data-network-highlight", "");
    edges.forEach((edge) => {
      if (edge.from === nearestId || edge.to === nearestId) {
        edge.element.setAttribute("data-network-edge-active", "");
      }
    });
  };

  const renderStatic = () => {
    applyFrame(buildFrameMap(0));
    clearHighlight();
  };

  svg.setAttribute("data-network-running", "true");

  return {
    update(progress: number, pointer: Point | null) {
      if (destroyed) return;
      const frame = buildFrameMap(progress);
      applyFrame(frame);
      if (pointer !== null && running) {
        applyHighlight(frame, pointer);
      } else {
        clearHighlight();
      }
    },
    setRunning(nextRunning: boolean) {
      if (destroyed) return;
      running = nextRunning;
      svg.setAttribute("data-network-running", String(nextRunning));
      if (!running) clearHighlight();
    },
    reset() {
      if (destroyed) return;
      renderStatic();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderStatic();
      svg.removeAttribute("data-network-running");
    },
  };
}