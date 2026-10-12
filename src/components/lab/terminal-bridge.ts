/**
 * 终端 iframe 与外层场景之间的消息桥。
 *
 * iframe 会吞掉落在它身上的指针和键盘事件，外层拿不到，所以镜头没法知道
 * 访客什么时候离开了屏幕、什么时候按了 Esc。Henry Heffernan 的做法是让内层
 * 站点把原始鼠标事件 postMessage 给外层，外层再按缩放比例把坐标重建一遍。
 *
 * 这里换一种口径：内层只上报语义事件（进入、离开、按键），不上报坐标。
 * 外层要的本来就是状态而不是像素，少一层坐标换算就少一处会错位的地方。
 * 协议走 postMessage 而不是同源直接读 contentDocument，这样内层页将来换到
 * 别的域名单独部署也不用改外层。
 */

import { type StageKey, stageOnEscape, stageOnPanelHover } from "./camera-rig";

export const BRIDGE_SOURCE = "latent-terminal";

export type BridgeMessage =
  /** 内层页挂载完成。 */
  | { type: "ready" }
  /** 指针进入屏幕区域。 */
  | { type: "pointerenter" }
  /** 指针离开屏幕区域。 */
  | { type: "pointerleave" }
  /** 内层按键，只转发对镜头有意义的那几个。 */
  | { type: "key"; key: string };

/** 外层只认这几个按键，其余的留给内层页自己处理。 */
export const FORWARDED_KEYS: readonly string[] = ["Escape"];

export function encodeBridgeMessage(message: BridgeMessage): Record<string, unknown> {
  return { source: BRIDGE_SOURCE, ...message };
}

/**
 * 解析收到的 postMessage 负载。
 *
 * 页面里可能跑着别的脚本，window 上什么消息都有，所以结构校验严一点，
 * 认不出来就返回 null，让调用方直接忽略。
 */
export function parseBridgeMessage(data: unknown): BridgeMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const payload = data as Record<string, unknown>;
  if (payload.source !== BRIDGE_SOURCE) return null;

  switch (payload.type) {
    case "ready":
    case "pointerenter":
    case "pointerleave":
      return { type: payload.type };
    case "key":
      return typeof payload.key === "string" ? { type: "key", key: payload.key } : null;
    default:
      return null;
  }
}

/**
 * 把一条桥消息翻译成机位。
 *
 * 指针进出屏幕走和外层射线检测同一套规则，两条路径得出同样的结果，
 * 所以访客从 iframe 边缘滑出去时不会出现镜头反复横跳。
 */
export function stageOnBridgeMessage(current: StageKey, message: BridgeMessage): StageKey {
  switch (message.type) {
    case "pointerenter":
      return stageOnPanelHover(current, true);
    case "pointerleave":
      return stageOnPanelHover(current, false);
    case "key":
      // 终端里敲回车是在跟终端说话，不该把镜头推走，所以只认退出键。
      return message.key === "Escape" ? stageOnEscape(current) : current;
    default:
      return current;
  }
}
