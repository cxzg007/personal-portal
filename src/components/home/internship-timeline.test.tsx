import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { InternshipTimeline } from "./internship-timeline";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("internship timeline", () => {
  it("keeps every verified internship useful while its details are collapsed", () => {
    render(<InternshipTimeline internships={internships} />);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);

    internships.forEach((internship, index) => {
      const article = articles[index];
      const detailsId = `internship-${internship.id}-details`;

      expect(within(article).getByText(internship.company)).toBeVisible();
      expect(within(article).getByText(internship.role)).toBeVisible();
      expect(within(article).getByText(internship.period)).toBeVisible();
      expect(
        within(article)
          .getAllByText(internship.results[0])
          .some((element) => element.closest("[hidden]") === null),
      ).toBe(true);
      internship.stack.forEach((technology) => {
        expect(within(article).getByText(technology)).toBeVisible();
      });
      expect(within(article).getByText(internship.status)).toBeVisible();

      const button = within(article).getByRole("button", { name: "查看技术细节" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-controls", detailsId);
      expect(article.querySelector(`#${detailsId}`)).toHaveAttribute("hidden");
    });
  });

  it("reveals the complete technical narrative and keeps button semantics synchronized", async () => {
    const user = userEvent.setup();
    render(<InternshipTimeline internships={internships} />);

    const internship = internships[0];
    const article = screen.getAllByRole("article")[0];
    const button = within(article).getByRole("button", { name: "查看技术细节" });
    const details = article.querySelector(`#internship-${internship.id}-details`);

    button.focus();
    await user.keyboard("{Enter}");

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(details).toBeVisible();
    expect(within(details as HTMLElement).getByRole("heading", { name: "业务背景" })).toBeVisible();
    expect(within(details as HTMLElement).getByText(internship.context)).toBeVisible();
    expect(within(details as HTMLElement).getByRole("heading", { name: "关键行动" })).toBeVisible();
    internship.actions.forEach((action) => {
      expect(within(details as HTMLElement).getByText(action)).toBeVisible();
    });
    expect(within(details as HTMLElement).getByRole("heading", { name: "个人贡献" })).toBeVisible();
    expect(within(details as HTMLElement).getByText(internship.ownership)).toBeVisible();
    expect(within(details as HTMLElement).getByRole("heading", { name: "交付结果" })).toBeVisible();
    internship.results.forEach((result) => {
      expect(within(details as HTMLElement).getByText(result)).toBeVisible();
    });

    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(details).not.toBeVisible();
    expect(button).toHaveFocus();
  });
});
