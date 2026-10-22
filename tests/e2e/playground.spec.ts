import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop experiment; mobile adaptation is outside scope");
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("the homepage offers the local experiment without loading its 3D runtime", async ({ page }) => {
  const sceneRequests: string[] = [];
  page.on("request", (request) => {
    if (/\.(glb|wasm)(\?|$)|experiments\/henry\/(room|desktop)\//.test(request.url())) {
      sceneRequests.push(request.url());
    }
  });
  await page.goto("/");
  const experiment = page.getByRole("article", { name: "复古电脑房间" });
  await expect(experiment).toBeVisible();
  await expect(page.getByRole("link", { name: "进入实验 · Enter the prototype" })).toHaveAttribute("href", "/lab/latent");
  await expect(experiment).not.toContainText(/Henry|Heffernan|Credits/i);
  await expect(experiment.getByRole("link", { name: "进入 3D 空间" })).toHaveAttribute("href", "/playground");
  await experiment.getByRole("img").scrollIntoViewIfNeeded();
  await expect.poll(() => experiment.getByRole("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(sceneRequests).toEqual([]);
});

test("the room boots before downloading monitor videos and plays them after START", async ({ page }) => {
  const videos = new Set<string>();
  page.on("request", (request) => {
    if (request.url().includes("/textures/monitor/video/")) videos.add(request.url());
  });
  await page.goto("/playground");
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
  await page.goto("/playground");
  await expect(page.getByRole("button", { name: "3D 房间" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", "/experiments/henry/room/index.html");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 20000 });
  await page.frameLocator("iframe").getByRole("button", { name: "START", exact: true }).click();
  await page.getByRole("button", { name: "2D 桌面" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", "/experiments/henry/desktop/index.html");
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true }).first()).toBeVisible({ timeout: 30000 });
  await expect(page.frameLocator("iframe").getByText("Credits", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await page.getByRole("link", { name: "返回主页" }).click();
  await expect(page).toHaveURL(/\/#playground$/);
});

test("reduced motion opens the 2D desktop first", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/playground");
  await expect(page.getByRole("button", { name: "2D 桌面" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a failed 3D asset offers a working 2D fallback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/models/World/environment.glb", (route) => route.abort());
  await page.goto("/playground");
  await expect(page.locator("main").getByRole("alert")).toContainText("暂时无法打开房间", { timeout: 15000 });
  await page.getByRole("button", { name: "进入 2D 桌面" }).click();
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a failed desktop inside the monitor also offers recovery", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/desktop/app.js", (route) => route.abort());
  await page.goto("/playground");
  await expect(page.locator("main").getByRole("alert")).toContainText("暂时无法打开房间", { timeout: 10000 });
  await page.unroute("**/desktop/app.js");
  await page.getByRole("button", { name: "进入 2D 桌面" }).click();
  await expect(page.frameLocator("iframe").getByText("Jiang Junjie", { exact: true })).toBeVisible();
});
