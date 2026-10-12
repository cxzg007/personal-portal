/**
 * 潜空间原型的相机调度。
 *
 * 参考 Henry Heffernan 作品集的做法：镜头只在少数固定机位之间补间，
 * 不开放自由漫游，这样观感始终可控，访客不会在三维空间里迷路。
 * 这里把机位和状态迁移抽成纯函数，便于单独测试。
 */

export type StageKey = "boot" | "idle" | "approach" | "terminal";

export type Vec3 = { x: number; y: number; z: number };

export type Keyframe = {
  /** 相机位置 */
  position: Vec3;
  /** 相机注视点 */
  target: Vec3;
};

/** 终端面板的尺寸，相机贴近时按它计算距离。 */
export const PANEL_SIZE = { width: 16, height: 10 } as const;

export const STAGE_KEYFRAMES: Record<StageKey, Keyframe> = {
  // 接入前：停在结构外面，雾把细节滤掉，只剩一团在暗处发光的东西。
  // 距离是跟着雾算的——FogExp2 密度 0.0062 下超过两百单位就全被吃成底色，
  // 所以停在一百三左右：雾滤掉约一半，既看不清，又确实看得见有东西正在长出来。
  // 注视点比结构中心更靠左下，于是结构落在画面右上，左下留给载入屏的文字。
  boot: {
    position: { x: -70, y: 34, z: 100 },
    target: { x: -20, y: -4, z: -14 },
  },
  // 远景：斜侧方俯视整叠网络层，看清结构的厚度。
  idle: {
    position: { x: -46, y: 21, z: 64 },
    target: { x: -3, y: 0, z: -14 },
  },
  // 中景：正对终端，鼠标带来小幅视差。
  approach: {
    position: { x: 0, y: 1.5, z: 44 },
    target: { x: 0, y: 0, z: 0 },
  },
  // 贴近：锁死镜头，终端填满画面；实际距离由视口比例决定。
  terminal: {
    position: { x: 0, y: 0, z: 18 },
    target: { x: 0, y: 0, z: 0 },
  },
};

/** HUD 上可以直接跳的机位。boot 不在其中：它只能由接入动作离开，不能跳回去。 */
export const STAGE_ORDER: StageKey[] = ["idle", "approach", "terminal"];

/**
 * 贴近终端时的相机距离。
 *
 * 面板要完整落在画面内，所以纵横两个方向都要够，取更远的那个再留一点余量。
 */
export function terminalDistance(
  verticalFovDeg: number,
  aspect: number,
  margin = 1.08,
): number {
  const halfFov = (verticalFovDeg / 2) * (Math.PI / 180);
  const tan = Math.tan(halfFov);
  const byHeight = PANEL_SIZE.height / 2 / tan;
  const byWidth = PANEL_SIZE.width / 2 / (tan * Math.max(aspect, 0.0001));
  return Math.max(byHeight, byWidth) * margin;
}

/** 五次缓动：起步和收尾都慢，中段快，推拉镜头用它最稳。 */
export function easeInOutQuint(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < 0.5 ? 16 * clamped ** 5 : 1 - (-2 * clamped + 2) ** 5 / 2;
}

export function lerpVec3(from: Vec3, to: Vec3, t: number): Vec3 {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

/**
 * 点击：在远景和中景之间来回。
 *
 * 贴近终端后点击属于终端内部的操作，不应该把镜头拉走。
 */
export function stageOnClick(current: StageKey): StageKey {
  // 还没接入时，点击由引导层自己处理，镜头不动。
  if (current === "boot") return "boot";
  if (current === "idle") return "approach";
  if (current === "approach") return "idle";
  return current;
}

/**
 * 指针移到终端上或离开终端。
 *
 * 只有已经走到中景才会被吸进终端，远景时掠过不触发，避免误操作。
 */
export function stageOnPanelHover(current: StageKey, onPanel: boolean): StageKey {
  if (current === "boot") return "boot";
  if (onPanel && current === "approach") return "terminal";
  if (!onPanel && current === "terminal") return "approach";
  return current;
}

/** 退出键：逐级后退。 */
export function stageOnEscape(current: StageKey): StageKey {
  if (current === "terminal") return "approach";
  if (current === "approach") return "idle";
  // 远景已经是最外层，不退回未接入状态——接入是一次性的。
  return current;
}

/** 回车或空格：逐级前进，让键盘用户走和鼠标一样的路径。 */
export function stageOnAdvance(current: StageKey): StageKey {
  if (current === "boot") return "boot";
  if (current === "idle") return "approach";
  if (current === "approach") return "terminal";
  return current;
}

export const STAGE_COPY: Record<StageKey, { label: string; hint: string }> = {
  boot: { label: "接入 / Attach", hint: "正在载入模型 · Loading model" },
  idle: { label: "远景 / Overview", hint: "点击进入结构 · Click to enter" },
  approach: { label: "中景 / Approach", hint: "移到终端上放大 · Hover the terminal" },
  terminal: { label: "终端 / Terminal", hint: "按 Esc 退出 · Press Esc to exit" },
};
