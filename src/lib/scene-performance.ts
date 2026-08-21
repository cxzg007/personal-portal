import type { SceneMode } from "@/lib/webgl";

type DynamicSceneMode = Exclude<SceneMode, "static">;

export type FrameSample = {
  elapsedSeconds: number;
  frames: number;
};

export type SceneRenderBudget = {
  maxDpr: number;
  nodeLimit: number;
  particleLimit: number;
};

const SAMPLE_WINDOW_SECONDS = 1.5;
const MIN_SAMPLE_FRAMES = 20;
const LOW_FRAME_RATE = 42;
const MAX_VALID_FRAME_SECONDS = 0.25;

const RENDER_BUDGETS: Record<
  DynamicSceneMode,
  { degraded: SceneRenderBudget; normal: SceneRenderBudget }
> = {
  full: {
    normal: { maxDpr: 1.5, nodeLimit: 48, particleLimit: 30 },
    degraded: { maxDpr: 1, nodeLimit: 18, particleLimit: 10 },
  },
  lite: {
    normal: { maxDpr: 1.15, nodeLimit: 18, particleLimit: 10 },
    degraded: { maxDpr: 1, nodeLimit: 10, particleLimit: 6 },
  },
};

export function createFrameSample(): FrameSample {
  return { elapsedSeconds: 0, frames: 0 };
}

export function recordFrame(
  sample: FrameSample,
  deltaSeconds: number,
): { sample: FrameSample; shouldDegrade: boolean } {
  if (
    !Number.isFinite(deltaSeconds) ||
    deltaSeconds <= 0 ||
    deltaSeconds > MAX_VALID_FRAME_SECONDS
  ) {
    return { sample: createFrameSample(), shouldDegrade: false };
  }

  const nextSample = {
    elapsedSeconds: sample.elapsedSeconds + deltaSeconds,
    frames: sample.frames + 1,
  };

  if (
    nextSample.elapsedSeconds < SAMPLE_WINDOW_SECONDS ||
    nextSample.frames < MIN_SAMPLE_FRAMES
  ) {
    return { sample: nextSample, shouldDegrade: false };
  }

  const framesPerSecond = nextSample.frames / nextSample.elapsedSeconds;

  return {
    sample: createFrameSample(),
    shouldDegrade: framesPerSecond < LOW_FRAME_RATE,
  };
}

export function getSceneRenderBudget(
  mode: DynamicSceneMode,
  degraded: boolean,
): SceneRenderBudget {
  return RENDER_BUDGETS[mode][degraded ? "degraded" : "normal"];
}
