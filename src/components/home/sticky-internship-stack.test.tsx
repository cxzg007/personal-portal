import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { StickyInternshipStack } from "./sticky-internship-stack";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("sticky internship stack", () => {
  it("renders three story cards with alternating layouts and no disclosure interaction", () => {
    const { container } = render(<StickyInternshipStack internships={internships} />);

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveAttribute("data-card-index", "0");
    expect(within(cards[0]).getByRole("img", { name: internships[0].logo.alt })).toBeVisible();
    expect(within(cards[0]).getByRole("list", { name: "京东 能力建设记录" })).toBeVisible();
    expect(within(cards[0]).queryByRole("button", { name: /技术细节/ })).not.toBeInTheDocument();

    expect(cards[1]).toHaveAttribute("data-card-index", "1");
    expect(cards[1]).toHaveAttribute("data-layout", "visual-copy");
    expect(cards[2]).toHaveAttribute("data-card-index", "2");
    expect(cards[2]).toHaveAttribute("data-layout", "copy-visual");
    expect(container.querySelector("section#internships")).not.toBeNull();
  });

  it("exposes every internship fully via static visible content", () => {
    render(<StickyInternshipStack internships={internships} />);

    const cards = screen.getAllByRole("article");
    cards.forEach((card, index) => {
      const internship = internships[index];
      expect(card).toHaveAttribute("data-card-index", String(index));
      expect(card).toHaveAttribute("data-brand", internship.logo.theme);

      expect(within(card).getByRole("img", { name: internship.logo.alt })).toBeVisible();
      expect(within(card).getByText(internship.company)).toBeVisible();
      expect(within(card).getByText(internship.team)).toBeVisible();
      expect(within(card).getByText(internship.role)).toBeVisible();
      expect(within(card).getByText(internship.period)).toBeVisible();
      expect(within(card).getByText(internship.valueHeadline)).toBeVisible();
      const resultMatches = within(card).getAllByText(internship.results[0]);
      expect(resultMatches.length).toBeGreaterThan(0);
      expect(resultMatches[0]).toBeVisible();

      const journey = within(card).getByRole("list", { name: `${internship.company} 工程旅程` });
      expect(within(journey).getAllByRole("listitem")).toHaveLength(3);
      for (const node of internship.journey) {
        expect(within(journey).getByText(node.label)).toBeVisible();
      }

      const records = within(card).getByRole("list", {
        name: `${internship.company} 能力建设记录`,
      });
      expect(records.className).toContain("capability-records");
      const recordItems = within(records).getAllByRole("listitem");
      expect(recordItems).toHaveLength(3);
      internship.highlights.slice(0, 3).forEach((highlight, recordIndex) => {
        expect(recordItems[recordIndex]).toHaveTextContent(highlight);
      });

      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
    });
  });
});