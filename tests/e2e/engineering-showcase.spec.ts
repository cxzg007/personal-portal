import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "本轮工程展厅按用户要求仅验收桌面版。");
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("keyboard seeking pauses playback and preserves the read-only boundary", async ({ page }) => {
  await page.goto("/");
  const replay = page.getByRole("region", { name: "Agent 任务回放", exact: true });
  const progress = replay.getByRole("slider", { name: "回放进度" });
  await replay.getByRole("button", { name: "播放回放" }).click();
  await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
  await progress.focus();
  await page.keyboard.press("Home");
  await expect(progress).toHaveValue("0");
  await expect(replay).toHaveAttribute("data-playing", "false");
  await page.keyboard.press("ArrowRight");
  await expect(progress).toHaveValue("1");

  await replay.getByRole("button", { name: "只读权限", exact: true }).click();
  await expect(progress).toHaveValue("0");
  await progress.focus();
  await page.keyboard.press("End");
  await expect(progress).toHaveValue("75");
  await expect(progress).toHaveAttribute("aria-valuetext", "75%，权限校验，写入已阻断");
  await expect(replay.getByRole("status")).toContainText("写入已阻断");
  await expect(replay.getByRole("button", { name: "跳转到提交结果" })).toBeDisabled();
  await expect(replay.getByRole("status")).not.toContainText("RESULT_SUBMITTED");

  await replay.getByRole("button", { name: "正常授权", exact: true }).click();
  await expect(progress).toHaveValue("0");
  await expect(replay).toHaveAttribute("data-playing", "false");
  await progress.focus();
  await page.keyboard.press("End");
  await expect(progress).toHaveValue("100");
  await expect(replay.getByRole("status")).toContainText("审查结果已提交（示例）");
  await replay.getByRole("button", { name: "重播回放" }).click();
  await expect(replay).toHaveAttribute("data-playing", "true");
  expect(Number(await progress.inputValue())).toBeLessThan(25);
});

test("playback stops at the scenario endpoint and when the exhibit leaves the viewport", async ({ page }) => {
  await page.goto("/");
  const replay = page.getByRole("region", { name: "Agent 任务回放", exact: true });
  const progress = replay.getByRole("slider", { name: "回放进度" });
  for (const [scenario, end] of [["只读权限", 75], ["正常授权", 100]] as const) {
    await replay.getByRole("button", { name: scenario, exact: true }).click();
    await progress.fill(String(end - 1));
    await replay.getByRole("button", { name: "播放回放" }).click();
    await expect(progress).toHaveValue(String(end));
    await expect(replay).toHaveAttribute("data-playing", "false");
  }
  await replay.getByRole("button", { name: "重播回放" }).click();
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(replay).toHaveAttribute("data-playing", "false");
  const stopped = await progress.inputValue();
  await replay.scrollIntoViewIfNeeded();
  await expect(progress).toHaveValue(stopped);
  await expect(replay.getByRole("button", { name: "播放回放" })).toBeVisible();
});

test("route navigation cleans up the exhibit and keeps blog typography independent", async ({ page }) => {
  await page.goto("/blog/graph-engineering-ontology");
  const typography = () => page.locator(".article-prose").evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, font: style.fontFamily, size: style.fontSize, lineHeight: style.lineHeight };
  });
  const before = await typography();
  await page.getByRole("link", { name: "返回首页" }).click();
  const replay = page.getByRole("region", { name: "Agent 任务回放", exact: true });
  await replay.getByRole("button", { name: "播放回放" }).click();
  await page.locator("#writing").getByRole("link", { name: "阅读文章：图工程之后：多智能体系统缺的是一层语义" }).click();
  await expect(page).toHaveURL(/\/blog\/graph-engineering-ontology$/);
  await expect(replay).toHaveCount(0);
  expect(await typography()).toEqual(before);
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgba(255, 255, 255, 0.94)");
  await page.getByRole("link", { name: "返回首页" }).click();
  await expect(replay.getByRole("slider", { name: "回放进度" })).toHaveValue("0");
  await expect(replay).toHaveAttribute("data-playing", "false");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the complete example is rendered with disabled controls and a static explanation", async ({ page }) => {
    await page.goto("/");
    const replay = page.getByRole("region", { name: "Agent 任务回放", exact: true });
    // Playwright text selectors omit noscript, even when scripting is disabled.
    await expect(replay.locator("noscript p")).toHaveText("当前为静态示例。启用 JavaScript 后可播放回放、切换权限场景。");
    await expect(replay.locator("noscript p")).toBeVisible();
    await expect(replay.getByRole("status")).toContainText("任务已进入回放队列");
    await expect(replay.locator("svg").first()).toBeVisible();
    for (const control of await replay.locator("button, input").all()) {
      await expect(control).toBeDisabled();
    }
    await expect(page.getByRole("link", { name: "查看实习", exact: true })).toHaveAttribute("href", "#internships");
  });
});
