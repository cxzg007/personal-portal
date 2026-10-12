import { describe, expect, it } from "vitest";

import {
  BOOT_STEPS,
  advanceBoot,
  bootProgress,
  bootStepStatus,
  createBootState,
  isBootComplete,
} from "./boot-sequence";

describe("载入进度", () => {
  it("从 0 开始，全部做完正好到 1", () => {
    const empty = createBootState();
    expect(bootProgress(empty)).toBe(0);
    expect(isBootComplete(empty)).toBe(false);

    let state = empty;
    for (const step of BOOT_STEPS) state = advanceBoot(state, step.key, step.total);
    expect(bootProgress(state)).toBe(1);
    expect(isBootComplete(state)).toBe(true);
  });

  it("单调递增", () => {
    let state = createBootState();
    let previous = 0;
    for (const step of BOOT_STEPS) {
      for (let unit = 0; unit < step.total; unit += 1) {
        state = advanceBoot(state, step.key);
        const current = bootProgress(state);
        expect(current).toBeGreaterThan(previous);
        previous = current;
      }
    }
  });

  it("重复上报不会把进度推过头", () => {
    // 场景可能被重建，同一层有机会报两次，多报的要被吃掉。
    let state = createBootState();
    state = advanceBoot(state, "weights", 99);
    expect(state.weights).toBe(7);
    expect(bootProgress(state)).toBeLessThan(1);
    expect(isBootComplete(state)).toBe(false);
  });

  it("只差一步就不算完成", () => {
    let state = createBootState();
    state = advanceBoot(state, "tokenizer", 1);
    state = advanceBoot(state, "weights", 7);
    expect(isBootComplete(state)).toBe(false);
    state = advanceBoot(state, "cache", 1);
    expect(isBootComplete(state)).toBe(true);
  });

  it("认不出来的步骤原样返回", () => {
    const state = createBootState();
    // @ts-expect-error 故意传一个不存在的步骤
    expect(advanceBoot(state, "nonexistent")).toBe(state);
  });
});

describe("日志行状态", () => {
  it("多分片的那步显示计数，做完换成附注", () => {
    const weights = BOOT_STEPS.find((step) => step.key === "weights")!;
    let state = createBootState();
    expect(bootStepStatus(weights, state)).toBe("0/7");
    state = advanceBoot(state, "weights", 3);
    expect(bootStepStatus(weights, state)).toBe("3/7");
    state = advanceBoot(state, "weights", 4);
    expect(bootStepStatus(weights, state)).toBe("bf16");
  });

  it("单步的那些在做完前只显示省略号", () => {
    const tokenizer = BOOT_STEPS.find((step) => step.key === "tokenizer")!;
    const state = createBootState();
    expect(bootStepStatus(tokenizer, state)).toBe("…");
    expect(bootStepStatus(tokenizer, advanceBoot(state, "tokenizer"))).toBe("vocab 128k");
  });
});
