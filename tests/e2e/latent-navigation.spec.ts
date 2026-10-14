import { expect, test } from "@playwright/test";

test("content layers remain readable in both camera views and open the matching entry", async ({ page }) => {
  test.skip(test.info().project.name !== "chromium", "Spatial navigation is a desktop interaction");
  await page.goto("/lab/latent");
  await page.getByRole("button", { name: /接入 · attach/i }).click();

  const labels = page.getByRole("navigation", { name: "按内容层浏览" });
  const buttons = labels.getByRole("button");
  await expect(buttons).toHaveCount(5);

  async function checkLabels() {
    const boxes = [];
    for (let layer = 3; layer <= 7; layer += 1) {
      const label = labels.getByRole("button", { name: new RegExp(`第 ${layer} 层`) });
      await expect(label).toBeVisible();
      await expect(label).toBeInViewport({ ratio: 1 });
      boxes.push((await label.boundingBox())!);
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const horizontal = Math.min(boxes[i].x + boxes[i].width, boxes[j].x + boxes[j].width) - Math.max(boxes[i].x, boxes[j].x);
        const vertical = Math.min(boxes[i].y + boxes[i].height, boxes[j].y + boxes[j].height) - Math.max(boxes[i].y, boxes[j].y);
        expect(horizontal <= 0 || vertical <= 0).toBe(true);
      }
    }
  }

  await checkLabels();
  await page.getByRole("button", { name: /中景 \/ approach/i }).click();
  await checkLabels();

  const openSource = labels.getByRole("button", { name: /第 6 层：开源/ });
  await openSource.focus();
  await expect(openSource).toHaveAttribute("data-active", "true");
  await page.keyboard.press("Enter");
  const terminal = page.frameLocator("iframe");
  await expect(terminal.getByText("开源维护与贡献 · open source", { exact: false })).toBeVisible();
  await expect(terminal.getByRole("tab", { name: /开源 oss/ })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: /远景 \/ overview/i }).click();
  await labels.getByRole("button", { name: /第 4 层：实习/ }).click();
  await expect(terminal.getByText("实习经历 · internships", { exact: false })).toBeVisible();
  await expect(terminal.getByRole("tab", { name: /实习 internship/ })).toHaveAttribute("aria-selected", "true");
});

test("the question flight and article navigation still work", async ({ page }) => {
  test.skip(test.info().project.name !== "chromium", "Spatial navigation is a desktop interaction");
  await page.goto("/lab/latent");
  await page.getByRole("button", { name: /接入 · attach/i }).click();
  await page.getByRole("button", { name: /终端 \/ terminal/i }).click();
  const terminal = page.frameLocator("iframe");
  const prompt = terminal.getByRole("textbox", { name: "向索引提问" });
  await prompt.fill("你在京东做了什么");
  await prompt.press("Enter");
  await expect(terminal.getByText("京东 · AI 数据智能平台", { exact: false })).toBeVisible({ timeout: 15000 });
  await terminal.getByRole("link", { name: /读全文/ }).first().click();
  await expect(page).toHaveURL(/\/#internships$/);
});
