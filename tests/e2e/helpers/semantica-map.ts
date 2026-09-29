import { expect, type Locator } from "@playwright/test";

/** All current PRs have one home: the six-node map or the supplemental disclosure. */
export async function expectSemanticaMapComplete(showcase: Locator): Promise<void> {
  const map = showcase.getByRole("figure", { name: "贡献落点图" });
  await expect(map).toBeVisible();
  await expect(map.locator("li[data-status]")).toHaveCount(6);
  const mapLinks = map.getByRole("link", { name: /^已合并 · PR #/ });
  await expect(mapLinks).toHaveCount(7);
  for (const [index, number] of [1226, 1243, 1077, 1096, 1675, 1544, 1556].entries()) {
    await expect(mapLinks.nth(index)).toHaveAttribute("href", `https://github.com/semantica-agi/semantica/pull/${number}`);
  }
  const allPrHrefs = await showcase.locator('a[href*="/pull/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(allPrHrefs).toHaveLength(19);
  expect(new Set(allPrHrefs).size).toBe(19);

  const remainingLinks = showcase
    .getByRole("list", { name: "Semantica 其余已合并贡献", includeHidden: true })
    .getByRole("link", { name: /^已合并 · PR #/, includeHidden: true });
  await expect(remainingLinks).toHaveCount(11);

  const details = showcase.locator("details.open-source-showcase-details");
  await expect(details).toBeVisible();
  await expect(details).not.toHaveAttribute("open");
  await expect(map.getByRole("link", { name: /^进行中 · PR #1731/ })).toBeVisible();

  await expect(
    showcase.getByText("截至 2026-09-28：18 个贡献已合并"),
  ).toBeVisible();
}
