import { expect, type Locator } from "@playwright/test";

/**
 * Asserts the Semantica open-source credibility summary: three featured
 * merged PR links, the collapsed details holding the remaining merged PRs
 * (open contributions are intentionally not rendered), and the snapshot
 * footer.
 */
export async function expectSemanticaMapComplete(showcase: Locator): Promise<void> {
  const featuredLinks = showcase
    .getByRole("list", { name: "Semantica 代表性贡献" })
    .getByRole("link", { name: /^已合并 · PR #/ });
  await expect(featuredLinks).toHaveCount(3);
  for (const [index, number] of [1077, 1226, 1096].entries()) {
    await expect(featuredLinks.nth(index)).toHaveAttribute(
      "href",
      `https://github.com/semantica-agi/semantica/pull/${number}`,
    );
  }

  const remainingLinks = showcase
    .getByRole("list", { name: "Semantica 其余已合并贡献", includeHidden: true })
    .getByRole("link", { name: /^已合并 · PR #/, includeHidden: true });
  await expect(remainingLinks).toHaveCount(7);

  const details = showcase.locator("details.open-source-showcase-details");
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute("open");

  await expect(
    showcase.getByText("截至 2026-09-04：10 个贡献已合并"),
  ).toBeVisible();
}