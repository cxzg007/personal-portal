import { expect, type Locator } from "@playwright/test";

export async function expectSemanticaMapComplete(map: Locator): Promise<void> {
  await expect(map.getByRole("button", { name: /^能力节点/ })).toHaveCount(5);
  await expect(map.getByTestId("contribution-domain")).toHaveCount(6);
  await expect(map.getByRole("link", { name: /^PR #/ })).toHaveCount(13);
  await expect(map.getByRole("link", { name: /PR #1208/ })).toHaveAttribute(
    "href",
    /\/pull\/1208$/,
  );
}