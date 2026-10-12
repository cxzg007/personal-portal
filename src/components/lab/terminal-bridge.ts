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
 *
 * 第四阶段起这条通道是双向的：内层把提交上报给外层，外层把前向传播的相位回报
 * 给内层。两个方向共用同一套消息格式和同一个解析函数——方向不同但面临的问题
 * 一样（window 上什么消息都有），没必要维护两份校验。
 */

import { LATENT_DOMAINS, type LatentDomain } from "@/lib/latent-index";

import { type StageKey, stageOnEscape, stageOnPanelHover } from "./camera-rig";

export const BRIDGE_SOURCE = "latent-terminal";

/** 外层发回内层的两个节点：出发、带着结果回到屏幕。 */
export type FlightSignal = "launched" | "returned";

const FLIGHT_SIGNALS: readonly string[] = ["launched", "returned"];

export type BridgeMessage =
  /** 内层页挂载完成。 */
  | { type: "ready" }
  /** 指针进入屏幕区域。 */
  | { type: "pointerenter" }
  /** 指针离开屏幕区域。 */
  | { type: "pointerleave" }
  /** 内层按键，只转发对镜头有意义的那几个。 */
  | { type: "key"; key: string }
  /**
   * 内层提交了一句话：token 数决定派多少个光点，命中域决定它们穿过哪几层。
   * 检索在内层做完才上报，外层不需要再认识内容，只负责把这条路走出来。
   */
  | { type: "submit"; tokens: number; domains: LatentDomain[] }
  /**
   * 内层的链接要跳转。
   *
   * iframe 里直接 <a> 跳转只会换掉屏幕里那一帧，外面的场景还留在原地，
   * 访客会看到一个套在三维壳子里的普通页面。所以链接交给外层换顶层地址。
   */
  | { type: "navigate"; href: string }
  /** 外层回报前向传播走到了哪一步，内层据此决定什么时候开始吐字。 */
  | { type: "flight"; phase: FlightSignal };

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
    case "submit": {
      const tokens = payload.tokens;
      // 数量会直接拿去开缓冲区，非整数或负数必须在进场前就挡掉。
      if (typeof tokens !== "number" || !Number.isInteger(tokens) || tokens <= 0) return null;
      const raw = payload.domains;
      if (!Array.isArray(raw)) return null;
      // 认不出的域名直接丢掉而不是整条作废：外层只拿它去挑层，多一个少一个
      // 无非是少点亮一层，为此把整次提交吞掉反而更糟。
      const domains = raw.filter((item): item is LatentDomain =>
        LATENT_DOMAINS.includes(item as LatentDomain),
      );
      return { type: "submit", tokens, domains: [...new Set(domains)] };
    }
    case "navigate": {
      const href = payload.href;
      if (typeof href !== "string") return null;
      // 只放站内绝对路径过去。"//example.com" 在浏览器眼里是协议相对的外站地址，
      // 光判断开头是斜杠会把它漏进来。
      if (!href.startsWith("/") || href.startsWith("//")) return null;
      return { type: "navigate", href };
    }
    case "flight":
      return typeof payload.phase === "string" && FLIGHT_SIGNALS.includes(payload.phase)
        ? { type: "flight", phase: payload.phase as FlightSignal }
        : null;
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
    case "submit":
      // 提交时镜头退开，让人看见这句话要穿过去的是什么。前向传播进行中再提交
      // 不改变机位，由场景那边决定要不要受理。
      return current === "terminal" ? "forward" : current;
    default:
      return current;
  }
}
