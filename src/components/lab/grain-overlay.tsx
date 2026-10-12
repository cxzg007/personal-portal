"use client";

import { useEffect, useRef } from "react";

import styles from "./grain-overlay.module.css";

/**
 * 噪点画得比视口小，再被 CSS 拉满屏，颗粒因此变大变软，像胶片而不是像素噪声。
 * 倍率是调出来的：放到 8 倍时噪点糊成一团团云斑，反而把干净的暗部弄脏了；
 * 4 倍左右才是颗粒感。一帧八万像素，12fps 下重画的成本仍然可以忽略。
 */
const NOISE_WIDTH = 360;
const NOISE_HEIGHT = 225;

/** 12fps。噪点跳得太快会显得廉价，太慢又会被看出是一张静态贴图。 */
const FRAME_INTERVAL = 1000 / 12;

/**
 * 一层会动的噪点。
 *
 * 没有它，WebGL 画出来的渐变是数学上完美的——干净得不像在看一块屏幕。Henry
 * Heffernan 的作品集靠第二个 WebGLRenderer 做这类后期，这里没跟：那要多养一个
 * GL 上下文，而这一层要的只是一张不断变化的灰度噪声，2D canvas 配
 * mix-blend-mode 就够，代价小得多。
 *
 * 也没有加扫描线。扫描线是 CRT 的特征，会把场景拽回复古终端的语境；而这里讲的
 * 是一个正在运行的模型，应该干净、冷、当代。
 */
export function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    canvas.width = NOISE_WIDTH;
    canvas.height = NOISE_HEIGHT;

    // 只分配一次缓冲区，之后每帧原地改写，避免每秒产生十几个大对象。
    const image = context.createImageData(NOISE_WIDTH, NOISE_HEIGHT);
    const data = image.data;

    const draw = () => {
      for (let index = 0; index < data.length; index += 4) {
        const value = (Math.random() * 255) | 0;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
      context.putImageData(image, 0, 0);
    };

    draw();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // 不想看动效的人拿到同一层质感，只是它不动。
    if (reduceMotion.matches) return;

    let frameId = 0;
    let lastFrame = 0;

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;
      draw();
    };
    frameId = requestAnimationFrame(tick);

    // 页面切到后台就停下来，没必要为看不见的噪点烧电。
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) {
        frameId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas aria-hidden="true" className={styles.grain} ref={canvasRef} />;
}
