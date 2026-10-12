"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  PANEL_SIZE,
  STAGE_COPY,
  STAGE_KEYFRAMES,
  STAGE_ORDER,
  type StageKey,
  type Vec3,
  easeInOutQuint,
  lerpVec3,
  stageOnAdvance,
  stageOnClick,
  stageOnEscape,
  stageOnPanelHover,
  terminalDistance,
} from "./camera-rig";
import styles from "./latent-scene.module.css";

const FOV = 35;
const BACKGROUND = 0x05070a;

/** 网络层沿 Z 轴排布；终端面板在 z = 0，所以正数在面板前方。 */
const LAYERS = [
  { z: 30, cols: 8, rows: 5, width: 72, height: 44, hue: 0.52, intensity: 0.3 },
  { z: 17, cols: 9, rows: 6, width: 64, height: 40, hue: 0.5, intensity: 0.45 },
  { z: -14, cols: 11, rows: 7, width: 56, height: 36, hue: 0.47, intensity: 1 },
  { z: -28, cols: 11, rows: 7, width: 54, height: 35, hue: 0.53, intensity: 0.9 },
  { z: -42, cols: 10, rows: 6, width: 52, height: 34, hue: 0.6, intensity: 0.75 },
  { z: -56, cols: 9, rows: 6, width: 50, height: 33, hue: 0.68, intensity: 0.55 },
  { z: -70, cols: 8, rows: 5, width: 48, height: 32, hue: 0.74, intensity: 0.4 },
];

const PULSE_COUNT = 280;
const DUST_COUNT = 900;

type Edge = { from: THREE.Vector3; to: THREE.Vector3 };

/** 固定种子的随机数，保证每次打开看到的结构一致，便于比对设计改动。 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildLayers(random: () => number) {
  const group = new THREE.Group();
  const nodesByLayer: THREE.Vector3[][] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  for (const layer of LAYERS) {
    const nodes: THREE.Vector3[] = [];
    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();

    for (let col = 0; col < layer.cols; col += 1) {
      for (let row = 0; row < layer.rows; row += 1) {
        const u = layer.cols === 1 ? 0.5 : col / (layer.cols - 1);
        const v = layer.rows === 1 ? 0.5 : row / (layer.rows - 1);
        const x = (u - 0.5) * layer.width + (random() - 0.5) * 3.2;
        const y = (v - 0.5) * layer.height + (random() - 0.5) * 3.2;
        const z = layer.z + (random() - 0.5) * 2.4;

        // 面板正前方留空，免得前面两层把终端挡住。
        if (layer.z > 0 && Math.abs(x) < 13 && Math.abs(y) < 9) continue;

        nodes.push(new THREE.Vector3(x, y, z));
        positions.push(x, y, z);
        color.setHSL(layer.hue + (random() - 0.5) * 0.05, 0.75, 0.52 * layer.intensity + 0.12);
        colors.push(color.r, color.g, color.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.62,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Points(geometry, material));
    disposables.push(geometry, material);
    nodesByLayer.push(nodes);
  }

  return { group, nodesByLayer, disposables };
}

function buildEdges(nodesByLayer: THREE.Vector3[][], random: () => number) {
  const edges: Edge[] = [];
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();

  for (let index = 0; index < nodesByLayer.length - 1; index += 1) {
    const current = nodesByLayer[index];
    const next = nodesByLayer[index + 1];
    if (!current.length || !next.length) continue;

    for (const from of current) {
      const links = random() > 0.55 ? 2 : 1;
      for (let link = 0; link < links; link += 1) {
        const to = next[Math.floor(random() * next.length)];
        edges.push({ from, to });
        positions.push(from.x, from.y, from.z, to.x, to.y, to.z);
        color.setHSL(0.5 + index * 0.03, 0.6, 0.28);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { lines: new THREE.LineSegments(geometry, material), edges, disposables: [geometry, material] };
}

type PulseState = { edge: number; progress: number; speed: number };

function buildPulses(edges: Edge[], random: () => number) {
  const states: PulseState[] = [];
  const positions = new Float32Array(PULSE_COUNT * 3);
  const colors = new Float32Array(PULSE_COUNT * 3);
  const color = new THREE.Color();

  for (let index = 0; index < PULSE_COUNT; index += 1) {
    states.push({
      edge: Math.floor(random() * edges.length),
      progress: random(),
      speed: 0.12 + random() * 0.26,
    });
    color.setHSL(0.47 + random() * 0.12, 0.85, 0.66);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.85,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), states, positions, geometry, disposables: [geometry, material] };
}

function buildDust(random: () => number) {
  const positions = new Float32Array(DUST_COUNT * 3);
  for (let index = 0; index < DUST_COUNT; index += 1) {
    positions[index * 3] = (random() - 0.5) * 240;
    positions[index * 3 + 1] = (random() - 0.5) * 150;
    positions[index * 3 + 2] = (random() - 0.5) * 260 - 20;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.22,
    sizeAttenuation: true,
    color: 0x4f7f99,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { points: new THREE.Points(geometry, material), disposables: [geometry, material] };
}

/**
 * 终端面板的占位内容。
 *
 * 下一步这里会换成真正的 iframe（CSS3D + 遮挡面片），现在先用贴图把版式定下来。
 */
function createPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#070d12";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#0c161d";
  context.fillRect(0, 0, canvas.width, 56);
  context.fillStyle = "#6ee7d4";
  context.font = "600 20px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText("LATENT TERMINAL", 28, 36);
  context.fillStyle = "#44606e";
  // 状态字靠左挨着标题：贴近终端时右上角被机位切换按钮占着，放右边会叠字。
  context.fillText("· attached", 248, 36);

  context.fillStyle = "#1b2b34";
  context.fillRect(0, 56, 232, canvas.height - 56);
  const navItems = ["对话 chat", "注意力 attn", "概率 logits", "日志 trace"];
  navItems.forEach((item, index) => {
    context.fillStyle = index === 0 ? "#6ee7d4" : "#5c7b88";
    context.font = "16px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(item, 28, 112 + index * 40);
  });

  const logLines = [
    "> tokenizer ready            vocab 128k",
    "> weights  8/8 shards        bf16",
    "> kv cache warm              ctx 32768",
    "",
    "user:  把这段结构讲清楚",
    "model: 正在沿着注意力路径生成…",
  ];
  logLines.forEach((line, index) => {
    context.fillStyle = line.startsWith(">") ? "#3f6475" : "#c9dbe3";
    context.font = "17px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.fillText(line, 272, 118 + index * 30);
  });

  // 注意力热力图：用格子表示一次前向里各层的激活强度。
  const gridX = 272;
  const gridY = 330;
  const cell = 26;
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 18; col += 1) {
      const weight = Math.abs(Math.sin(row * 1.7 + col * 0.63)) * Math.abs(Math.cos(col * 0.21 + row * 0.4));
      context.fillStyle = `rgba(110, 231, 212, ${0.08 + weight * 0.72})`;
      context.fillRect(gridX + col * cell, gridY + row * cell, cell - 4, cell - 4);
    }
  }

  // token 概率条
  const bars = [0.82, 0.54, 0.37, 0.21, 0.12];
  bars.forEach((value, index) => {
    const y = 540 + index * 18;
    context.fillStyle = "#16303a";
    context.fillRect(gridX, y, 420, 10);
    context.fillStyle = "#6ee7d4";
    context.fillRect(gridX, y, 420 * value, 10);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(110, 231, 212, 0.55)");
  gradient.addColorStop(0.45, "rgba(78, 160, 190, 0.18)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function LatentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<StageKey>("idle");
  // 这个组件只在客户端挂载（ssr: false），所以可以在初始化时就探测 WebGL，
  // 不必在 effect 里再 setState 触发一次额外渲染。
  const [unsupported] = useState(() => !hasWebGL());
  const stageRef = useRef<StageKey>("idle");
  const requestStageRef = useRef<(next: StageKey) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (unsupported) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const random = createRandom(20261012);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND);
    scene.fog = new THREE.FogExp2(BACKGROUND, 0.0062);

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    const layers = buildLayers(random);
    const edges = buildEdges(layers.nodesByLayer, random);
    const pulses = buildPulses(edges.edges, random);
    const dust = buildDust(random);
    scene.add(layers.group, edges.lines, pulses.points, dust.points);
    disposables.push(...layers.disposables, ...edges.disposables, ...pulses.disposables, ...dust.disposables);

    // 终端面板
    const panelTexture = createPanelTexture();
    const panelMaterial = new THREE.MeshBasicMaterial({ map: panelTexture ?? undefined, toneMapped: false });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL_SIZE.width, PANEL_SIZE.height), panelMaterial);
    scene.add(panel);
    disposables.push(panel.geometry, panelMaterial);
    if (panelTexture) disposables.push(panelTexture);

    const frameMaterial = new THREE.LineBasicMaterial({ color: 0x6ee7d4, transparent: true, opacity: 0.8 });
    const frameGeometry = new THREE.EdgesGeometry(
      new THREE.PlaneGeometry(PANEL_SIZE.width + 0.5, PANEL_SIZE.height + 0.5),
    );
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    frame.position.z = 0.05;
    scene.add(frame);
    disposables.push(frameGeometry, frameMaterial);

    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture ?? undefined,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(52, 38), glowMaterial);
    glow.position.z = -1.2;
    scene.add(glow);
    disposables.push(glow.geometry, glowMaterial);
    if (glowTexture) disposables.push(glowTexture);

    // 相机调度
    const pointer = new THREE.Vector2(0, 0);
    const smoothedPointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let pointerInside = false;

    let currentStage: StageKey = "idle";
    let transitionFrom: { position: Vec3; target: Vec3 } | null = null;
    let transitionStart = 0;
    let transitionDuration = 1200;

    const lookTarget = new THREE.Vector3(
      STAGE_KEYFRAMES.idle.target.x,
      STAGE_KEYFRAMES.idle.target.y,
      STAGE_KEYFRAMES.idle.target.z,
    );

    const resolveKeyframe = (key: StageKey, elapsed: number): { position: Vec3; target: Vec3 } => {
      const base = STAGE_KEYFRAMES[key];
      const still = reduceMotion.matches;

      if (key === "idle") {
        const drift = still ? 0 : 1;
        return {
          position: {
            x: base.position.x + Math.sin(elapsed * 0.00008) * 7 * drift,
            y: base.position.y + Math.sin(elapsed * 0.00013) * 3 * drift,
            z: base.position.z + Math.cos(elapsed * 0.00007) * 5 * drift,
          },
          target: base.target,
        };
      }

      if (key === "approach") {
        return {
          position: {
            x: base.position.x + smoothedPointer.x * 7,
            y: base.position.y + smoothedPointer.y * 4.5,
            z: base.position.z,
          },
          target: {
            x: base.target.x + smoothedPointer.x * 2.4,
            y: base.target.y + smoothedPointer.y * 1.6,
            z: base.target.z,
          },
        };
      }

      const aspect = camera.aspect || 1.6;
      return { position: { x: 0, y: 0, z: terminalDistance(FOV, aspect) }, target: base.target };
    };

    const requestStage = (next: StageKey) => {
      if (next === currentStage) return;
      transitionFrom = {
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        target: { x: lookTarget.x, y: lookTarget.y, z: lookTarget.z },
      };
      transitionStart = performance.now();
      transitionDuration = reduceMotion.matches ? 320 : 1200;
      currentStage = next;
      stageRef.current = next;
      setStage(next);
    };
    requestStageRef.current = requestStage;

    const initial = resolveKeyframe("idle", 0);
    camera.position.set(initial.position.x, initial.position.y, initial.position.z);
    camera.lookAt(lookTarget);

    const isPointerOnPanel = () => {
      if (!pointerInside) return false;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(panel, false).length > 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerInside = true;
      requestStage(stageOnPanelHover(currentStage, isPointerOnPanel()));
    };

    const onPointerLeave = () => {
      pointerInside = false;
      pointer.set(0, 0);
      requestStage(stageOnPanelHover(currentStage, false));
    };

    const onClick = () => {
      requestStage(stageOnClick(currentStage));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestStage(stageOnEscape(currentStage));
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestStage(stageOnAdvance(currentStage));
      }
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("click", onClick);
    container.addEventListener("keydown", onKeyDown);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frameId = 0;
    let lastFrame = performance.now();

    const renderFrame = (now: number) => {
      frameId = requestAnimationFrame(renderFrame);
      const delta = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      smoothedPointer.x += (pointer.x - smoothedPointer.x) * 0.06;
      smoothedPointer.y += (pointer.y - smoothedPointer.y) * 0.06;

      const resolved = resolveKeyframe(currentStage, now);
      let position = resolved.position;
      let target = resolved.target;

      if (transitionFrom) {
        const progress = (now - transitionStart) / transitionDuration;
        if (progress >= 1) {
          transitionFrom = null;
        } else {
          const eased = easeInOutQuint(progress);
          position = lerpVec3(transitionFrom.position, resolved.position, eased);
          target = lerpVec3(transitionFrom.target, resolved.target, eased);
        }
      }

      camera.position.set(position.x, position.y, position.z);
      lookTarget.set(target.x, target.y, target.z);
      camera.lookAt(lookTarget);

      if (!reduceMotion.matches) {
        // 光点沿连线流动，走完就换一条边重新开始。
        const array = pulses.positions;
        for (let index = 0; index < pulses.states.length; index += 1) {
          const state = pulses.states[index];
          state.progress += state.speed * delta;
          if (state.progress >= 1) {
            state.progress = 0;
            state.edge = Math.floor(random() * edges.edges.length);
          }
          const edge = edges.edges[state.edge];
          if (!edge) continue;
          const t = state.progress;
          array[index * 3] = edge.from.x + (edge.to.x - edge.from.x) * t;
          array[index * 3 + 1] = edge.from.y + (edge.to.y - edge.from.y) * t;
          array[index * 3 + 2] = edge.from.z + (edge.to.z - edge.from.z) * t;
        }
        pulses.geometry.attributes.position.needsUpdate = true;

        frameMaterial.opacity = 0.62 + Math.sin(now * 0.0016) * 0.18;
        glowMaterial.opacity = 0.72 + Math.sin(now * 0.0011) * 0.14;
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(renderFrame);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!frameId) {
        lastFrame = performance.now();
        frameId = requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("click", onClick);
      container.removeEventListener("keydown", onKeyDown);
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [unsupported]);

  if (unsupported) {
    return (
      <div className={styles.fallback}>
        <p>当前浏览器没有可用的 WebGL，无法渲染这个三维原型。</p>
        <p lang="en">WebGL is unavailable in this browser.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div
        aria-label="潜空间三维原型：点击进入结构，移到终端上放大，按 Esc 退出"
        className={styles.canvas}
        ref={containerRef}
        role="application"
        tabIndex={0}
      />
      <div className={styles.hud}>
        <div className={styles.brand} data-dim={stage === "terminal" ? "true" : undefined}>
          <span className={styles.brandTitle}>LATENT TERMINAL</span>
          <span className={styles.brandSub}>潜空间原型 · 场景与三机位</span>
        </div>
        <div className={styles.stages}>
          {STAGE_ORDER.map((key) => (
            <button
              aria-current={stage === key ? "true" : undefined}
              className={styles.stageButton}
              key={key}
              onClick={() => requestStageRef.current(key)}
              type="button"
            >
              {STAGE_COPY[key].label}
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          <span className={styles.hintText}>{STAGE_COPY[stage].hint}</span>
        </p>
      </div>
    </div>
  );
}
