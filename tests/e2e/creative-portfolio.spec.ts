import { expect, test, type Page } from "@playwright/test";

// Task 2（首屏动态语义网络）验收：真实浏览器中验证两个滚动位置的 SVG
// 节点坐标与连线端点变化、live preference 切换、路由往返无重复监听和
// 残留样式。断言读取 driver 写入的真实几何属性（transform / x1..y2），
// 而非仅检查 data-motion 标记。
// 核心节点坐标取自 src/lib/hero-network.ts 的 CORE_SEEDS 固定表。
const CORE_POINTS = {
  understand: { collapsed: { x: 72, y: 180 }, initial: { x: 96, y: 90 } },
  retrieve: { collapsed: { x: 210, y: 180 }, initial: { x: 238, y: 238 } },
} as const;

interface Point {
  x: number;
  y: number;
}

interface HeroGeometry {
  top: number;
  height: number;
  scrollY: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// 与 src/lib/hero-network.ts interpolatePoint 相同的插值公式（collapsed → initial）。
function expectedCorePoint(
  id: keyof typeof CORE_POINTS,
  progress: number,
): Point {
  const node = CORE_POINTS[id];
  const t = clamp01(progress);
  const eased = t * t * (3 - 2 * t);
  return {
    x: node.collapsed.x + (node.initial.x - node.collapsed.x) * eased,
    y: node.collapsed.y + (node.initial.y - node.collapsed.y) * eased,
  };
}

async function readHeroGeometry(page: Page): Promise<HeroGeometry> {
  return page.evaluate(() => {
    const hero = document.getElementById("profile");
    if (!hero) throw new Error("#profile hero section missing");
    const bounds = hero.getBoundingClientRect();
    return { top: bounds.top, height: bounds.height, scrollY: window.scrollY };
  });
}

// 与 getHeroProgress 一致：hero 顶部滚出视口越多，progress 越接近 1。
function heroProgress(geometry: HeroGeometry): number {
  return clamp01(-geometry.top / Math.max(1, geometry.height * 0.55));
}

async function readNodeTransform(page: Page, id: string): Promise<Point | null> {
  return page.evaluate((nodeId) => {
    const node = document.querySelector(`[data-network-node="${nodeId}"]`);
    const transform = node?.getAttribute("transform") ?? "";
    const match = transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) return null;
    return { x: Number(match[1]), y: Number(match[2]) };
  }, id);
}

async function expectNodeNear(
  page: Page,
  id: string,
  point: Point,
  tolerance = 0.5,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const actual = await readNodeTransform(page, id);
        if (!actual) return Number.POSITIVE_INFINITY;
        return Math.max(Math.abs(actual.x - point.x), Math.abs(actual.y - point.y));
      },
      { timeout: 5_000 },
    )
    .toBeLessThanOrEqual(tolerance);
}

// 连线端点必须与两端节点的真实坐标一致（连通性不变量）。
async function expectEdgeNear(
  page: Page,
  fromId: string,
  toId: string,
  fromPoint: Point,
  toPoint: Point,
  tolerance = 0.5,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const coords = await page.evaluate(
          ([f, t]) => {
            const line = document.querySelector(
              `[data-network-from="${f}"][data-network-to="${t}"]`,
            );
            if (!line) return null;
            return {
              x1: Number(line.getAttribute("x1")),
              y1: Number(line.getAttribute("y1")),
              x2: Number(line.getAttribute("x2")),
              y2: Number(line.getAttribute("y2")),
            };
          },
          [fromId, toId],
        );
        if (!coords) return Number.POSITIVE_INFINITY;
        return Math.max(
          Math.abs(coords.x1 - fromPoint.x),
          Math.abs(coords.y1 - fromPoint.y),
          Math.abs(coords.x2 - toPoint.x),
          Math.abs(coords.y2 - toPoint.y),
        );
      },
      { timeout: 5_000 },
    )
    .toBeLessThanOrEqual(tolerance);
}

test("scroll position drives semantic network geometry and edge endpoints", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced network motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  const svg = page.locator("[data-hero-network]");
  await expect(svg).toHaveAttribute("data-network-running", "true");

  // 触发一次 scroll 立即结束入场动画，锁定滚动驱动路径。
  await page.evaluate(() => window.scrollTo(0, 1));

  // 位置一：页面顶部。
  const topGeometry = await readHeroGeometry(page);
  const topProgress = heroProgress(topGeometry);
  const topUnderstand = expectedCorePoint("understand", topProgress);
  const topRetrieve = expectedCorePoint("retrieve", topProgress);
  await expectNodeNear(page, "understand", topUnderstand);
  await expectEdgeNear(page, "understand", "retrieve", topUnderstand, topRetrieve);
  const topTransform = await readNodeTransform(page, "understand");

  // 位置二：hero 中段（progress 约 0.6）。
  const targetScroll = topGeometry.height * 0.55 * 0.6 + 1;
  await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
  const midGeometry = await readHeroGeometry(page);
  const midProgress = heroProgress(midGeometry);
  expect(midProgress).toBeGreaterThan(topProgress);
  const midUnderstand = expectedCorePoint("understand", midProgress);
  const midRetrieve = expectedCorePoint("retrieve", midProgress);
  await expectNodeNear(page, "understand", midUnderstand);
  await expectEdgeNear(page, "understand", "retrieve", midUnderstand, midRetrieve);

  // 两个滚动位置的真实坐标必须不同。
  const midTransform = await readNodeTransform(page, "understand");
  expect(midTransform).not.toEqual(topTransform);

  // 入场结束后几何稳定：无自行续帧、无残留动画。
  const stableFirst = await readNodeTransform(page, "understand");
  await page.waitForTimeout(350);
  const stableSecond = await readNodeTransform(page, "understand");
  expect(stableSecond).toEqual(stableFirst);
});

test("pointer proximity highlights the nearest core node and its incident edges", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced network motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  const svg = page.locator("[data-hero-network]");
  await expect(svg).toHaveAttribute("data-network-running", "true");
  await page.evaluate(() => window.scrollTo(0, 1));

  // 将 viewBox 中 understand 节点的当前坐标映射回屏幕坐标（与 driver
  // highlight 的 preserveAspectRatio 映射一致）。
  const target = await page.evaluate(() => {
    const svg = document.querySelector("[data-hero-network]");
    const node = document.querySelector('[data-network-node="understand"]');
    if (!svg || !node) return null;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / 560, rect.height / 360);
    const offsetX = (rect.width - 560 * scale) / 2;
    const offsetY = (rect.height - 360 * scale) / 2;
    const match = (node.getAttribute("transform") ?? "").match(
      /translate\(([-\d.]+) ([-\d.]+)\)/,
    );
    if (!match) return null;
    return {
      x: rect.left + offsetX + Number(match[1]) * scale,
      y: rect.top + offsetY + Number(match[2]) * scale,
    };
  });
  expect(target).not.toBeNull();

  await page.mouse.move(target!.x, target!.y);
  await expect(page.locator('[data-network-node="understand"]')).toHaveAttribute(
    "data-network-highlight",
  );
  // understand 的邻边：1 条核心链路 + 3 条辅助连线。
  await expect(page.locator("[data-network-edge-active]")).toHaveCount(4);

  // 指针离开 hero 后高亮清除。
  await page.mouse.move(4, 4);
  await expect(page.locator("[data-network-highlight]")).toHaveCount(0);
  await expect(page.locator("[data-network-edge-active]")).toHaveCount(0);
});

test("reduced-motion live toggle pauses and restores the network without replaying the intro", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced network motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  const svg = page.locator("[data-hero-network]");
  await expect(svg).toHaveAttribute("data-network-running", "true");

  const geometry = await readHeroGeometry(page);
  const targetScroll = geometry.height * 0.55 * 0.6 + 1;
  await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
  const midGeometry = await readHeroGeometry(page);
  const midProgress = heroProgress(midGeometry);
  expect(midProgress).toBeGreaterThan(0);
  expect(midProgress).toBeLessThan(1);
  const expectedMid = expectedCorePoint("understand", midProgress);
  await expectNodeNear(page, "understand", expectedMid);

  // live 切换到 reduced-motion：driver 销毁、恢复静态收拢几何。
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "static");
  await expect(svg).not.toHaveAttribute("data-network-running");
  await expectNodeNear(page, "understand", CORE_POINTS.understand.collapsed);

  // live 切回：恢复当前滚动进度对应的几何，不闪回初始散点、不重播入场。
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-profile-motion", "enhanced");
  await expect(svg).toHaveAttribute("data-network-running", "true");
  await expectNodeNear(page, "understand", expectedMid);
  const restored = await readNodeTransform(page, "understand");
  expect(Math.abs(restored!.x - CORE_POINTS.understand.initial.x)).toBeGreaterThan(1);
});

test("route round-trip keeps a single network driver without residual listeners", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced network motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  const svg = page.locator("[data-hero-network]");
  await expect(svg).toHaveCount(1);
  await expect(svg).toHaveAttribute("data-network-running", "true");

  await page.goto("/blog");
  await expect(svg).toHaveCount(0);

  await page.goBack();
  await expect(svg).toHaveCount(1);
  await expect(svg).toHaveAttribute("data-network-running", "true");
  const runningCount = await page.evaluate(
    () => document.querySelectorAll("[data-network-running]").length,
  );
  expect(runningCount).toBe(1);

  // 往返后滚动仍能驱动几何更新（监听在新文档上重新生效、无重复写入）。
  await page.evaluate(() => window.scrollTo(0, 1));
  const geometry = await readHeroGeometry(page);
  const targetScroll = geometry.height * 0.55 * 0.6 + 1;
  await page.evaluate((y) => window.scrollTo(0, y), targetScroll);
  const midGeometry = await readHeroGeometry(page);
  await expectNodeNear(
    page,
    "understand",
    expectedCorePoint("understand", heroProgress(midGeometry)),
  );
  // 无残留的 pointer 高亮样式。
  await expect(page.locator("[data-network-highlight]")).toHaveCount(0);
});

test("scrolling out and back to the top restores the same network geometry without jumps", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "enhanced network motion requires a viewport wider than 760px",
  );
  await page.goto("/");

  const svg = page.locator("[data-hero-network]");
  await expect(svg).toHaveAttribute("data-network-running", "true");
  // 触发一次 scroll 结束入场动画，锁定滚动驱动路径。
  await page.evaluate(() => window.scrollTo(0, 1));

  // 开始滚动前的顶部基线：progress 0 的几何。
  const topGeometry = await readHeroGeometry(page);
  const topProgress = heroProgress(topGeometry);
  const topUnderstand = expectedCorePoint("understand", topProgress);
  const topRetrieve = expectedCorePoint("retrieve", topProgress);
  await expectNodeNear(page, "understand", topUnderstand);
  await expectEdgeNear(page, "understand", "retrieve", topUnderstand, topRetrieve);
  const topTransform = await readNodeTransform(page, "understand");

  // 滚出 hero（progress 收敛到 1），网络进入完整展开状态。
  const heroAbsTop = topGeometry.top + topGeometry.scrollY;
  const deepScroll = heroAbsTop + topGeometry.height * 0.55 * 1.05;
  await page.evaluate((y) => window.scrollTo(0, y), deepScroll);
  const deepGeometry = await readHeroGeometry(page);
  expect(heroProgress(deepGeometry)).toBeGreaterThanOrEqual(0.99);
  await expectNodeNear(page, "understand", CORE_POINTS.understand.initial);

  // 返回顶部：几何必须回到与起始顶部一致的位置（无突跳、无残留状态）。
  await page.evaluate(() => window.scrollTo(0, 0));
  const restoredGeometry = await readHeroGeometry(page);
  await expectNodeNear(
    page,
    "understand",
    expectedCorePoint("understand", heroProgress(restoredGeometry)),
  );
  await expectNodeNear(page, "understand", topUnderstand);
  const restoredTransform = await readNodeTransform(page, "understand");
  // 返回顶部后的几何必须与起始顶部一致。transform 属性解析存在亚像素抖动
  // （实测 <0.01px），属于噪声；真正的突跳会是整段插值距离（数十像素）。
  expect(restoredTransform).not.toBeNull();
  expect(topTransform).not.toBeNull();
  expect(Math.abs(restoredTransform!.x - topTransform!.x)).toBeLessThanOrEqual(0.1);
  expect(Math.abs(restoredTransform!.y - topTransform!.y)).toBeLessThanOrEqual(0.1);

  // driver 在整个往返过程中保持单实例运行。
  await expect(svg).toHaveAttribute("data-network-running", "true");
  const runningCount = await page.evaluate(
    () => document.querySelectorAll("[data-network-running]").length,
  );
  expect(runningCount).toBe(1);
});