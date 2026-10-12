"use client";

import { useEffect, useRef } from "react";

import {
  BOOT_STEPS,
  type BootState,
  bootProgress,
  bootStepStatus,
  isBootComplete,
} from "./boot-sequence";
import styles from "./boot-overlay.module.css";

type Props = {
  boot: BootState;
  /** 还停在载入阶段。接入之后这层淡出，但留在 DOM 里，免得镜头起步时画面跳一下。 */
  active: boolean;
  onAttach: () => void;
};

/**
 * 接入前挡在场景前面的载入屏。
 *
 * 它不只是等待界面，还承担两件事：第一，把"这是一个模型"这件事在第一屏讲清楚，
 * 访客不用猜自己在看什么；第二，替场景争取时间——七层结构正在后面一层一层长出来，
 * 从日志的缝隙里能看见它，等待因此变成了可看的过程。
 *
 * 不做自动跳转。模型载完了也停在这里等一次点击，因为后面的镜头推进和 iframe 取得
 * 焦点都应该由访客的动作触发，而不是页面自己开始动。
 */
export function BootOverlay({ active, boot, onAttach }: Props) {
  const ready = isBootComplete(boot);
  const progress = bootProgress(boot);
  const percent = Math.round(progress * 100);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 载入完成的瞬间把焦点交给接入按钮：键盘访客不必自己摸索下一步在哪，
  // 回车就能继续。
  useEffect(() => {
    if (active && ready) buttonRef.current?.focus();
  }, [active, ready]);

  return (
    <div
      aria-hidden={active ? undefined : "true"}
      className={styles.root}
      data-hidden={active ? undefined : "true"}
      inert={!active}
    >
      <div className={styles.panel}>
        <p className={styles.title}>
          LATENT TERMINAL
          <span className={styles.titleSub}>潜空间 · 一个可以走进去的模型</span>
        </p>

        <ol className={styles.log}>
          {BOOT_STEPS.map((step) => {
            const done = boot[step.key] >= step.total;
            return (
              <li className={styles.logRow} data-done={done ? "true" : undefined} key={step.key}>
                <span aria-hidden="true" className={styles.logMark}>
                  {done ? "✓" : "·"}
                </span>
                <span className={styles.logLabel}>{step.label}</span>
                <span className={styles.logStatus}>{bootStepStatus(step, boot)}</span>
              </li>
            );
          })}
        </ol>

        <div
          aria-label="模型载入进度"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          className={styles.meter}
          role="progressbar"
        >
          <span className={styles.meterFill} style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className={styles.footer}>
          <span className={styles.percent}>{percent}%</span>
          <button
            className={styles.attach}
            disabled={!ready}
            onClick={onAttach}
            ref={buttonRef}
            type="button"
          >
            {ready ? "接入 · attach" : "载入中 · loading"}
          </button>
        </div>
      </div>
    </div>
  );
}
