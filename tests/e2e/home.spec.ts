import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("AI Agent / 后端开发")).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习经历" })).toHaveAttribute("href", "#internships");
  await expect(page.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
});
