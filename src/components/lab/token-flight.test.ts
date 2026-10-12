import { describe, expect, it } from "vitest";

import {
  FLIGHT,
  FLIGHT_DURATION,
  flightPhase,
  launchOffset,
  nearestOf,
  planFlight,
  samplePath,
  tokenCount,
  tokenProgress,
  travelProgress,
} from "./token-flight";

const layers = [
  [
    { x: 0, y: 0, z: -14 },
    { x: 4, y: 1, z: -14 },
  ],
  [
    { x: 0, y: 0, z: -42 },
    { x: -3, y: 2, z: -42 },
  ],
];

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("tokenCount", () => {
  it("空串不发射", () => {
    expect(tokenCount("")).toBe(0);
    expect(tokenCount("   ")).toBe(0);
  });

  it("卡住上下限", () => {
    expect(tokenCount("嗯")).toBe(4);
    expect(tokenCount("字".repeat(200))).toBe(14);
  });

  it("长句子派出更多", () => {
    expect(tokenCount("把这段结构讲清楚")).toBeGreaterThan(tokenCount("讲讲"));
  });
});

describe("nearestOf", () => {
  it("在候选里挑离上一个点最近的，轨迹才是顺着走的", () => {
    const layer = [
      { x: -40, y: 0, z: -14 },
      { x: 40, y: 0, z: -14 },
    ];
    expect(nearestOf(layer, { x: -30, y: 0, z: 0 }, sequence([0.9, 0.1]), 2).x).toBe(-40);
    expect(nearestOf(layer, { x: 30, y: 0, z: 0 }, sequence([0.1, 0.9]), 2).x).toBe(40);
  });
});

describe("planFlight", () => {
  it("从屏幕出发，穿过每一层，再回到同一个点", () => {
    const [path] = planFlight(layers, sequence([0.5]), 1);
    // 起点 + 去程两层 + 回程两层 + 终点
    expect(path).toHaveLength(6);
    expect(path[0].z).toBeCloseTo(0.3);
    expect(path[0]).toEqual(path[path.length - 1]);
    expect(path[1].z).toBe(-14);
    expect(path[2].z).toBe(-42);
    // 回程层序相反
    expect(path[3].z).toBe(-42);
    expect(path[4].z).toBe(-14);
  });

  it("跳过空层，不会取到 undefined", () => {
    const [path] = planFlight([[], layers[0]], sequence([0.4]), 1);
    expect(path.every((point) => typeof point.z === "number")).toBe(true);
    expect(path).toHaveLength(4);
  });

  it("要几条给几条", () => {
    expect(planFlight(layers, sequence([0.1, 0.9, 0.3]), 5)).toHaveLength(5);
  });
});

describe("samplePath", () => {
  const path = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 10, y: 10, z: 0 },
  ];

  it("两端取到端点", () => {
    expect(samplePath(path, 0)).toEqual({ x: 0, y: 0, z: 0 });
    expect(samplePath(path, 1)).toEqual({ x: 10, y: 10, z: 0 });
  });

  it("中点落在折点上", () => {
    expect(samplePath(path, 0.5)).toEqual({ x: 10, y: 0, z: 0 });
  });

  it("越界不抛错", () => {
    expect(samplePath(path, -3)).toEqual({ x: 0, y: 0, z: 0 });
    expect(samplePath(path, 9)).toEqual({ x: 10, y: 10, z: 0 });
    expect(samplePath([], 0.5)).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("时序", () => {
  it("相位按顺序推进，并且会结束", () => {
    expect(flightPhase(0)).toBe("travel");
    expect(flightPhase(FLIGHT.travel - 1)).toBe("travel");
    expect(flightPhase(FLIGHT.travel)).toBe("settle");
    expect(flightPhase(FLIGHT_DURATION)).toBe("done");
    expect(flightPhase(FLIGHT_DURATION + 10_000)).toBe("done");
  });

  it("进度钳在 0 到 1", () => {
    expect(travelProgress(-50)).toBe(0);
    expect(travelProgress(FLIGHT.travel / 2)).toBeCloseTo(0.5);
    expect(travelProgress(FLIGHT.travel * 3)).toBe(1);
  });
});

describe("逐个出发", () => {
  it("第一个不等，最后一个等得最久", () => {
    expect(launchOffset(0, 8)).toBe(0);
    expect(launchOffset(7, 8)).toBeCloseTo(0.22);
    expect(launchOffset(0, 1)).toBe(0);
  });

  it("最后一个也要在总时长内跑完", () => {
    expect(tokenProgress(FLIGHT.travel, 7, 8)).toBe(1);
    expect(tokenProgress(FLIGHT.travel, 0, 8)).toBe(1);
  });

  it("还没轮到就停在起点", () => {
    expect(tokenProgress(0, 7, 8)).toBe(0);
    expect(tokenProgress(FLIGHT.travel * 0.1, 7, 8)).toBe(0);
    expect(tokenProgress(FLIGHT.travel * 0.1, 0, 8)).toBeGreaterThan(0);
  });
});
