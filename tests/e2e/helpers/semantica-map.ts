import { expect, type Locator } from "@playwright/test";

/**
 * Asserts the static Semantica open-source showcase: ten merged PR links
 * (open contributions are intentionally not rendered) and the snapshot footer.
 */
export async function expectSemanticaMapComplete(showcase: Locator): Promise<void> {
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