/**
 * 接入前的载入流程。
 *
 * Henry Heffernan 的作品集把加载条做成了一块 BIOS 自检屏，显示的是真实的资源
 * 加载进度——这一手让等待从"卡住了"变成了叙事的一部分。这里照这个思路做，但
 * 报的必须是真进度：这个场景没有外部模型资产，所以挂钩的是三件真的在发生的事
 * ——字体就绪、七层结构逐层建好、屏幕里那张网页加载完。
 *
 * 把进度算法单独拿出来，是因为它最容易悄悄算错：某一步永远到不了、或者总数
 * 对不上，页面就会永远停在 99%，而这种问题在界面上很难一眼看出来。
 */

export type BootStepKey = "tokenizer" | "weights" | "cache";

export type BootStep = {
  key: BootStepKey;
  /** 左栏的日志行。 */
  label: string;
  /** 右栏的附注，完成后才显示。 */
  detail: string;
  /** 这一步要走几个单位，权重也按它算。 */
  total: number;
};

export const BOOT_STEPS: readonly BootStep[] = [
  { key: "tokenizer", label: "tokenizer", detail: "vocab 128k", total: 1 },
  // 七个分片对应场景里的七层结构，每建好一层就报一次。
  { key: "weights", label: "weight shards", detail: "bf16", total: 7 },
  { key: "cache", label: "kv cache", detail: "ctx 32768", total: 1 },
];

export type BootState = Record<BootStepKey, number>;

export function createBootState(): BootState {
  return { tokenizer: 0, weights: 0, cache: 0 };
}

const TOTAL_UNITS = BOOT_STEPS.reduce((sum, step) => sum + step.total, 0);

/** 把某一步推进若干单位，不会越过这一步的总数。 */
export function advanceBoot(state: BootState, key: BootStepKey, units = 1): BootState {
  const step = BOOT_STEPS.find((item) => item.key === key);
  if (!step) return state;
  return { ...state, [key]: Math.min(step.total, state[key] + units) };
}

/** 总进度，0 到 1。 */
export function bootProgress(state: BootState): number {
  const done = BOOT_STEPS.reduce((sum, step) => sum + Math.min(step.total, state[step.key]), 0);
  return done / TOTAL_UNITS;
}

export function isBootComplete(state: BootState): boolean {
  return BOOT_STEPS.every((step) => state[step.key] >= step.total);
}

/** 日志行右侧的状态：没开始是空的，做完显示附注，中间显示计数。 */
export function bootStepStatus(step: BootStep, state: BootState): string {
  const done = Math.min(step.total, state[step.key]);
  if (done >= step.total) return step.detail;
  if (step.total === 1) return "…";
  return `${done}/${step.total}`;
}
