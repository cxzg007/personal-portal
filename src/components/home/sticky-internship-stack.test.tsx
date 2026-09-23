import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { StickyInternshipStack } from "./sticky-internship-stack";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("sticky internship stack", () => {
  it("renders three static story cards without disclosure interaction", () => {
    const { container } = render(<StickyInternshipStack internships={internships} />);

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAttribute("data-card-index", "0");
    expect(cards[0]).not.toHaveAttribute("data-layout");
    expect(within(cards[0]).getByRole("img", { name: internships[0].logo.alt })).toBeVisible();
    expect(within(cards[0]).getByRole("list", { name: "京东 技术栈" })).toBeVisible();
    expect(within(cards[0]).getByText("查看京东工程细节")).toBeVisible();
    expect(within(cards[0]).queryByRole("button", { name: /技术细节/ })).not.toBeInTheDocument();
    expect(container.querySelector("section.sticky-internship-stack")).not.toBeNull();
  });

  it("exposes every internship through the editorial summary and closed details", () => {
    render(<StickyInternshipStack internships={internships} />);

    const cards = screen.getAllByRole("article");
    cards.forEach((card, index) => {
      const internship = internships[index];
      expect(card).toHaveAttribute("data-card-index", String(index));
      expect(card).toHaveAttribute("data-brand", internship.logo.theme);

      expect(within(card).getByRole("img", { name: internship.logo.alt })).toBeVisible();
      expect(within(card).getByText(internship.company)).toBeVisible();
      expect(within(card).getByText(internship.role)).toBeVisible();
      expect(within(card).getByText(internship.period)).toBeVisible();

      expect(within(card).getByText(internship.presentation.title)).toBeVisible();
      expect(within(card).getByText(internship.presentation.contribution)).toBeVisible();
      expect(within(card).getByText(internship.presentation.outcome)).toBeVisible();

      const details = card.querySelector("details.internship-details") as HTMLElement;
      expect(details).not.toBeNull();
      expect(details).not.toHaveAttribute("open");
      expect(within(details).getByText(internship.team)).toBeInTheDocument();

      const records = within(details).getByRole("list", {
        name: `${internship.company} 能力建设记录`,
      });
      expect(records.className).toContain("capability-records");
      const recordItems = within(records).getAllByRole("listitem");
      expect(recordItems).toHaveLength(3);
      internship.presentation.details.forEach((detail, recordIndex) => {
        expect(recordItems[recordIndex]).toHaveTextContent(detail);
      });

      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    });
  });
});