/**
 * 一次前向传播的轨迹。
 *
 * 这是整个原型的落点：在终端里敲回车，字不是直接变成答案，而是从屏幕里飞出来，
 * 沿着层与层之间的连线往深处走一趟，再带着结果回到屏幕。前面三个阶段搭的场景
 * 到这里才有了用处——那叠层不再只是背景，它是这句话真正要穿过去的东西。
 *
 * 轨迹和时序都放在这里做成纯函数。它们在渲染循环里每帧都被调用，一旦某个相位
 * 的边界算错，画面会卡在半路或者提前把镜头推回去，而这种错在三维场景里很难定位。
 */

import { PANEL_SIZE, type Vec3, lerpVec3 } from "./camera-rig";

/** 一条轨迹：从屏幕上的某个点出发，穿过每一层，再回到同一个点。 */
export type FlightPath = Vec3[];

export const FLIGHT = {
  /** 往返一趟的时间。 */
  travel: 2600,
  /** 回到屏幕后停一下，让人看清它确实回来了，再把镜头推回终端。 */
  settle: 420,
} as const;

export const FLIGHT_DURATION = FLIGHT.travel + FLIGHT.settle;

export type FlightPhase = "travel" | "settle" | "done";

export function flightPhase(elapsed: number): FlightPhase {
  if (elapsed < FLIGHT.travel) return "travel";
  if (elapsed < FLIGHT_DURATION) return "settle";
  return "done";
}

/** 往返进度，0 到 1；超出区间后钳住，省得调用方自己判断。 */
export function travelProgress(elapsed: number): number {
  return Math.min(1, Math.max(0, elapsed / FLIGHT.travel));
}

/**
 * 一句话派多少个 token 出去。
 *
 * 不是真的分词，只是让长句子看起来确实更费力。上下限卡死：少于四个看不出是一股，
 * 多于十四个会在层间糊成一片亮斑，反而看不清它们各走各的路。
 */
export function tokenCount(text: string): number {
  const length = text.trim().length;
  if (!length) return 0;
  return Math.min(14, Math.max(4, Math.round(length / 1.6)));
}

/** 每层抽几个候选再挑。抽太少跟随机没区别，抽太多每条轨迹就都贴着直线走。 */
const CANDIDATES = 5;

/**
 * 在一层里挑离锚点最近的节点。
 *
 * 每层独立随机取点的话，轨迹会在层与层之间大幅横跳，看着像一团乱折的线，
 * 读不出"顺着往深处走"这件事。就近取点之后它才像一条路径。
 */
export function nearestOf(
  layer: readonly Vec3[],
  anchor: Vec3,
  random: () => number,
  samples = CANDIDATES,
): Vec3 {
  let best = layer[Math.floor(random() * layer.length)];
  let bestDistance = Infinity;
  for (let index = 0; index < samples; index += 1) {
    const node = layer[Math.floor(random() * layer.length)];
    const dx = node.x - anchor.x;
    const dy = node.y - anchor.y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  }
  return best;
}

/**
 * 规划若干条轨迹。
 *
 * 去程一路就近走，到最深那层之后换到对侧再往回走，于是轨迹是一个环而不是一条
 * 折返的线——原路返回会显得像撞墙弹回来，而前向传播本来就不走回头路。
 */
export function planFlight(
  layers: readonly (readonly Vec3[])[],
  random: () => number,
  count: number,
): FlightPath[] {
  const usable = layers.filter((layer) => layer.length > 0);
  const paths: FlightPath[] = [];

  for (let index = 0; index < count; index += 1) {
    // 出发点散布在面板上，不要全从正中间冒出来。
    const origin: Vec3 = {
      x: (random() - 0.5) * PANEL_SIZE.width * 0.82,
      y: (random() - 0.5) * PANEL_SIZE.height * 0.82,
      z: 0.3,
    };

    const outbound: Vec3[] = [];
    let anchor = origin;
    for (const layer of usable) {
      anchor = nearestOf(layer, anchor, random);
      outbound.push(anchor);
    }

    // 回程从对侧起步：把最深那点关于中轴镜像过去当锚点，走出来的就是另一条路。
    const inbound: Vec3[] = [];
    anchor = { x: -anchor.x, y: -anchor.y, z: anchor.z };
    for (let depth = usable.length - 1; depth >= 0; depth -= 1) {
      anchor = nearestOf(usable[depth], anchor, random);
      inbound.push(anchor);
    }

    paths.push([origin, ...outbound, ...inbound, origin]);
  }

  return paths;
}

/** 按折线段均分取点。段长不等会让速度忽快忽慢，但那恰好像是在不同层停留。 */
export function samplePath(path: readonly Vec3[], t: number): Vec3 {
  if (path.length === 0) return { x: 0, y: 0, z: 0 };
  if (path.length === 1) return path[0];
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (path.length - 1);
  const index = Math.min(path.length - 2, Math.floor(scaled));
  return lerpVec3(path[index], path[index + 1], scaled - index);
}

/**
 * 每个 token 的起跑延迟，占总时长的比例。
 *
 * 全部同时出发会连成一道整齐的光带，像一个物体而不是一群 token；错开之后
 * 才看得出是一个一个被送进去的。最后一个也必须在总时长内跑完，所以延迟上限
 * 卡在 0.22，剩下的时间够它走完全程。
 */
export function launchOffset(index: number, count: number): number {
  if (count <= 1) return 0;
  return (index / (count - 1)) * 0.22;
}

/** 某个 token 自己的进度：减去它的延迟，再按剩下的时间重新归一。 */
export function tokenProgress(elapsed: number, index: number, count: number): number {
  const offset = launchOffset(index, count);
  const overall = travelProgress(elapsed);
  if (overall <= offset) return 0;
  return Math.min(1, (overall - offset) / (1 - offset));
}
