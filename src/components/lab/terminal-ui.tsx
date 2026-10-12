"use client";

import { useEffect, useRef, useState } from "react";

import {
  BRIDGE_SOURCE,
  FORWARDED_KEYS,
  encodeBridgeMessage,
  parseBridgeMessage,
} from "./terminal-bridge";
import { tokenCount } from "./token-flight";
import styles from "./terminal-ui.module.css";

/**
 * 终端屏幕里的真网页。
 *
 * 它通过 iframe 嵌在三维场景的面板位置上，所以这里不是贴图而是真 DOM：
 * 标签页能点，热图格子能悬停，按键能响应。外层镜头需要知道的那几件事
 * 由 terminal-bridge 的协议上报。
 */

type TabKey = "chat" | "attn" | "logits" | "trace";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "chat", label: "对话 chat" },
  { key: "attn", label: "注意力 attn" },
  { key: "logits", label: "概率 logits" },
  { key: "trace", label: "日志 trace" },
];

const BOOT = [
  ["> tokenizer ready", "vocab 128k"],
  ["> weights  8/8 shards", "bf16"],
  ["> kv cache warm", "ctx 32768"],
];

/** 模型那段回答逐行给出，配合下面的 token 流，让对话页不至于下半屏空着。 */
const ANSWER = [
  "这叠半透明的面是模型的层，每一面上的点是该层的隐藏单元。",
  "面与面之间的连线是权重，沿线跑的光点是一次前向里流过去的激活。",
  "你现在看到的这块屏幕不是贴图，是一张真网页，被放在层与层之间。",
];

/** 正在生成的那串 token，用来表现采样是一个一个往外吐的。 */
const STREAM = ["沿着", "注意力", "路径", "逐层", "展开"];

/**
 * 一次提问的回答。
 *
 * 内容写的就是外面刚刚发生的事：这几个 token 确实从这块屏幕出发，穿过了那几层，
 * 又回到了这里。模型是假的，但这趟路程是真跑了一遍的，所以这段话不算谎话。
 */
function replyFor(tokens: number): string[] {
  return [
    `这句话被切成 ${tokens} 个 token，刚才从这块屏幕送了出去。`,
    "它们逐层穿过权重，在最深的一层掉头，再沿另一条路回来。",
    "你看到的那趟路程，就是这次回答的全部来历。",
  ];
}

/** 一问一答。reply 为 null 表示 token 还在外面跑。 */
type Exchange = { id: number; question: string; tokens: number; reply: string[] | null };

const ROWS = 12;
const COLS = 24;

/** 注意力权重：确定性的伪随机，每次打开图案一致，方便比对设计改动。 */
function attentionWeight(row: number, col: number) {
  return Math.abs(Math.sin(row * 1.7 + col * 0.63)) * Math.abs(Math.cos(col * 0.21 + row * 0.4));
}

const LOGITS = [
  { token: "注意力", value: 0.82 },
  { token: "路径", value: 0.54 },
  { token: "权重", value: 0.37 },
  { token: "残差", value: 0.21 },
  { token: "归一化", value: 0.12 },
];

const TRACE = [
  { stage: "embed", share: 0.08, cost: "1.2 ms" },
  { stage: "attn ×32", share: 0.54, cost: "8.4 ms" },
  { stage: "mlp ×32", share: 0.3, cost: "4.6 ms" },
  { stage: "norm", share: 0.04, cost: "0.6 ms" },
  { stage: "sample", share: 0.04, cost: "0.5 ms" },
];

export default function TerminalUI() {
  const [tab, setTab] = useState<TabKey>("chat");
  const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null);
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const postRef = useRef<(message: Parameters<typeof encodeBridgeMessage>[0]) => void>(() => {});
  const embeddedRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 对话贴着输入框往上长，新回答出现后要把视线拉回底部，否则它会落在可视区外。
    const main = mainRef.current;
    if (main && tab === "chat") {
      main.scrollTop = main.scrollHeight;
    }
  }, [exchanges, tab]);

  useEffect(() => {
    // 顶层打开这个路由时没有父窗口可通知，直接退化成一个普通页面。
    const parentWindow = window.parent;
    const embedded = parentWindow !== window;
    embeddedRef.current = embedded;

    const post = (message: Parameters<typeof encodeBridgeMessage>[0]) => {
      if (!embedded) return;
      parentWindow.postMessage(encodeBridgeMessage(message), window.location.origin);
    };
    postRef.current = post;

    if (!embedded) return;

    post({ type: "ready" });

    // 指针进出整个文档就等于进出屏幕，iframe 的边界就是屏幕的边界。
    const onEnter = () => post({ type: "pointerenter" });
    const onLeave = () => post({ type: "pointerleave" });
    const onKeyDown = (event: KeyboardEvent) => {
      if (FORWARDED_KEYS.includes(event.key)) post({ type: "key", key: event.key });
    };

    /**
     * 外层回报 token 已经带着结果回到屏幕，这时才开始吐字。
     *
     * 回答不是提交的瞬间出现的——它要等那趟路程跑完。这条等待是这个交互的
     * 全部意义：答案看起来是被带回来的，而不是本来就在那儿。
     */
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = parseBridgeMessage(event.data);
      if (message?.type !== "flight" || message.phase !== "returned") return;
      setExchanges((previous) =>
        previous.map((item) =>
          item.reply ? item : { ...item, reply: replyFor(item.tokens) },
        ),
      );
    };

    document.addEventListener("pointerenter", onEnter);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);

    return () => {
      document.removeEventListener("pointerenter", onEnter);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <div className={styles.shell} data-bridge={BRIDGE_SOURCE}>
      <header className={styles.head}>
        <span className={styles.headTitle}>LATENT TERMINAL</span>
        <span aria-hidden="true" className={styles.dot} />
        <span className={styles.headMeta}>attached · 32 layers · bf16</span>
      </header>

      <div className={styles.body}>
        <nav aria-label="终端视图" className={styles.nav} role="tablist">
          {TABS.map((item) => (
            <button
              aria-selected={tab === item.key}
              className={styles.navItem}
              key={item.key}
              onClick={() => setTab(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className={styles.main} ref={mainRef}>
          {tab === "chat" ? (
            <div className={styles.chat}>
              <div className={styles.boot}>
                {BOOT.map(([left, right]) => (
                  <div className={styles.bootRow} key={left}>
                    <span>{left}</span>
                    <span>{right}</span>
                  </div>
                ))}
              </div>
              <div className={styles.turn}>
                <span className={styles.speaker}>user</span>
                <span>把这段结构讲清楚</span>
              </div>
              <div className={styles.turn}>
                <span className={styles.speaker}>model</span>
                <div className={styles.answer}>
                  {ANSWER.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className={styles.streamLine}>
                    {STREAM.map((token, index) => (
                      <span
                        className={styles.token}
                        key={token}
                        style={{ animationDelay: `${index * 180}ms` }}
                      >
                        {token}
                      </span>
                    ))}
                    <span aria-hidden="true" className={styles.caret} />
                  </p>
                </div>
              </div>
              {exchanges.map((item) => (
                <div key={item.id}>
                  <div className={styles.turn}>
                    <span className={styles.speaker}>user</span>
                    <span>{item.question}</span>
                  </div>
                  <div className={styles.turn}>
                    <span className={styles.speaker}>model</span>
                    {item.reply ? (
                      <div className={styles.answer}>
                        {item.reply.map((line, index) => (
                          <p
                            className={styles.replyLine}
                            key={line}
                            style={{ animationDelay: `${index * 260}ms` }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.waiting}>
                        前向计算中 · {item.tokens} tokens in flight
                        <span aria-hidden="true" className={styles.caret} />
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <p className={styles.status}>
                sampling · top-p 0.92 · temp 0.7 · 已生成 {ANSWER.length * 24 + STREAM.length} tokens
              </p>
            </div>
          ) : null}

          {tab === "attn" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>一次前向里各层各头的激活强度 · activation per layer × head</p>
              <div className={styles.grid}>
                {Array.from({ length: ROWS * COLS }, (_, index) => {
                  const row = Math.floor(index / COLS);
                  const col = index % COLS;
                  const weight = attentionWeight(row, col);
                  return (
                    <button
                      aria-label={`层 ${row + 1} 头 ${col + 1}，权重 ${weight.toFixed(2)}`}
                      className={styles.cell}
                      key={index}
                      onFocus={() => setHovered({ row, col })}
                      onPointerEnter={() => setHovered({ row, col })}
                      style={{ background: `rgba(110, 231, 212, ${0.08 + weight * 0.72})` }}
                      type="button"
                    />
                  );
                })}
              </div>
              <p className={styles.readout}>
                {hovered
                  ? `layer ${hovered.row + 1} · head ${hovered.col + 1} · w=${attentionWeight(hovered.row, hovered.col).toFixed(3)}`
                  : "悬停任意格子读取权重 · hover a cell"}
              </p>
            </div>
          ) : null}

          {tab === "logits" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>下一个 token 的候选分布 · next-token distribution</p>
              <div className={styles.bars}>
                {LOGITS.map((item) => (
                  <div className={styles.bar} key={item.token}>
                    <span>{item.token}</span>
                    <span className={styles.track}>
                      <span className={styles.fill} style={{ width: `${item.value * 100}%` }} />
                    </span>
                    <span className={styles.value}>{item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "trace" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>单次前向的耗时分解 · forward pass breakdown</p>
              <div className={styles.trace}>
                {TRACE.map((item) => (
                  <div className={styles.traceRow} key={item.stage}>
                    <span className={styles.traceStage}>{item.stage}</span>
                    <span className={styles.traceBar} style={{ width: `${item.share * 100}%` }} />
                    <span className={styles.traceCost}>{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <form
        className={styles.prompt}
        onSubmit={(event) => {
          event.preventDefault();
          const line = draft.trim();
          if (!line) return;
          const tokens = tokenCount(line);
          setTab("chat");
          // 单独打开这个路由时外面没有场景跑这趟，答案直接给出来，
          // 不然页面会永远停在"前向计算中"。
          const standalone = !embeddedRef.current;
          setExchanges((previous) => [
            ...previous,
            { id: previous.length, question: line, tokens, reply: standalone ? replyFor(tokens) : null },
          ]);
          setDraft("");
          if (!standalone) postRef.current({ type: "submit", tokens });
        }}
      >
        <span aria-hidden="true" className={styles.promptMark}>
          ›
        </span>
        <input
          aria-label="向模型提问"
          className={styles.promptInput}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="问点什么，看它从哪一层出来…"
          value={draft}
        />
        <span className={styles.promptHint}>Enter 发送 · Esc 退出终端</span>
      </form>
    </div>
  );
}
