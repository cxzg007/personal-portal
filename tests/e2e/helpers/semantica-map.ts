import { expect, type Locator } from "@playwright/test";

const layerTitles = ["数据与知识层", "推理层", "治理层", "决策层"];

const layerCapabilityLabels = [
  "上下文管理",
  "知识建模",
  "确定性推理",
  "本体治理",
  "决策智能",
];

/**
 * Asserts the complete static Semantica architecture showcase: four stacked
 * layers, five layer capabilities plus the spanning traceability rail, ten
 * merged PR links (open contributions are intentionally not rendered), and the
 * snapshot footer.
 */
export async function expectSemanticaMapComplete(showcase: Locator): Promise<void> {
  const map = showcase.getByRole("region", { name: "Semantica 核心架构" });

  await expect(map).toBeVisible();
  await expect(map.locator(".arch-layer")).toHaveCount(4);
  await expect(map.locator(".arch-layer-title")).toHaveText(layerTitles);

  await expect(map.locator(".arch-capability")).toHaveCount(5);
  for (const label of layerCapabilityLabels) {
    await expect(map.locator(".arch-capability").filter({ hasText: label })).toHaveCount(1);
  }

  await expect(map.locator(".arch-spanning")).toHaveCount(1);
  await expect(map.locator(".arch-spanning")).toHaveText("端到端溯源");

  const prLinks = showcase
    .getByRole("list", { name: "Semantica 已合并贡献" })
    .getByRole("link", { name: /^PR #/ });
  await expect(prLinks).toHaveCount(10);
  await expect(showcase.getByRole("link", { name: /PR #1226/ })).toHaveAttribute(
    "href",
    /\/pull\/1226$/,
  );
  await expect(
    showcase.getByText("截至 2026-09-04：10 个贡献已合并"),
  ).toBeVisible();
}