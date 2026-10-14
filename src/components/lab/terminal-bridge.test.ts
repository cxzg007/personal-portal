import { describe, expect, it } from "vitest";

import {
  BRIDGE_SOURCE,
  type BridgeMessage,
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
  it("选择内容域只切内层页面，不移动外层机位", () => {
    expect(
      parseBridgeMessage(encodeBridgeMessage({ type: "open-domain", domain: "internship" })),
    ).toEqual({ type: "open-domain", domain: "internship" });
    expect(
      parseBridgeMessage({ source: BRIDGE_SOURCE, type: "open-domain", domain: "unknown" }),
    ).toBeNull();
    expect(
      parseBridgeMessage({ source: BRIDGE_SOURCE, type: "open-domain", domain: "__proto__" }),
    ).toBeNull();
    expect(stageOnBridgeMessage("terminal", { type: "open-domain", domain: "writing" })).toBe(
      "terminal",
    );
  });
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

describe("提交与前向传播", () => {
  it("提交带上 token 数量和命中域，往返都能解析", () => {
    expect(
      parseBridgeMessage(
        encodeBridgeMessage({ type: "submit", tokens: 9, domains: ["internship", "open-source"] }),
      ),
    ).toEqual({
      type: "submit",
      tokens: 9,
      domains: ["internship", "open-source"],
    });
    expect(
      parseBridgeMessage(encodeBridgeMessage({ type: "flight", phase: "returned" })),
    ).toEqual({ type: "flight", phase: "returned" });
  });

  it("数量不合法就丢掉：它会被直接拿去开缓冲区", () => {
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit" })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit", tokens: 0 })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit", tokens: -4 })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit", tokens: 3.7 })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit", tokens: "9" })).toBeNull();
    // 域名缺失当成协议不符：说明发消息的不是我们这版内层页。
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "submit", tokens: 6 })).toBeNull();
  });

  it("认不出的域名被滤掉，整条提交还算有效", () => {
    expect(
      parseBridgeMessage({
        source: BRIDGE_SOURCE,
        type: "submit",
        tokens: 6,
        domains: ["internship", "weather", "internship"],
      }),
    ).toEqual({ type: "submit", tokens: 6, domains: ["internship"] });
  });

  it("跳转只放站内绝对路径过去", () => {
    expect(parseBridgeMessage(encodeBridgeMessage({ type: "navigate", href: "/#open-source" }))).toEqual({
      type: "navigate",
      href: "/#open-source",
    });
    // 协议相对地址在浏览器眼里是外站，只判断开头是斜杠会把它漏进来。
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "navigate", href: "//evil.example" })).toBeNull();
    expect(
      parseBridgeMessage({ source: BRIDGE_SOURCE, type: "navigate", href: "https://evil.example" }),
    ).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "navigate" })).toBeNull();
  });

  it("认不出的相位不放行", () => {
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "flight", phase: "boom" })).toBeNull();
    expect(parseBridgeMessage({ source: BRIDGE_SOURCE, type: "flight" })).toBeNull();
  });

  it("只有贴在终端上提交才把镜头推开", () => {
    const submit: BridgeMessage = { type: "submit", tokens: 6, domains: [] };
    expect(stageOnBridgeMessage("terminal", submit)).toBe("forward");
    // 传播途中又提交一次，镜头不该重新起跳；是否受理由场景那边决定。
    expect(stageOnBridgeMessage("forward", submit)).toBe("forward");
    expect(stageOnBridgeMessage("idle", submit)).toBe("idle");
  });

  it("跳转不改机位：页面马上就要被换掉了", () => {
    expect(stageOnBridgeMessage("terminal", { type: "navigate", href: "/#internships" })).toBe(
      "terminal",
    );
  });

  it("传播途中指针扫过面板不会把镜头拽回终端", () => {
    expect(stageOnBridgeMessage("forward", { type: "pointerenter" })).toBe("forward");
    expect(stageOnBridgeMessage("forward", { type: "pointerleave" })).toBe("forward");
  });

  it("传播途中按 Esc 可以退回中景", () => {
    expect(stageOnBridgeMessage("forward", { type: "key", key: "Escape" })).toBe("approach");
  });
});
