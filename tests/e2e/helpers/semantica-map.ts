import { expect, type Locator } from "@playwright/test";

export async function expectSemanticaMapComplete(map: Locator): Promise<void> {
  await expect(map.getByRole("button", { name: /^架构支柱/ })).toHaveCount(6);
  await expect(map.getByTestId("merged-contribution")).toHaveCount(10);
  await expect(map.getByRole("link", { name: /^PR #/ })).toHaveCount(10);
  await expect(map.getByRole("link", { name: /PR #1226/ })).toHaveAttribute(
    "href",
    /\/pull\/1226$/,
  );
}