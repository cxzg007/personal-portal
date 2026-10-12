import { describe, expect, it } from "vitest";

import {
  BRIDGE_SOURCE,
  encodeBridgeMessage,
  parseBridgeMessage,
  stageOnBridgeMessage,
} from "./terminal-bridge";

describe("parseBridgeMessage", () => {
  it("认出自己发的消息", () => {
    expect(parseBridgeMessage(encodeBridgeMessage({ type: "ready" }))).toEqual({ type: "ready" });
    expect(parseBridgeMessage(encodeBridgeMessage({ type: "pointerenter" }))).toEqual({
      type: "pointerenter",
    });
    expect(parseBridgeMessage(encodeBridgeMessage({ type: "key", key: "Escape" }))).toEqual({
      type: "key",
      key: "Escape",
    });
  });

  it("忽略别处来的消息", () => {
    // React DevTools、浏览器扩展、第三方脚本都会往 window 上丢消息。
    expect(parseBridgeMessage({ source: "react-devtools", type: "ready" })).toBeNull();
    expect(parseBridgeMessage({ type: "pointerenter" })).toBeNull();
    expect(parseBridgeMessage("pointerenter")).toBeNull();
    expect(parseBridgeMessage(null)).toBeNull();
    expect(parseBridgeMessage(undefined)).toBeNull();
  });

  it("结构对不上就丢掉", () => {
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "explode" })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "key" })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "key", key: 27 })).toBeNull();
  });
});

describe("stageOnBridgeMessage", () => {
  it("指针进出屏幕和外层射线检测得出同样的机位", () => {
    expect(stageOnBridgeMessage("approach", { type: "pointerenter" })).toBe("terminal");
    expect(stageOnBridgeMessage("terminal", { type: "pointerleave" })).toBe("approach");
  });

  it("远景时掠过屏幕不触发，避免误操作", () => {
    expect(stageOnBridgeMessage("idle", { type: "pointerenter" })).toBe("idle");
  });

  it("只认退出键，终端里敲回车不动镜头", () => {
    expect(stageOnBridgeMessage("terminal", { type: "key", key: "Escape" })).toBe("approach");
    expect(stageOnBridgeMessage("terminal", { type: "key", key: "Enter" })).toBe("terminal");
    expect(stageOnBridgeMessage("terminal", { type: "key", key: "a" })).toBe("terminal");
  });

  it("ready 不改变机位", () => {
    expect(stageOnBridgeMessage("approach", { type: "ready" })).toBe("approach");
  });
});
