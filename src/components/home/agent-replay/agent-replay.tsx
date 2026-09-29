"use client";

import { useEffect, useId, useReducer, useRef, useSyncExternalStore, type CSSProperties } from "react";

import { initialReplayState, replayProjection, replayReducer, replayStages } from "./replay-model";
import styles from "./agent-replay.module.css";

const subscribeToHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

const nodePositions = [
  { x: 137, y: 223 },
  { x: 249, y: 169 },
  { x: 361, y: 220 },
  { x: 473, y: 167 },
  { x: 584, y: 218 },
];

function StageGlyph({ index }: { index: number }) {
  if (index === 0) return <><path d="M-9-12H4l6 6v18H-9Z" /><path d="M3-12v7h7M-4 1h9M-4 6h6" /></>;
  if (index === 1) return <><ellipse cx="-2" cy="-9" rx="10" ry="4" /><path d="M-12-9V6c0 6 20 6 20 0V-9M-12-2c0 5 20 5 20 0" /><circle cx="7" cy="7" r="5" /><path d="m11 11 5 5" /></>;
  if (index === 2) return <><path d="m-10-7-6 7 6 7M10-7l6 7-6 7M4-12l-8 24" /><path d="M-2-17h4" /></>;
  if (index === 3) return <><path d="M0-14 12-9v9C12 7 6 12 0 15-6 12-12 7-12 0v-9Z" /><path d="m-5 0 4 4 7-8" /></>;
  return <><path d="M-12-8h8l4-4h12V12h-24Z" /><path d="m-5 1 4 4 7-7" /></>;
}

function ReplayScene({ active, blocked, playing, id }: { active: number; blocked: boolean; playing: boolean; id: string }) {
  return (
    <svg aria-hidden="true" className={styles.scene} viewBox="0 0 720 370" fill="none">
      <defs>
        <linearGradient id={`${id}-surface`} x1="360" y1="70" x2="360" y2="351" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e2a3a" /><stop offset="1" stopColor="#131b25" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="58" y1="200" x2="676" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2c405b" /><stop offset=".48" stopColor="#617eaa" /><stop offset="1" stopColor="#2c405b" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor="#548aff" stopOpacity=".2" /><stop offset="1" stopColor="#548aff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="364" cy="253" rx="317" ry="113" fill={`url(#${id}-light)`} />
      <path d="M44 207 358 57 680 203v17L368 369 44 223Z" fill="#0c1016" />
      <path d="m44 207 324 150v12L44 223Z" fill="#1b2635" />
      <path d="m368 357 312-154v17L368 369Z" fill="#111923" />
      <path d="M44 207 358 57 680 203 368 357Z" fill={`url(#${id}-surface)`} stroke={`url(#${id}-edge)`} />
      <g stroke="#536d91" strokeWidth=".7" opacity=".19">
        {Array.from({ length: 9 }, (_, index) => {
          const fraction = (index + 1) / 10;
          return <g key={index}>
            <path d={`M${44 + 314 * fraction} ${207 - 150 * fraction} ${368 + 312 * fraction} ${357 - 154 * fraction}`} />
            <path d={`M${44 + 324 * fraction} ${207 + 150 * fraction} ${358 + 322 * fraction} ${57 + 146 * fraction}`} />
          </g>;
        })}
      </g>
      <path d="m69 211 299 138 286-141" stroke="#58779f" strokeOpacity=".4" />
      <path d="m299 91 60-29 75 34" stroke="#8ab4ff" strokeOpacity=".65" />
      <text x="365" y="91" textAnchor="middle" className={styles.deckLabel}>EXECUTION WORKBENCH</text>
      <g className={styles.connections}>
        {nodePositions.slice(0, -1).map((position, index) => {
          const next = nodePositions[index + 1];
          return <g key={index} data-reached={active > index} data-blocked={blocked && index === 3}>
            <path d={`M${position.x} ${position.y + 8} ${next.x} ${next.y + 8}`} className={styles.connectionTrack} />
            <path d={`M${position.x} ${position.y + 8} ${next.x} ${next.y + 8}`} className={`${styles.connectionLine} ${playing && active === index ? styles.connectionFlow : ""}`} />
            <circle cx={(position.x + next.x) / 2} cy={(position.y + next.y) / 2 + 8} r="3" className={styles.connectionDot} />
          </g>;
        })}
      </g>
      {nodePositions.map(({ x, y }, index) => (
        <g key={index} transform={`translate(${x} ${y})`} className={styles.node} data-active={active === index} data-reached={active >= index} data-blocked={blocked && index === 3}>
          <ellipse cy="15" rx="50" ry="20" fill="#080d15" opacity=".42" />
          <path d="M-43-5 0 16 43-5 0-26Z" className={styles.nodeFoot} />
          <path d="M-36-19 0-1 36-19V3L0 21-36 3Z" className={styles.nodeFront} />
          <path d="M0-1 36-19V3L0 21Z" className={styles.nodeSide} />
          <path d="M-36-19 0-37 36-19 0-1Z" className={styles.nodeTop} />
          <path d="M-28-19 0-33 28-19 0-5Z" className={styles.nodeInset} />
          <path d="M0-28v-14" className={styles.nodeStem} />
          <g transform="translate(0 -59)" className={styles.glyph} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <StageGlyph index={index} />
          </g>
          <circle cy="-88" r="3" className={styles.nodeIndicator} />
          <text y="43" textAnchor="middle" className={styles.nodeLabel}>{replayStages[index].short}</text>
          <text y="59" textAnchor="middle" className={styles.nodeNumber}>0{index + 1}</text>
        </g>
      ))}
      <g transform="translate(538 304)" className={styles.coordinateMark}>
        <path d="M0 0v-18M0 0l18-8M0 0l-18-8" /><text x="-4" y="-25">z</text>
      </g>
      <path d="M112 296h57M112 301h34" stroke="#607998" strokeOpacity=".45" />
    </svg>
  );
}

export function AgentReplay(): React.JSX.Element {
  const [state, dispatch] = useReducer(replayReducer, initialReplayState);
  const hydrated = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
  const rootRef = useRef<HTMLElement>(null);
  const id = useId();
  const view = replayProjection(state);
  const playLabel = state.playing ? "暂停回放" : view.ended ? "重播回放" : "播放回放";

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(timer);
      dispatch({ type: "pause" });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stop();
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      if (entries.some((entry) => !entry.isIntersecting)) stop();
    }, { threshold: 0 });

    if (state.playing && document.visibilityState !== "hidden") {
      timer = setInterval(() => {
        if (document.visibilityState === "hidden") stop();
        else dispatch({ type: "tick" });
      }, 100);
    }
    if (rootRef.current) observer?.observe(rootRef.current);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [state.playing]);

  return (
    <section ref={rootRef} className={styles.replay} aria-label="Agent 任务回放" data-scenario={state.scenario} data-playing={state.playing}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}><span />INTERACTIVE SYSTEM</p>
          <h2 className={styles.title}>Agent 任务回放</h2>
        </div>
        <span className={styles.example}>示例数据 · 交互演示</span>
      </header>

      <div className={styles.workbench}>
        <div className={styles.sceneCaption}>
          <span>代码审查 → 结果提交</span>
          <span className={styles.sceneState}><i />{view.blocked ? "权限已阻断" : state.playing ? "回放中" : view.ended ? "回放结束" : "等待播放"}</span>
        </div>
        <ReplayScene active={view.stageIndex} blocked={view.blocked} playing={state.playing} id={id} />
        <div className={styles.sceneLegend} aria-hidden="true"><span>执行路径</span><span>权限边界</span></div>
      </div>

      <ol className={styles.stages} aria-label="回放阶段">
        {replayStages.map((stage, index) => (
          <li key={stage.id}>
            <button type="button" aria-label={`跳转到${stage.label}`} aria-current={view.stageIndex === index ? "step" : undefined} disabled={!hydrated || (state.scenario === "readonly" && stage.id === "result")} onClick={() => dispatch({ type: "seek", progress: stage.progress })}>
              <span className={styles.stageNumber}>0{index + 1}</span>
              <span>{stage.label}</span>
              <span className={styles.stageMark} aria-hidden="true">{view.stageIndex > index ? "✓" : view.stageIndex === index ? "●" : "·"}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className={styles.event} role="status" aria-live="polite" aria-atomic="true" data-blocked={view.blocked}>
        <div className={styles.eventMarker} aria-hidden="true">{view.blocked ? "!" : "↳"}</div>
        <div className={styles.eventContent}>
          <p className={styles.eventMeta}><span>当前事件</span><code>{view.event}</code></p>
          <p className={styles.eventTitle}>{view.title}</p>
          <p className={styles.eventDetail}>{view.detail}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.playButton} type="button" disabled={!hydrated} aria-label={playLabel} onClick={() => dispatch({ type: state.playing ? "pause" : view.ended ? "replay" : "play" })}>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            {state.playing ? <path d="M6 4v12M14 4v12" stroke="currentColor" strokeWidth="3" /> : view.ended ? <path d="M4 7a7 7 0 1 1-1 6M4 2v5h5" stroke="currentColor" strokeWidth="1.6" /> : <path d="m6 3 11 7L6 17Z" fill="currentColor" />}
          </svg>
          <span>{state.playing ? "暂停" : view.ended ? "重播" : "播放"}</span>
        </button>
        <div className={styles.timeline}>
          <div className={styles.timelineLabel}><label htmlFor={`${id}-progress`}>回放进度</label><span>{String(state.progress).padStart(2, "0")}<small> / 100%</small></span></div>
          <input id={`${id}-progress`} className={styles.range} type="range" min="0" max="100" step="1" value={state.progress} disabled={!hydrated} aria-valuetext={`${state.progress}%，${view.stage.label}${view.blocked ? "，写入已阻断" : ""}`} onChange={(event) => dispatch({ type: "seek", progress: Number(event.target.value) })} style={{ "--replay-progress": `${state.progress}%` } as CSSProperties} />
        </div>
        <div className={styles.scenarios} role="group" aria-label="权限场景">
          <button type="button" disabled={!hydrated} aria-pressed={state.scenario === "authorized"} onClick={() => dispatch({ type: "scenario", scenario: "authorized" })}>正常授权</button>
          <button type="button" disabled={!hydrated} aria-pressed={state.scenario === "readonly"} onClick={() => dispatch({ type: "scenario", scenario: "readonly" })}>只读权限</button>
        </div>
      </div>
      <p className={styles.disclaimer}>仅演示执行逻辑，不发送真实请求；进度不代表实际耗时。</p>
      <noscript><p className={styles.noScript}>当前为静态示例。启用 JavaScript 后可播放回放、切换权限场景。</p></noscript>
    </section>
  );
}
