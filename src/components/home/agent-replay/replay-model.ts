export type ReplayScenario = "authorized" | "readonly" | "conflict";

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
  { id: "task", label: "Agent 任务", short: "TASK", progress: 0, title: "供应商资质审核任务已接收", detail: "虚构任务：检查供应商资质是否过期，预览风险标记的写回计划。", event: "TASK_ACCEPTED" },
  { id: "context", label: "本体映射", short: "ONTOLOGY", progress: 25, title: "从业务属性定位数据", detail: "Agent 仅提交属性编码；服务端解析供应商、资质与关联关系，确定物理字段和 JOIN 路径。", event: "ONTOLOGY_RESOLVED" },
  { id: "plan", label: "规则编译", short: "COMPILE", progress: 50, title: "规则已编译为执行计划", detail: "服务端同步生成 SQL 与绑定参数，处理一对多关联的聚合边界，形成可预览的计划。", event: "RULE_COMPILED" },
  { id: "policy", label: "执行校验", short: "VALIDATE", progress: 75, title: "写回条件校验通过", detail: "示例计划已人工确认；写权限与配置指纹均通过校验，允许进入事务。", event: "EXECUTION_VALIDATED" },
  { id: "result", label: "事务写回", short: "COMMIT", progress: 100, title: "风险标记已写回（示例）", detail: "单个事务内逐条检查影响行数，全部符合预期后提交，并保留执行轨迹。", event: "TRANSACTION_COMMITTED" },
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
  const rolledBack = state.scenario === "conflict" && state.progress === 100;
  return {
    stageIndex,
    stage,
    blocked,
    rolledBack,
    failed: blocked || rolledBack,
    ended: state.progress >= replayEnd(state.scenario),
    title: blocked ? "写入已阻断" : rolledBack ? "整批写回已回滚" : stage.title,
    detail: blocked ? "当前为只读权限。执行计划可查看，事务写回未执行。" : rolledBack ? "示例中一条写入的影响行数不等于 1，触发整个事务回滚；0 条变更生效。" : stage.detail,
    event: blocked ? "WRITE_BLOCKED" : rolledBack ? "TRANSACTION_ROLLED_BACK" : stage.event,
  };
}
