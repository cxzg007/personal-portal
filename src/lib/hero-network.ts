export type Point = Readonly<{ x: number; y: number }>;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getHeroProgress(top: number, height: number): number {
  return clamp01(-top / Math.max(1, height * 0.55));
}

export function interpolatePoint(from: Point, to: Point, progress: number): Point {
  const t = clamp01(progress);
  const eased = t * t * (3 - 2 * t);
  return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
}

/**
 * 固定坐标表：16 个节点（4 核心 + 12 辅助）、19 条连线，无随机数。
 * progress = 0 时是收拢后的清晰链路（SSR / 无 JS / reduced-motion 默认），
 * progress = 1 时是首屏初始的松散语义网络。
 */
export const HERO_NETWORK_VIEWBOX = { width: 560, height: 360 } as const;

export const HERO_NETWORK_CORE_RADIUS = 30;
export const HERO_NETWORK_AUX_RADIUS = 7;

export type HeroNetworkNodeGeometry = Readonly<{
  id: string;
  label: string | null;
  core: boolean;
  initial: Point;
  collapsed: Point;
}>;

type CoreSeed = Readonly<{
  id: string;
  label: string;
  initial: Point;
  collapsed: Point;
  /** 初始散点布局中辅助点相对核心点的偏移。 */
  initialAuxOffsets: readonly Point[];
}>;

/**
 * 收拢布局中辅助点统一按 (左下、上方、右下) 扇形展开，链路读作
 * 理解 → 检索 → 约束 → 执行。
 */
const COLLAPSED_AUX_OFFSETS: readonly Point[] = [
  { x: -24, y: 44 },
  { x: 0, y: -44 },
  { x: 24, y: 44 },
];

const CORE_SEEDS: readonly CoreSeed[] = [
  {
    id: "understand",
    label: "理解",
    initial: { x: 96, y: 90 },
    collapsed: { x: 72, y: 180 },
    initialAuxOffsets: [
      { x: -34, y: 34 },
      { x: 30, y: -30 },
      { x: 36, y: 28 },
    ],
  },
  {
    id: "retrieve",
    label: "检索",
    initial: { x: 238, y: 238 },
    collapsed: { x: 210, y: 180 },
    initialAuxOffsets: [
      { x: -36, y: -30 },
      { x: 34, y: -32 },
      { x: -28, y: 36 },
    ],
  },
  {
    id: "constrain",
    label: "约束",
    initial: { x: 362, y: 86 },
    collapsed: { x: 348, y: 180 },
    initialAuxOffsets: [
      { x: -32, y: 34 },
      { x: 28, y: -34 },
      { x: 38, y: 26 },
    ],
  },
  {
    id: "execute",
    label: "执行",
    initial: { x: 470, y: 242 },
    collapsed: { x: 486, y: 180 },
    initialAuxOffsets: [
      { x: -34, y: -30 },
      { x: -28, y: 36 },
      { x: 30, y: 32 },
    ],
  },
];

export const HERO_NETWORK_NODES: readonly HeroNetworkNodeGeometry[] = CORE_SEEDS.flatMap((seed) => {
  const core: HeroNetworkNodeGeometry = {
    id: seed.id,
    label: seed.label,
    core: true,
    initial: seed.initial,
    collapsed: seed.collapsed,
  };
  const aux = seed.initialAuxOffsets.map((offset, index) => {
    const collapsedOffset = COLLAPSED_AUX_OFFSETS[index];
    return {
      id: `${seed.id}-aux-${index + 1}`,
      label: null,
      core: false,
      initial: {
        x: seed.initial.x + offset.x,
        y: seed.initial.y + offset.y,
      },
      collapsed: {
        x: seed.collapsed.x + collapsedOffset.x,
        y: seed.collapsed.y + collapsedOffset.y,
      },
    } satisfies HeroNetworkNodeGeometry;
  });
  return [core, ...aux];
});

export type HeroNetworkEdge = Readonly<{ from: string; to: string }>;

export const HERO_NETWORK_EDGES: readonly HeroNetworkEdge[] = [
  { from: "understand", to: "retrieve" },
  { from: "retrieve", to: "constrain" },
  { from: "constrain", to: "execute" },
  { from: "understand-aux-1", to: "understand" },
  { from: "understand-aux-2", to: "understand" },
  { from: "understand-aux-3", to: "understand" },
  { from: "retrieve-aux-1", to: "retrieve" },
  { from: "retrieve-aux-2", to: "retrieve" },
  { from: "retrieve-aux-3", to: "retrieve" },
  { from: "constrain-aux-1", to: "constrain" },
  { from: "constrain-aux-2", to: "constrain" },
  { from: "constrain-aux-3", to: "constrain" },
  { from: "execute-aux-1", to: "execute" },
  { from: "execute-aux-2", to: "execute" },
  { from: "execute-aux-3", to: "execute" },
  { from: "understand-aux-2", to: "retrieve-aux-1" },
  { from: "retrieve-aux-3", to: "constrain-aux-1" },
  { from: "constrain-aux-3", to: "execute-aux-1" },
  { from: "execute-aux-3", to: "understand-aux-1" },
];

export type HeroNetworkFrame = ReadonlyArray<Readonly<{ id: string; point: Point }>>;

/** progress = 0 是收拢链路，progress = 1 是初始散点网络。 */
export function getHeroNetworkFrame(progress: number): HeroNetworkFrame {
  return HERO_NETWORK_NODES.map((node) => ({
    id: node.id,
    point: interpolatePoint(node.collapsed, node.initial, progress),
  }));
}

export function getHeroNetworkNode(id: string): HeroNetworkNodeGeometry | undefined {
  return HERO_NETWORK_NODES.find((node) => node.id === id);
}