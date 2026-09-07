import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { InternshipStoryCard } from "./internship-story-card";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("internship story card", () => {
  it("renders card at index 0 with copy-visual layout and condensed visible content", () => {
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
    for (const item of internship.stack) {
      expect(card.textContent).toContain(item);
    }

    const outcomes = within(card).getByRole("list", { name: `${internship.company} 核心成果` });
    expect(within(outcomes).getAllByRole("listitem")).toHaveLength(
      Math.min(3, internship.results.length),
    );
    for (const result of internship.results.slice(0, 3)) {
      const matches = within(outcomes).getAllByText(result);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toBeVisible();
    }

    const disclosure = within(card).getByText(`查看${internship.company}工程细节`);
    expect(disclosure.closest("details")).not.toHaveAttribute("open");
    expect(within(disclosure.closest("details")!).getAllByRole("listitem")).toHaveLength(
      internship.highlights.length,
    );

    const journey = within(card).getByRole("list", { name: `${internship.company} 工程旅程` });
    expect(within(journey).getAllByRole("listitem")).toHaveLength(3);
    for (const node of internship.journey) {
      expect(within(journey).getByText(node.label)).toBeVisible();
      expect(within(journey).getByText(node.detail)).toBeVisible();
    }

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
    expect(within(card).getByRole("list", { name: `${internship.company} 核心成果` })).toBeVisible();
    expect(within(card).getByText(`查看${internship.company}工程细节`)).toBeVisible();
    expect(within(card).getByText(internship.valueHeadline)).toBeVisible();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps all six agibot capability records including both projects inside the disclosure", () => {
    const internship = internships.find((item) => item.id === "agibot-agent");
    expect(internship).toBeDefined();
    render(<InternshipStoryCard internship={internship!} index={1} />);

    const card = screen.getByRole("article");
    const disclosure = within(card).getByText(`查看${internship!.company}工程细节`);
    const details = disclosure.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    const recordItems = within(details!).getAllByRole("listitem");
    expect(recordItems).toHaveLength(internship!.highlights.length);
    expect(internship!.highlights).toHaveLength(6);
    internship!.highlights.forEach((highlight, index) => {
      expect(recordItems[index]).toHaveTextContent(highlight);
    });
    expect(details!.textContent).toContain("clip-player");
    expect(details!.textContent).toContain("agibot_retriever");
    expect(details!.textContent).toContain("三级读取链路");
    expect(details!.textContent).toContain("三级实体去重");
  });
});