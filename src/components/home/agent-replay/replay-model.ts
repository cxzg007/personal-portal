export type ReplayScenario = "authorized" | "readonly";

export type ReplayState = {
  scenario: ReplayScenario;
  progress: number;
  playing: boolean;
};

export type ReplayAction =
  | { type: "scenario"; scenario: ReplayScenario }
  | { type: "seek"; progress: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "replay" }
  | { type: "tick" };

export const replayStages = [
  { id: "task", label: "接收任务", short: "TASK", progress: 0, title: "任务已进入回放队列", detail: "示例任务：审查代码变更，生成建议并提交审查结果。", event: "TASK_ACCEPTED" },
  { id: "context", label: "检索上下文", short: "CONTEXT", progress: 25, title: "关联变更与项目约定", detail: "读取示例代码差异和审查规则，为每条建议整理依据。", event: "CONTEXT_RETRIEVED" },
  { id: "plan", label: "生成建议", short: "REVIEW", progress: 50, title: "审查建议已整理", detail: "将发现的问题与代码位置关联，等待写入权限校验。", event: "REVIEW_PREPARED" },
  { id: "policy", label: "权限校验", short: "POLICY", progress: 75, title: "允许写入审查结果", detail: "当前具有写入权限，审查结果可以进入提交阶段。", event: "WRITE_AUTHORIZED" },
  { id: "result", label: "提交结果", short: "RESULT", progress: 100, title: "审查结果已提交（示例）", detail: "执行轨迹已结束，审查建议与引用依据一同保存在示例结果中。", event: "RESULT_SUBMITTED" },
] as const;

export const initialReplayState: ReplayState = {
  scenario: "authorized",
  progress: 0,
  playing: false,
};

export function replayEnd(scenario: ReplayScenario): number {
  return scenario === "readonly" ? 75 : 100;
}

export function replayReducer(state: ReplayState, action: ReplayAction): ReplayState {
  switch (action.type) {
    case "scenario":
      return { scenario: action.scenario, progress: 0, playing: false };
    case "seek":
      return { ...state, progress: Math.min(replayEnd(state.scenario), Math.max(0, action.progress)), playing: false };
    case "play":
      return { ...state, playing: state.progress < replayEnd(state.scenario) };
    case "pause":
      return state.playing ? { ...state, playing: false } : state;
    case "replay":
      return { ...state, progress: 0, playing: true };
    case "tick": {
      if (!state.playing) return state;
      const progress = Math.min(state.progress + 1, replayEnd(state.scenario));
      return { ...state, progress, playing: progress < replayEnd(state.scenario) };
    }
  }
}

export function replayProjection(state: ReplayState) {
  const stageIndex = Math.min(4, Math.floor(state.progress / 25));
  const stage = replayStages[stageIndex];
  const blocked = state.scenario === "readonly" && state.progress >= 75;
  return {
    stageIndex,
    stage,
    blocked,
    ended: state.progress >= replayEnd(state.scenario),
    title: blocked ? "写入已阻断" : stage.title,
    detail: blocked ? "当前为只读权限。审查建议已保留，提交结果未执行。" : stage.detail,
    event: blocked ? "WRITE_BLOCKED" : stage.event,
  };
}
