import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { InternshipStoryCard } from "./internship-story-card";

const { internships } = loadSiteContent();

afterEach(cleanup);

describe("internship story card", () => {
  it.each(internships.map((internship, index) => ({ internship, index })))(
    "renders a static editorial entry for $internship.company",
    ({ internship, index }) => {
      const view = render(<InternshipStoryCard internship={internship} index={index} />);
      const card = screen.getByRole("article");

      expect(card).toHaveAttribute("data-card-index", String(index));
      expect(card).toHaveAttribute("data-brand", internship.logo.theme);
      expect(card.className).toContain("sticky-internship-card");
      expect(card).not.toHaveAttribute("data-layout");
      expect(card.querySelector("figure[data-engineering-kind]")).toBeNull();

      expect(within(card).getByRole("img", { name: internship.logo.alt })).toBeVisible();
      expect(within(card).getByText(internship.company)).toBeVisible();
      expect(within(card).getByText(internship.role)).toBeVisible();
      expect(within(card).getByText(internship.period)).toBeVisible();

      expect(within(card).queryByText(internship.context)).toBeNull();
      expect(within(card).queryByText(internship.status)).toBeNull();
      expect(within(card).queryByRole("list", { name: `${internship.company} 工程旅程` })).toBeNull();

      expect(within(card).getByText(internship.presentation.title)).toBeVisible();
      expect(within(card).getByText(internship.presentation.contribution)).toBeVisible();
      expect(within(card).getByText(internship.presentation.outcome)).toBeVisible();

      const stack = within(card).getByRole("list", { name: `${internship.company} 技术栈` });
      const stackItems = within(stack).getAllByRole("listitem");
      expect(stackItems.length).toBeGreaterThanOrEqual(1);
      expect(stackItems.length).toBeLessThanOrEqual(3);
      for (const technology of internship.presentation.technologies) {
        expect(within(stack).getByText(technology)).toBeVisible();
      }

      const details = card.querySelector("details.internship-details");
      expect(details).not.toBeNull();
      expect(details).not.toHaveAttribute("open");
      expect(within(details as HTMLElement).getByText(`查看${internship.company}工程细节`)).toBeVisible();

      const records = within(details as HTMLElement).getByRole("list", {
        name: `${internship.company} 能力建设记录`,
      });
      expect(within(records).getAllByRole("listitem")).toHaveLength(3);
      for (const detail of internship.presentation.details) {
        expect(within(records).getByText(detail)).toBeInTheDocument();
      }

      expect(within(card).queryByRole("button")).not.toBeInTheDocument();
      view.unmount();
    },
  );

  it("keeps the clip-player record inside the disclosure for agibot", () => {
    const internship = internships.find((item) => item.id === "agibot-agent");
    expect(internship).toBeDefined();
    render(<InternshipStoryCard internship={internship!} index={1} />);

    const card = screen.getByRole("article");
    const details = card.querySelector("details.internship-details") as HTMLElement;
    expect(details).not.toBeNull();
    expect(details.textContent).toContain("clip-player");
    expect(details.textContent).toContain("虚拟时钟");
    expect(details.textContent).toContain("慢消费者隔离");
    expect(details.textContent).not.toContain("agibot_retriever");
  });
});