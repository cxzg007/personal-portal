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
    for (const result of internship.results) {
      const matches = within(card).getAllByText(result);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toBeVisible();
    }
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
    expect(recordItems).toHaveLength(internship.highlights.length);
    internship.highlights.forEach((highlight, index) => {
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

  it("renders all six agibot capability records including both projects", () => {
    const internship = internships.find((item) => item.id === "agibot-agent");
    expect(internship).toBeDefined();
    render(<InternshipStoryCard internship={internship!} index={1} />);

    const records = within(screen.getByRole("article")).getByRole("list", {
      name: "智元机器人 能力建设记录",
    });
    const recordItems = within(records).getAllByRole("listitem");
    expect(recordItems).toHaveLength(internship!.highlights.length);
    expect(internship!.highlights).toHaveLength(6);
    internship!.highlights.forEach((highlight, index) => {
      expect(recordItems[index]).toHaveTextContent(highlight);
    });
    expect(records.textContent).toContain("clip-player");
    expect(records.textContent).toContain("agibot_retriever");
    expect(records.textContent).toContain("三级读取链路");
    expect(records.textContent).toContain("三级实体去重");
  });
});