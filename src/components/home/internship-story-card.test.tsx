import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { InternshipStoryCard } from "./internship-story-card";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("internship story card", () => {
  it("renders card at index 0 with copy-visual layout and full visible content", () => {
    const internship = internships[0];
    render(<InternshipStoryCard internship={internship} index={0} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("data-card-index", "0");
    expect(card).toHaveAttribute("data-layout", "copy-visual");
    expect(card).toHaveAttribute("data-brand", internship.logo.theme);
    expect(card.className).toContain("sticky-internship-card");

    expect(within(card).getByRole("img", { name: internship.logo.alt })).toBeVisible();
    expect(within(card).getByText(internship.company)).toBeVisible();
    expect(within(card).getByText(internship.team)).toBeVisible();
    expect(within(card).getByText(internship.role)).toBeVisible();
    expect(within(card).getByText(internship.period)).toBeVisible();
    expect(within(card).getByText(internship.valueHeadline)).toBeVisible();
    expect(within(card).getByText(internship.context)).toBeVisible();
    expect(within(card).getByText(internship.ownership)).toBeVisible();
    expect(within(card).getByText(internship.status)).toBeVisible();
    const resultMatches = within(card).getAllByText(internship.results[0]);
    expect(resultMatches.length).toBeGreaterThan(0);
    expect(resultMatches[0]).toBeVisible();
    for (const item of internship.stack) {
      expect(card.textContent).toContain(item);
    }

    const journey = within(card).getByRole("list", { name: `${internship.company} 工程旅程` });
    expect(within(journey).getAllByRole("listitem")).toHaveLength(3);
    for (const node of internship.journey) {
      expect(within(journey).getByText(node.label)).toBeVisible();
      expect(within(journey).getByText(node.detail)).toBeVisible();
    }

    const records = within(card).getByRole("list", {
      name: `${internship.company} 能力建设记录`,
    });
    expect(records.className).toContain("capability-records");
    const recordItems = within(records).getAllByRole("listitem");
    expect(recordItems).toHaveLength(3);
    internship.highlights.slice(0, 3).forEach((highlight, index) => {
      expect(recordItems[index]).toHaveTextContent(highlight);
    });

    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders card at index 1 with visual-copy layout", () => {
    const internship = internships[1];
    render(<InternshipStoryCard internship={internship} index={1} />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("data-card-index", "1");
    expect(card).toHaveAttribute("data-layout", "visual-copy");
    expect(card).toHaveAttribute("data-brand", internship.logo.theme);
    expect(card.className).toContain("sticky-internship-card");

    expect(within(card).getByRole("img", { name: internship.logo.alt })).toBeVisible();
    expect(within(card).getByRole("list", { name: "智元机器人 能力建设记录" })).toBeVisible();
    expect(within(card).getByText(internship.valueHeadline)).toBeVisible();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });
});