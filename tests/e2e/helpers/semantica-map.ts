import { expect, type Locator } from "@playwright/test";

/**
 * Asserts the Semantica open-source credibility summary: four resume-aligned
 * contribution themes with their merged PR chips, the collapsed details holding
 * the remaining merged PRs (open contributions are intentionally not rendered),
 * and the snapshot footer.
 */
export async function expectSemanticaMapComplete(showcase: Locator): Promise<void> {
  const themeList = showcase.getByRole("list", { name: "Semantica 贡献主题" });
  await expect(themeList).toBeVisible();
  await expect(themeList.locator("> li.open-source-theme-item")).toHaveCount(4);
  for (const themeId of [
    "rule-reasoning",
    "truth-maintenance",
    "sparql-execution",
    "pipeline-parallelism",
  ]) {
    await expect(themeList.locator(`[data-theme-id="${themeId}"]`)).toBeVisible();
  }

  const themeLinks = themeList.getByRole("link", { name: /^已合并 · PR #/ });
  await expect(themeLinks).toHaveCount(6);
  for (const [index, number] of [1096, 1077, 1556, 1544, 1243, 1226].entries()) {
    await expect(themeLinks.nth(index)).toHaveAttribute(
      "href",
      `https://github.com/semantica-agi/semantica/pull/${number}`,
    );
  }

  const remainingLinks = showcase
    .getByRole("list", { name: "Semantica 其余已合并贡献", includeHidden: true })
    .getByRole("link", { name: /^已合并 · PR #/, includeHidden: true });
  await expect(remainingLinks).toHaveCount(11);

  const details = showcase.locator("details.open-source-showcase-details");
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute("open");

  await expect(
    showcase.getByText("截至 2026-09-20：17 个贡献已合并"),
  ).toBeVisible();
}