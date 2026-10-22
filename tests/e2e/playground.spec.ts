import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop experiment; mobile adaptation is outside scope");
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("the detailed portfolio stays independent of the room runtime", async ({ page }) => {
  const sceneRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.(glb|wasm)(\?|$)|experiments\/henry\/(room|desktop)\//.test(request.url())) {
      sceneRequests.push(request.url());
    }
  });
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "cxzg007", exact: true })).toBeVisible();
  await expect(page.getByText("潜空间", { exact: true })).toHaveCount(0);
  await expect(page.locator("#lab")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "房间" })).toHaveAttribute("href", "/");
  expect(sceneRequests).toEqual([]);
});

test("learn more is usable while the entrance is still loading", async ({ page }) => {
  await page.route("**/models/World/environment.glb", () => {});
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status")).toBeVisible();
  await page.getByRole("link", { name: "了解更多" }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "cxzg007", exact: true })).toBeVisible();
});

test("learn more works without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "了解更多" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { name: "cxzg007", exact: true })).toBeVisible();
    await expect(page.locator("#internships")).toContainText("京东");
  } finally {
    await context.close();
  }
});

test("the old experiment redirects and latent routes are removed", async ({ request }) => {
  const oldRoom = await request.get("/playground", { maxRedirects: 0 });
  expect(oldRoom.status()).toBe(308);
  expect(oldRoom.headers().location).toBe("/");
  for (const path of ["/lab/latent", "/lab/latent/terminal", "/lab/latent-poster.webp"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});

test("the room boots before downloading monitor videos and plays them after START", async ({ page }) => {
  const videos = new Set<string>();
  page.on("request", (request) => {
    if (request.url().includes("/textures/monitor/video/")) videos.add(request.url());
  });
  await page.goto("/");
  const room = page.frameLocator("iframe");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 20000 });
  await expect(room.getByRole("button", { name: "START", exact: true })).toBeEnabled();
  expect(videos.size).toBe(0);
  await room.getByRole("button", { name: "START", exact: true }).click();
  await expect.poll(() => videos.size).toBe(2);
  await expect.poll(() => room.locator("video").evaluateAll((elements) =>
    elements.every((element) => (element as HTMLVideoElement).readyState >= 2 && !(element as HTMLVideoElement).paused),
  )).toBe(true);
});

test("the experiment switches between locally hosted room and desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "3D 房间" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", "/experiments/henry/room/index.html");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 20000 });
  await page.frameLocator("iframe").getByRole("button", { name: "START", exact: true }).click();
  await page.getByRole("button", { name: "2D 桌面" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", "/experiments/henry/desktop/index.html");
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.frameLocator("iframe").getByText("Credits", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("link", { name: "了解更多" }).click();
  await expect(page).toHaveURL(/\/about$/);
});

test("reduced motion opens the 2D desktop first", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "2D 桌面" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a failed 3D asset offers a working 2D fallback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/models/World/environment.glb", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("main").getByRole("alert")).toContainText("暂时无法打开房间", { timeout: 15000 });
  await page.getByRole("button", { name: "进入 2D 桌面" }).click();
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a failed desktop inside the monitor also offers recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/desktop/app.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("main").getByRole("alert")).toContainText("暂时无法打开房间", { timeout: 10000 });
  await page.unroute("**/desktop/app.js");
  await page.getByRole("button", { name: "进入 2D 桌面" }).click();
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true })).toBeVisible();
});

test("Projects presents the open-source contribution record", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const desktop = page.frameLocator("iframe");
  await desktop.getByRole("link", { name: "PROJECTS", exact: true }).click();
  const projects = desktop.getByRole("article");
  await expect(projects.getByRole("heading", { name: "Semantica", exact: true })).toBeVisible();
  await expect(projects).toContainText("项目维护者");
  await expect(projects).toContainText("截至 2026-10-16 · 19 个 PR 已合并 · 1 个 PR 进行中");
  await expect(projects.getByRole("heading", { name: "真值维护与时态一致性" })).toBeVisible();
  await expect(projects.getByRole("link", { name: "PR #1831", exact: false })).toHaveAttribute("href", "https://github.com/semantica-agi/semantica/pull/1831");
  await expect(projects.locator('a[href*="/pull/"]')).toHaveCount(20);
  await expect(projects).not.toContainText("机器人多传感器数据流式回放平台");
  await expect(projects).not.toContainText("本体驱动的数据资产治理与 Agent 动作平台");
});
