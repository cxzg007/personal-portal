"use client";

import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  DOMAIN_LABEL,
  DOMAIN_LAYER,
  LATENT_DOMAINS,
  type LatentDomain,
  type LatentEntry,
  type LatentHit,
  hitDomains,
  searchLatent,
} from "@/lib/latent-index";

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
 * 页签能点，条目能悬停，按键能响应。外层镜头需要知道的那几件事由
 * terminal-bridge 的协议上报。
 *
 * 这一版起屏幕里放的是真内容。索引在服务端由 content/site-content.json 和
 * MDX 博客构建，经 props 传进来，所以终端和首页说的是同一份事实，不存在
 * 第二处要同步的文案。检索是确定性的关键词与二元组匹配，没有模型也不发请求，
 * 界面上的说法因此一律是"检索命中"而不是"生成"。
 */

type TabKey = "ask" | LatentDomain | "index";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "ask", label: "提问 ask" },
  { key: "profile", label: "身份 profile" },
  { key: "internship", label: "实习 internship" },
  { key: "system", label: "系统 systems" },
  { key: "open-source", label: "开源 oss" },
  { key: "writing", label: "博客 writing" },
  { key: "index", label: "索引 index" },
];

/**
 * 几个真的能问出东西的问题。
 *
 * 空输入框是这个交互最大的门槛——访客不知道该问什么，于是什么都不问。
 * 这几句都在索引里验证过有命中，点一下就能看到一趟完整的往返。
 */
const SUGGESTIONS = [
  "你在京东做了什么",
  "讲讲你的实习经历",
  "Semantica 你贡献了什么",
  "高并发读写怎么设计",
  "怎么联系你",
];

/** 一次提问。revealed 为 false 表示 token 还在外面跑，答案要等它回来。 */
type Exchange = {
  id: number;
  question: string;
  tokens: number;
  hits: LatentHit[];
  revealed: boolean;
};

export default function TerminalUI({ index }: { index: LatentEntry[] }) {
  const [tab, setTab] = useState<TabKey>("ask");
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [peek, setPeek] = useState<LatentEntry | null>(null);
  const postRef = useRef<(message: Parameters<typeof encodeBridgeMessage>[0]) => void>(() => {});
  const embeddedRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  /** 按域分组一次就够，页签之间来回切不必每次重算。 */
  const grouped = useMemo(() => {
    const map = {} as Record<LatentDomain, LatentEntry[]>;
    for (const domain of LATENT_DOMAINS) map[domain] = [];
    for (const entry of index) map[entry.domain].push(entry);
    return map;
  }, [index]);

  useEffect(() => {
    // 对话贴着输入框往上长，新回答出现后要把视线拉回底部，否则它会落在可视区外。
    const main = mainRef.current;
    if (main && tab === "ask") {
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
     * 外层回报 token 已经带着结果回到屏幕，这时才把命中的条目摊开。
     *
     * 答案不是提交的瞬间出现的——它要等那趟路程跑完。这条等待是这个交互的
     * 全部意义：内容看起来是从结构深处被取回来的，而不是本来就在那儿。
     */
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== parentWindow) return;
      const message = parseBridgeMessage(event.data);
      if (message?.type === "open-domain") {
        setTab(message.domain);
        if (mainRef.current) mainRef.current.scrollTop = 0;
      } else if (message?.type === "flight" && message.phase === "returned") {
        setExchanges((previous) =>
          previous.map((item) => (item.revealed ? item : { ...item, revealed: true })),
        );
      }
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

  /**
   * 问一句话。
   *
   * 检索在这里立即完成，命中域随提交一起上报，外层据此决定让 token 穿过哪几层。
   * 但结果先不显示：要么等那趟往返回来，要么——没有命中、或者根本没有外层场景——
   * 当场给出，否则界面会永远停在"检索中"。
   */
  const ask = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    const hits = searchLatent(index, line);
    const tokens = tokenCount(line);
    const immediate = !embeddedRef.current || hits.length === 0;
    setTab("ask");
    setExchanges((previous) => [
      ...previous,
      { id: previous.length, question: line, tokens, hits, revealed: immediate },
    ]);
    setDraft("");
    if (!immediate) postRef.current({ type: "submit", tokens, domains: hitDomains(hits) });
  };

  /** 屏幕里的链接要换掉顶层地址，否则跳转只会换掉这一帧，场景还留在原地。 */
  const navigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!embeddedRef.current) return;
    event.preventDefault();
    postRef.current({ type: "navigate", href });
  };

  const entryCard = (entry: LatentEntry) => (
    <article className={styles.card} key={entry.id}>
      <header className={styles.cardHead}>
        <span className={styles.tag}>{DOMAIN_LABEL[entry.domain]}</span>
        <h3 className={styles.cardTitle}>{entry.title}</h3>
      </header>
      <p className={styles.cardSub}>{entry.subtitle}</p>
      {entry.lines.map((line) => (
        <p className={styles.cardLine} key={line}>
          {line}
        </p>
      ))}
      <a
        className={styles.link}
        href={entry.href}
        onClick={(event) => navigate(event, entry.href)}
      >
        读全文 <span aria-hidden="true">→</span>
      </a>
    </article>
  );

  return (
    <div className={styles.shell} data-bridge={BRIDGE_SOURCE}>
      <header className={styles.head}>
        <span className={styles.headTitle}>LATENT TERMINAL</span>
        <span aria-hidden="true" className={styles.dot} />
        <span className={styles.headMeta}>
          索引 {index.length} 条 · {LATENT_DOMAINS.length} 个内容域 · 确定性检索，无模型
        </span>
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
          {tab === "ask" ? (
            <div className={styles.chat}>
              <div className={styles.boot}>
                <div className={styles.bootRow}>
                  <span>&gt; index built</span>
                  <span>{index.length} entries · site-content.json + mdx</span>
                </div>
                <div className={styles.bootRow}>
                  <span>&gt; domains</span>
                  <span>{LATENT_DOMAINS.map((item) => DOMAIN_LABEL[item]).join(" / ")}</span>
                </div>
                <div className={styles.bootRow}>
                  <span>&gt; retrieval</span>
                  <span>keyword + cjk bigram · deterministic</span>
                </div>
              </div>

              {exchanges.length === 0 ? (
                <div className={styles.intro}>
                  <p className={styles.introLead}>
                    这块屏幕连着的不是模型，是我的经历、项目和博客。问一句话，它会在索引里
                    找出相关的几条，并让这句话穿过存放它们的那几层结构，再把结果带回来。
                  </p>
                  <p className={styles.caption}>试着问 · try asking</p>
                  <div className={styles.chips}>
                    {SUGGESTIONS.map((item) => (
                      <button
                        className={styles.chip}
                        key={item}
                        onClick={() => ask(item)}
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {exchanges.map((item) => (
                <div className={styles.exchange} key={item.id}>
                  <div className={styles.turn}>
                    <span className={styles.speaker}>you</span>
                    <span>{item.question}</span>
                  </div>
                  <div className={styles.turn}>
                    <span className={styles.speaker}>index</span>
                    {item.revealed ? (
                      item.hits.length === 0 ? (
                        <div className={styles.answer}>
                          <p className={styles.replyLine}>
                            索引里没有这一条。这里只放了身份、实习、系统、开源和博客五类内容，
                            换个说法或者直接点下面一个问题试试。
                          </p>
                          <div className={styles.chips}>
                            {SUGGESTIONS.slice(0, 3).map((hint) => (
                              <button
                                className={styles.chip}
                                key={hint}
                                onClick={() => ask(hint)}
                                type="button"
                              >
                                {hint}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.answer}>
                          <p className={styles.replySummary}>
                            命中 {item.hits.length} 条 ·{" "}
                            {hitDomains(item.hits)
                              .map((domain) => DOMAIN_LABEL[domain])
                              .join(" / ")}
                          </p>
                          {item.hits.map((hit, position) => (
                            <article
                              className={styles.hit}
                              key={hit.entry.id}
                              style={{ animationDelay: `${position * 220}ms` }}
                            >
                              <header className={styles.cardHead}>
                                <span className={styles.tag}>
                                  {DOMAIN_LABEL[hit.entry.domain]}
                                </span>
                                <h3 className={styles.cardTitle}>{hit.entry.title}</h3>
                                <span className={styles.score}>score {hit.score}</span>
                              </header>
                              <p className={styles.cardSub}>{hit.entry.subtitle}</p>
                              {hit.entry.lines.map((line) => (
                                <p className={styles.cardLine} key={line}>
                                  {line}
                                </p>
                              ))}
                              <div className={styles.hitFoot}>
                                <span className={styles.matched}>
                                  {hit.matched.length > 0
                                    ? `命中 ${hit.matched.slice(0, 4).join(" · ")}`
                                    : "正文字面重叠命中"}
                                </span>
                                <a
                                  className={styles.link}
                                  href={hit.entry.href}
                                  onClick={(event) => navigate(event, hit.entry.href)}
                                >
                                  读全文 <span aria-hidden="true">→</span>
                                </a>
                              </div>
                            </article>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className={styles.waiting}>
                        检索中 · {item.tokens} tokens 正穿过结构
                        <span aria-hidden="true" className={styles.caret} />
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "profile" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>关于我 · profile · L{DOMAIN_LAYER.profile}</p>
              <div className={styles.cards}>{grouped.profile.map(entryCard)}</div>
            </div>
          ) : null}

          {tab === "internship" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>实习经历 · internships · L{DOMAIN_LAYER.internship}</p>
              <div className={styles.cards}>{grouped.internship.map(entryCard)}</div>
            </div>
          ) : null}

          {tab === "system" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>系统实践 · systems · L{DOMAIN_LAYER.system}</p>
              <div className={styles.cards}>{grouped.system.map(entryCard)}</div>
            </div>
          ) : null}

          {tab === "open-source" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>开源维护与贡献 · open source · L{DOMAIN_LAYER["open-source"]}</p>
              <div className={styles.cards}>{grouped["open-source"].map(entryCard)}</div>
            </div>
          ) : null}

          {tab === "writing" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>技术博客 · writing · L{DOMAIN_LAYER.writing}</p>
              <div className={styles.cards}>{grouped.writing.map(entryCard)}</div>
            </div>
          ) : null}

          {tab === "index" ? (
            <div className={styles.panel}>
              <p className={styles.caption}>
                检索索引本身 · one cell per entry, shaded by alias count
              </p>
              <div className={styles.indexRows}>
                {LATENT_DOMAINS.map((domain) => (
                  <div className={styles.indexRow} key={domain}>
                    <span className={styles.indexLabel}>
                      {DOMAIN_LABEL[domain]}
                      <em>
                        {domain} · L{DOMAIN_LAYER[domain]}
                      </em>
                    </span>
                    <div className={styles.indexCells}>
                      {grouped[domain].map((entry) => (
                        <button
                          aria-label={`${DOMAIN_LABEL[domain]} · ${entry.title}`}
                          className={styles.indexCell}
                          data-active={peek?.id === entry.id ? "true" : undefined}
                          key={entry.id}
                          onFocus={() => setPeek(entry)}
                          onPointerEnter={() => setPeek(entry)}
                          style={{
                            // 深浅就是别名数量，颜色因此是数据而不是装饰
                            background: `rgba(110, 231, 212, ${
                              0.1 + Math.min(entry.keywords.length, 24) / 24 * 0.58
                            })`,
                          }}
                          type="button"
                        />
                      ))}
                    </div>
                    <span className={styles.indexCount}>{grouped[domain].length}</span>
                  </div>
                ))}
              </div>
              <p className={styles.readout}>
                {peek
                  ? `${peek.title} · ${peek.keywords.length} 个别名 · ${peek.haystack.length} 字可检索正文`
                  : "悬停任一格读取条目 · hover a cell"}
              </p>
              <p className={styles.indexNote}>
                左边的 L3 到 L7，就是这块屏幕后面那叠结构的第三到第七层——一个域占一层。
                提问时 token 一路走到最深的那个命中层才掉头，命中的层会亮起来：走多深表示答案
                藏得多深，亮哪几层表示答案在哪儿。索引在服务端由 content/site-content.json
                与 MDX 博客构建，和本站其余部分同出一源。
              </p>
            </div>
          ) : null}
        </main>
      </div>

      <form
        className={styles.prompt}
        onSubmit={(event) => {
          event.preventDefault();
          ask(draft);
        }}
      >
        <span aria-hidden="true" className={styles.promptMark}>
          ›
        </span>
        <input
          aria-label="向索引提问"
          className={styles.promptInput}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="问我的经历、项目或博客，看它从哪一层取回来…"
          value={draft}
        />
        <span className={styles.promptHint}>Enter 检索 · Esc 退出终端</span>
      </form>
    </div>
  );
}
