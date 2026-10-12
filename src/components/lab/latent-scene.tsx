"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";

import { DOMAIN_LABEL, DOMAIN_LAYER, type LatentDomain } from "@/lib/latent-index";

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
import { type BootState, advanceBoot, createBootState } from "./boot-sequence";
import { BootOverlay } from "./boot-overlay";
import { GrainOverlay } from "./grain-overlay";
import {
  type BridgeMessage,
  encodeBridgeMessage,
  parseBridgeMessage,
  stageOnBridgeMessage,
} from "./terminal-bridge";
import {
  FLIGHT,
  FLIGHT_DURATION,
  type FlightPath,
  flightPhase,
  planFlight,
  samplePath,
  tokenProgress,
  travelProgress,
} from "./token-flight";
import styles from "./latent-scene.module.css";

const FOV = 35;
const BACKGROUND = 0x05070a;

/**
 * 屏幕里那张网页的像素尺寸，和 PANEL_SIZE 同比例（1440 / 900 = 16 / 10）。
 *
 * 取 1440 是因为贴近终端时面板差不多铺满常见的笔记本视口，这时 CSS3D 的缩放
 * 接近 1:1，字才不会被放大到发虚。
 */
const SCREEN_PX = { width: 1440, height: 900 } as const;
const SCREEN_URL = "/lab/latent/terminal";

/**
 * 网络层沿 Z 轴排布；终端面板在 z = 0，所以正数在面板前方。
 *
 * 面板后方的五层各自绑一个内容域。这一步让整叠结构从装饰变成了存放东西的地方：
 * 问一句话，token 只穿过真正命中的那几层，看到的路径就是检索实际落在哪儿。
 * 前方两层不绑内容——它们在面板前面，是这句话还没进去时待的位置。
 */
const LAYERS = [
  { z: 30, cols: 8, rows: 5, width: 72, height: 44, hue: 0.52, intensity: 0.3 },
  { z: 17, cols: 9, rows: 6, width: 64, height: 40, hue: 0.5, intensity: 0.45 },
  { z: -14, cols: 11, rows: 7, width: 56, height: 36, hue: 0.47, intensity: 1 },
  { z: -28, cols: 11, rows: 7, width: 54, height: 35, hue: 0.53, intensity: 0.9 },
  { z: -42, cols: 10, rows: 6, width: 52, height: 34, hue: 0.6, intensity: 0.75 },
  { z: -56, cols: 9, rows: 6, width: 50, height: 33, hue: 0.68, intensity: 0.55 },
  { z: -70, cols: 8, rows: 5, width: 48, height: 32, hue: 0.74, intensity: 0.4 },
];

/**
 * 第几层放哪个域。
 *
 * 绑定关系不写在 LAYERS 里，而是由 DOMAIN_LAYER 反推：终端的索引页也要标出层号，
 * 两边各写一份迟早会对不上，而对不上的后果是界面说的和画面演的不是一回事。
 */
const DOMAIN_BY_LAYER = new Map<number, LatentDomain>(
  (Object.entries(DOMAIN_LAYER) as Array<[LatentDomain, number]>).map(([domain, layer]) => [
    layer - 1,
    domain,
  ]),
);

/**
 * 规划这趟要走多深、点亮哪几层。
 *
 * 试过只把命中的那一层串进路径：单域命中时轨迹退化成一条近乎笔直的线，整叠结构
 * 的层次全看不见了，反而不像是在穿过什么。改成一路穿到最深的那个命中层再掉头——
 * 中间几层照样要路过，这本来也是物理上该发生的事——深度于是表示"答案藏得多深"，
 * 亮起来的层表示"答案在哪儿"，两件事各自有自己的表达。
 *
 * 没给命中域时走完全程。这只会在协议被绕过时发生，那时让它跑完整条路
 * 比什么都不显示要好。
 */
function flightLayers(domains: readonly LatentDomain[]): { path: number[]; lit: Set<number> } {
  const bound: number[] = [];
  for (let index = 0; index < LAYERS.length; index += 1) {
    if (DOMAIN_BY_LAYER.has(index)) bound.push(index);
  }

  const lit = bound.filter((index) => domains.includes(DOMAIN_BY_LAYER.get(index)!));
  if (lit.length === 0) return { path: bound, lit: new Set(bound) };

  const deepest = lit[lit.length - 1];
  return { path: bound.filter((index) => index <= deepest), lit: new Set(lit) };
}

/**
 * 两层之间间隔多久。七层加起来约两秒——再快就只剩一次闪烁，看不出结构是有厚度的；
 * 再慢等待就开始让人不耐烦。
 */
const SHARD_INTERVAL = 300;

/** 层上节点建好后的亮度。压暗时按比例缩，所以它要有个名字。 */
const LAYER_OPACITY = 0.9;

const PULSE_COUNT = 280;
const DUST_COUNT = 900;

const EDGE_OPACITY = 0.22;
const PULSE_OPACITY = 0.95;

/**
 * 前向传播时整叠结构压暗多少。
 *
 * 不压暗的话那趟 token 会直接消失在七层连线织成的网里——试过，什么也看不见。
 * 一次提问进来，模型其余部分安静下来，只剩这句话在走，这既解决了对比度，
 * 也正好是这个交互想说的事。
 */
const FLIGHT_DIM = 0.78;

type Edge = { from: THREE.Vector3; to: THREE.Vector3 };

/** 固定种子的随机数，保证每次打开看到的结构一致，便于比对设计改动。 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * 逐层建造，一次只建一层。
 *
 * 七层结构全部同步建完只要十几毫秒，做成进度条根本看不见。但把它摊到多帧上
 * 是有道理的：主线程不被一口气占住，而且结构是一层层长出来的——加载过程本身
 * 就成了可看的东西，不需要再编一个假的百分比。每层建好后淡入，节奏由
 * SHARD_INTERVAL 控制，那是排程选择，进度条数的仍然是真建好的层数。
 */
function createLayerBuilder(random: () => number) {
  const group = new THREE.Group();
  const nodesByLayer: THREE.Vector3[][] = [];
  const disposables: Array<{ dispose: () => void }> = [];
  /**
   * 淡入进度和实际透明度要分开记。
   *
   * 前向传播时整叠结构会被压暗，如果直接去改 material.opacity，淡入那段逻辑
   * 会以为这一层还没淡完，每帧再给推回去，两边来回拉扯。
   */
  const entries: Array<{ material: THREE.PointsMaterial; level: number }> = [];
  let built = 0;

  const buildNext = () => {
    const layer = LAYERS[built];
    if (!layer) return false;
    built += 1;

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
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Points(geometry, material));
    disposables.push(geometry, material);
    entries.push({ material, level: 0 });
    nodesByLayer.push(nodes);
    return true;
  };

  /**
   * 新建的层淡入到满，再按 dim 统一压暗。dim 为 0 时就是原来的亮度。
   *
   * lit 里的层不跟着压暗，还往满推一点。压暗整叠结构已经能让 token 看清，
   * 但那样五层看着都一样；把命中的层单独留亮，才看得出这次检索落在哪儿。
   */
  const fade = (delta: number, dim = 0, lit: ReadonlySet<number> | null = null) => {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry.level < LAYER_OPACITY) {
        entry.level = Math.min(LAYER_OPACITY, entry.level + delta * 3.4);
      }
      entry.material.opacity = lit?.has(index)
        ? Math.min(1, entry.level * (1 + dim * 0.24))
        : entry.level * (1 - dim);
    }
  };

  const reveal = () => {
    for (const entry of entries) {
      entry.level = LAYER_OPACITY;
      entry.material.opacity = LAYER_OPACITY;
    }
  };

  return {
    group,
    nodesByLayer,
    disposables,
    buildNext,
    fade,
    reveal,
    get built() {
      return built;
    },
    get done() {
      return built >= LAYERS.length;
    },
  };
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
    opacity: EDGE_OPACITY,
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
    opacity: PULSE_OPACITY,
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
 * 终端屏幕：一块真网页 + 一块看不见的遮挡面。
 *
 * iframe 没法贴到 WebGL 画布上，所以它由 CSS3DRenderer 单独渲染在画布下面，
 * 靠同一个相机保持透视一致。画布本身是透明的，再在屏幕的位置放一块
 * NoBlending 的全透明面片——它会把那块区域的 alpha 直接写成 0，于是下面的
 * 网页从画布里透出来；而任何比它离相机更近的节点和连线仍然画在上面，
 * 屏幕就被正确地挡住了。这是 Henry Heffernan 作品集里最关键的一招。
 */
function createScreen() {
  const holder = document.createElement("div");
  holder.style.width = `${SCREEN_PX.width}px`;
  holder.style.height = `${SCREEN_PX.height}px`;
  // iframe 载入前先铺上终端底色，免得露出一块空洞。
  holder.style.background = "#070d12";
  holder.style.overflow = "hidden";

  const iframe = document.createElement("iframe");
  iframe.src = SCREEN_URL;
  iframe.title = "Latent Terminal 屏幕内容";
  iframe.style.width = `${SCREEN_PX.width}px`;
  iframe.style.height = `${SCREEN_PX.height}px`;
  iframe.style.border = "0";
  iframe.style.display = "block";
  // 只有贴近终端时才把事件交给网页，否则点击要留给镜头。
  iframe.style.pointerEvents = "none";
  holder.appendChild(iframe);

  const object = new CSS3DObject(holder);
  object.scale.setScalar(PANEL_SIZE.width / SCREEN_PX.width);

  const occluderMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    blending: THREE.NoBlending,
    side: THREE.DoubleSide,
  });
  const occluder = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL_SIZE.width, PANEL_SIZE.height),
    occluderMaterial,
  );

  // 斜着看屏幕时压暗。真显示器有可视角，少了这层，网页会像贴纸一样浮在场景里。
  const dimmerMaterial = new THREE.MeshBasicMaterial({
    color: 0x04080b,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const dimmer = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL_SIZE.width, PANEL_SIZE.height),
    dimmerMaterial,
  );
  dimmer.position.z = 0.02;

  return {
    iframe,
    object,
    occluder,
    dimmer,
    dimmerMaterial,
    disposables: [occluder.geometry, occluderMaterial, dimmer.geometry, dimmerMaterial],
  };
}

/**
 * token 用的圆形贴图。
 *
 * PointsMaterial 不给贴图就是方块，叠加混合下一堆小方块看着像渲染坏了。
 * 64×64 的径向渐变足够——它在屏幕上最多也就几十像素。
 */
function createTokenSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 一次前向传播要画的两样东西：在跑的 token，和它们走过的那条路。
 *
 * 路是一次性全画出来的静态线段，靠整体透明度随进度起落；没有逐段点亮，因为
 * 那需要每帧改顶点色，而这条线本来就只亮两秒，多出来的开销换不到看得见的差别。
 */
function buildFlight(paths: readonly FlightPath[], sprite: THREE.Texture | null) {
  const count = paths.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    // 每个 token 一个略不同的色相，一股光里才分得出个体。
    color.setHSL(0.44 + (index / Math.max(1, count)) * 0.14, 0.9, 0.72);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    const start = paths[index][0];
    positions[index * 3] = start.x;
    positions[index * 3 + 1] = start.y;
    positions[index * 3 + 2] = start.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    // 比层上的节点（0.62）和环境流光（0.85）大一个量级：这两秒里它们是主角，
    // 在百来单位的距离上还要看得见。
    size: 4.5,
    sizeAttenuation: true,
    vertexColors: true,
    map: sprite ?? undefined,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const linePositions: number[] = [];
  for (const path of paths) {
    for (let index = 0; index < path.length - 1; index += 1) {
      linePositions.push(path[index].x, path[index].y, path[index].z);
      linePositions.push(path[index + 1].x, path[index + 1].y, path[index + 1].z);
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x6ee7d4,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return {
    points: new THREE.Points(geometry, material),
    lines: new THREE.LineSegments(lineGeometry, lineMaterial),
    positions,
    geometry,
    material,
    lineMaterial,
    disposables: [geometry, material, lineGeometry, lineMaterial],
  };
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

export default function LatentScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cssContainerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<StageKey>("boot");
  const [boot, setBoot] = useState<BootState>(createBootState);
  /** 这次提问命中了哪几个内容域、走到第几层，前向传播时在 HUD 上说出来。 */
  const [hitReadout, setHitReadout] = useState<string | null>(null);
  const stageRef = useRef<StageKey>("boot");
  const requestStageRef = useRef<(next: StageKey) => void>(() => {});

  useEffect(() => {
    const container = containerRef.current;
    const cssContainer = cssContainerRef.current;
    if (!container || !cssContainer) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const random = createRandom(20261012);

    const scene = new THREE.Scene();
    // 画布必须透明，屏幕那块的 alpha 被挖空后才能看见下面的 iframe。
    // 底色改由外层容器的 CSS 背景提供。
    scene.fog = new THREE.FogExp2(BACKGROUND, 0.0062);
    const cssScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 2000);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(BACKGROUND, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const cssRenderer = new CSS3DRenderer();
    cssContainer.appendChild(cssRenderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    /**
     * 载入进度只认真实里程碑：字体就绪、每建好一层、屏幕里的网页加载完。
     * advanceBoot 会吃掉重复上报，所以这里不用自己去重。
     */
    const reportStep = (key: Parameters<typeof advanceBoot>[1], units = 1) => {
      setBoot((previous) => advanceBoot(previous, key, units));
    };
    const reportShards = (units = 1) => reportStep("weights", units);

    // 结构分帧建造：每隔 SHARD_INTERVAL 长出一层，连线和光点要等所有层到齐。
    const layers = createLayerBuilder(random);
    scene.add(layers.group);
    const dust = buildDust(random);
    scene.add(dust.points);
    disposables.push(...dust.disposables);

    let edges: ReturnType<typeof buildEdges> | null = null;
    let pulses: ReturnType<typeof buildPulses> | null = null;
    let nextShardAt = 0;

    const finishStructure = () => {
      if (edges) return;
      edges = buildEdges(layers.nodesByLayer, random);
      pulses = buildPulses(edges.edges, random);
      scene.add(edges.lines, pulses.points);
      disposables.push(...layers.disposables, ...edges.disposables, ...pulses.disposables);
    };

    // 不想看动效的人直接拿到建好的场景，没有逐层生长这一段。
    if (reduceMotion.matches) {
      while (layers.buildNext());
      layers.reveal();
      finishStructure();
      reportShards(LAYERS.length);
    }

    // 字体就绪算一个里程碑：等宽字体没加载完的话，终端里的版式会先错一拍。
    document.fonts.ready.then(() => reportStep("tokenizer"));

    // 终端屏幕
    const screen = createScreen();
    // 屏幕里那张网页加载完，才算真的可以接入。
    screen.iframe.addEventListener("load", () => reportStep("cache"), { once: true });
    cssScene.add(screen.object);
    scene.add(screen.occluder, screen.dimmer);
    disposables.push(...screen.disposables);

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

    // 一次前向传播
    const tokenSprite = createTokenSprite();
    if (tokenSprite) disposables.push(tokenSprite);

    let flight: ReturnType<typeof buildFlight> | null = null;
    let flightPaths: readonly FlightPath[] = [];
    let flightStart = 0;
    let flightReturned = false;
    let flightDim = 0;
    /** 这趟要点亮的层。为 null 时所有层一视同仁地压暗。 */
    let flightLit: ReadonlySet<number> | null = null;

    const postToScreen = (message: BridgeMessage) => {
      screen.iframe.contentWindow?.postMessage(
        encodeBridgeMessage(message),
        window.location.origin,
      );
    };

    const clearFlight = () => {
      if (!flight) return;
      scene.remove(flight.points, flight.lines);
      for (const item of flight.disposables) item.dispose();
      flight = null;
      flightLit = null;
    };

    /** 发射成功才返回 true；没发射出去的话镜头也不该动。 */
    const launchFlight = (tokens: number, domains: readonly LatentDomain[]) => {
      // 减弱动效时不派 token，也不动镜头。答案照给，由调用方统一回执——
      // 这个交互的信息不能只存在于动画里。
      if (reduceMotion.matches) return false;
      // 结构还没建完就没有路可走；上一趟还没跑完也不受理，两股 token
      // 叠在一起谁也看不清。
      if (!layers.done || flight) return false;

      const { path, lit } = flightLayers(domains);
      flightPaths = planFlight(
        path.map((index) => layers.nodesByLayer[index]),
        random,
        tokens,
      );
      flightLit = lit;
      flight = buildFlight(flightPaths, tokenSprite);
      scene.add(flight.points, flight.lines);
      flightStart = performance.now();
      flightReturned = false;
      // 读数在这里拼好，HUD 那边只管显示：深度和域名都是这次发射的事实，
      // 分成两个状态传过去只会多一次不同步的机会。
      const names = domains.map((domain) => DOMAIN_LABEL[domain]).join(" / ");
      const deepest = path[path.length - 1] + 1;
      setHitReadout(domains.length > 0 ? `命中 ${names} · 走到第 ${deepest} 层` : null);
      return true;
    };

    // 相机调度
    const pointer = new THREE.Vector2(0, 0);
    const smoothedPointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    let pointerInside = false;

    let currentStage: StageKey = "boot";
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

      if (key === "boot") {
        const drift = still ? 0 : 1;
        return {
          position: {
            x: base.position.x + Math.sin(elapsed * 0.00011) * 10 * drift,
            y: base.position.y,
            z: base.position.z,
          },
          target: base.target,
        };
      }

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

      if (key === "forward") {
        // 传播途中镜头缓慢横移，画面不至于死住。这里不接指针视差——这两秒
        // 归这趟传播，镜头跟着鼠标晃会把注意力从 token 身上拉走。
        const drift = still ? 0 : 1;
        return {
          position: {
            x: base.position.x + Math.sin(elapsed * 0.00022) * 5 * drift,
            y: base.position.y + Math.cos(elapsed * 0.00017) * 2.4 * drift,
            z: base.position.z,
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
      // 贴近后网页接管指针，退出后交还给镜头。
      screen.iframe.style.pointerEvents = next === "terminal" ? "auto" : "none";
      setStage(next);
    };
    requestStageRef.current = requestStage;

    const initial = resolveKeyframe("boot", 0);
    camera.position.set(initial.position.x, initial.position.y, initial.position.z);
    camera.lookAt(lookTarget);

    const isPointerOnPanel = () => {
      if (!pointerInside) return false;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(screen.occluder, false).length > 0;
    };

    // 指针和键盘都挂在 window 上。画布设了 pointer-events: none——它必须让位，
    // 否则盖在上面会把 iframe 的点击全吃掉——所以不能再往画布上挂监听。
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
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

    const onClick = (event: MouseEvent) => {
      // HUD 上的机位按钮自己会处理点击，别再叠一次镜头切换。
      if (event.target instanceof Element && event.target.closest("button, a")) return;
      requestStage(stageOnClick(currentStage));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // 焦点在按钮或输入框里时，按键归控件所有。
      if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select")) {
        return;
      }
      if (event.key === "Escape") {
        requestStage(stageOnEscape(currentStage));
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestStage(stageOnAdvance(currentStage));
      }
    };

    /**
     * 屏幕里的网页把它那边发生的事报上来。
     *
     * iframe 挡住了外层的指针事件，没有这条通道，访客从屏幕边缘滑出去时
     * 镜头会一直卡在贴近状态，在终端里按 Esc 也不会有任何反应。
     */
    const onBridgeMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = parseBridgeMessage(event.data);
      if (!message) return;
      if (message.type === "navigate") {
        // 屏幕里的链接要换掉整个窗口。留在 iframe 里跳的话，访客会得到一个
        // 套在三维壳子里的普通页面，而外面的场景还停在原处。
        window.location.href = message.href;
        return;
      }
      if (message.type === "submit") {
        // 只有贴在终端上提交才算数，而且要先确认 token 真的派出去了，
        // 否则镜头退开后画面里什么也不会发生。
        if (currentStage !== "terminal" || !launchFlight(message.tokens, message.domains)) {
          // 不受理也要回一声：屏幕里那条问答在等这个信号，没有它会一直停在
          // "检索中"。内容本来就已经检索好了，动画跑不跑都不该拦着它显示。
          postToScreen({ type: "flight", phase: "returned" });
          return;
        }
      }
      requestStage(stageOnBridgeMessage(currentStage, message));
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onBridgeMessage);
    document.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
      cssRenderer.setSize(clientWidth, clientHeight);
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

      // 结构一层层长出来；最后一层到位后再接上连线和流动的光点。
      if (!layers.done && now >= nextShardAt) {
        layers.buildNext();
        reportShards();
        nextShardAt = now + SHARD_INTERVAL;
      } else if (layers.done) {
        finishStructure();
      }
      // 有 token 在跑就把其余部分压下去，跑完再缓缓亮回来。
      const dimTarget = flight ? FLIGHT_DIM : 0;
      flightDim += (dimTarget - flightDim) * Math.min(1, delta * 4.5);
      layers.fade(delta, flightDim, flightLit);
      if (edges) edges.lines.material.opacity = EDGE_OPACITY * (1 - flightDim);
      if (pulses) pulses.points.material.opacity = PULSE_OPACITY * (1 - flightDim);

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

      // 先取到局部变量：连线和光点要等七层都建好才存在，在那之前是 null。
      const wiring = edges;
      const flow = pulses;
      if (!reduceMotion.matches && wiring && flow) {
        // 光点沿连线流动，走完就换一条边重新开始。
        const array = flow.positions;
        for (let index = 0; index < flow.states.length; index += 1) {
          const state = flow.states[index];
          state.progress += state.speed * delta;
          if (state.progress >= 1) {
            state.progress = 0;
            state.edge = Math.floor(random() * wiring.edges.length);
          }
          const edge = wiring.edges[state.edge];
          if (!edge) continue;
          const t = state.progress;
          array[index * 3] = edge.from.x + (edge.to.x - edge.from.x) * t;
          array[index * 3 + 1] = edge.from.y + (edge.to.y - edge.from.y) * t;
          array[index * 3 + 2] = edge.from.z + (edge.to.z - edge.from.z) * t;
        }
        flow.geometry.attributes.position.needsUpdate = true;
      }

      if (!reduceMotion.matches) {
        frameMaterial.opacity = 0.62 + Math.sin(now * 0.0016) * 0.18;
        glowMaterial.opacity = 0.72 + Math.sin(now * 0.0011) * 0.14;
      }

      if (flight) {
        const elapsed = now - flightStart;
        const phase = flightPhase(elapsed);
        const count = flightPaths.length;
        const array = flight.positions;

        for (let index = 0; index < count; index += 1) {
          const raw = tokenProgress(elapsed, index, count);
          // 平滑曲线让 token 冲出屏幕、在最深处放慢、再加速回来。匀速走
          // 看着像传送带，而这趟路程中间本来就该是最吃力的一段。
          const eased = raw * raw * (3 - 2 * raw);
          const point = samplePath(flightPaths[index], eased);
          array[index * 3] = point.x;
          array[index * 3 + 1] = point.y;
          array[index * 3 + 2] = point.z;
        }
        flight.geometry.attributes.position.needsUpdate = true;

        // 路先亮起来给 token 引路，回程后半段退掉，免得终点一片糊光。
        const overall = travelProgress(elapsed);
        const rise = Math.min(1, overall / 0.3);
        const drop = 1 - Math.min(1, Math.max(0, (overall - 0.72) / 0.28));
        flight.lineMaterial.opacity = 0.9 * rise * drop;
        flight.material.opacity =
          phase === "settle" ? Math.max(0, 1 - (elapsed - FLIGHT.travel) / FLIGHT.settle) : 1;

        if (!flightReturned && elapsed >= FLIGHT.travel) {
          flightReturned = true;
          // token 落回屏幕的这一刻终端才开始吐字，答案因此是被带回来的。
          postToScreen({ type: "flight", phase: "returned" });
        }

        if (elapsed >= FLIGHT_DURATION) {
          clearFlight();
          // 中途按 Esc 走掉的人不该被拽回终端，所以只在镜头还留在传播机位时推回去。
          if (currentStage === "forward") requestStage("terminal");
        }
      }

      // 屏幕法线朝 +Z，相机越偏离正面，可视角越差，画面压得越暗。
      const facing = Math.abs(camera.position.clone().sub(screen.occluder.position).normalize().z);
      screen.dimmerMaterial.opacity = (1 - facing) * 0.82;

      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
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
      clearFlight();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onBridgeMessage);
      document.removeEventListener("pointerleave", onPointerLeave);
      for (const item of disposables) item.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      screen.object.element.remove();
      cssRenderer.domElement.remove();
    };
  }, []);

  // 载入屏和终端面板各自都带着说明文字，HUD 这两行要让位，免得同屏出现两套提示。
  const dimHud = stage === "boot" || stage === "terminal";

  return (
    <div className={styles.root}>
      <div aria-hidden={stage !== "terminal"} className={styles.cssLayer} ref={cssContainerRef} />
      <div
        aria-label="潜空间三维原型：点击进入结构，移到终端上放大后可以提问，按 Esc 退出"
        className={styles.canvas}
        ref={containerRef}
        role="application"
        tabIndex={0}
      />
      <div className={styles.hud}>
        <div className={styles.brand} data-dim={dimHud ? "true" : undefined}>
          <span className={styles.brandTitle}>LATENT TERMINAL</span>
          <span className={styles.brandSub}>潜空间 · 一份可以问的简历</span>
        </div>
        {/* 载入阶段不给机位按钮。它们直接调 requestStage，会绕过接入这一步。 */}
        {stage === "boot" ? null : (
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
        )}
        <p className={styles.hint} data-dim={dimHud ? "true" : undefined}>
          {/*
            前向传播时这行提示换成命中读数。另起一行会和机位按钮挤在一起，
            而这句话本来就是在说"现在正在发生什么"，换内容比加一处更合适。
          */}
          <span className={styles.hintText}>
            {stage === "forward" && hitReadout ? hitReadout : STAGE_COPY[stage].hint}
          </span>
        </p>
      </div>
      <GrainOverlay />
      {/* 四角压暗，视线被收到屏幕中央；也让画布边缘不再是一条死板的直边。 */}
      <div aria-hidden="true" className={styles.vignette} />
      <BootOverlay
        active={stage === "boot"}
        boot={boot}
        onAttach={() => requestStageRef.current("idle")}
      />
    </div>
  );
}
