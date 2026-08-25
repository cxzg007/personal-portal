import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { SystemProjectTabs } from "./system-project-tabs";

const { caseStudies } = loadSiteContent();

afterEach(cleanup);

describe("system project tabs", () => {
  it("renders exactly four tabs, activates the first by default, and keeps other panels out of the DOM", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Ontology Agent",
      "Streaming Backend",
      "Knowledge Memory",
      "Semantica",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Streaming Backend" })).toBeVisible();

    expect(
      screen.queryByRole("tabpanel", { name: "Ontology Agent" }),
    ).toBeNull();
    expect(
      screen.queryByRole("tabpanel", { name: "Knowledge Memory" }),
    ).toBeNull();
    expect(screen.queryByRole("tabpanel", { name: "Semantica" })).toBeNull();
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  });

  it("keeps roving tabindex in sync with the active tab", () => {
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute("tabindex", index === 0 ? "0" : "-1");
    });

    tabs.forEach((tab, project) => {
      expect(tab).toHaveAttribute("id", `system-tab-${caseStudies[project].id}`);
      expect(tab).toHaveAttribute(
        "aria-controls",
        `system-panel-${caseStudies[project].id}`,
      );
    });
  });

  it("moves focus and activates the target tab with arrow, Home, and End keys", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    tabs[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Streaming Backend" })).toBeVisible();

    await user.keyboard("{ArrowLeft}");
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Ontology Agent" })).toBeVisible();

    await user.keyboard("{End}");
    expect(tabs[3]).toHaveFocus();
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Semantica" })).toBeVisible();

    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Ontology Agent" })).toBeVisible();
  });

  it("wraps arrow navigation at both ends", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    tabs[0].focus();
    await user.keyboard("{ArrowLeft}");
    expect(tabs[3]).toHaveFocus();
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("activates tabs with Enter and Space", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    tabs[2].focus();
    await user.keyboard("{Enter}");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Knowledge Memory" })).toBeVisible();

    tabs[3].focus();
    await user.keyboard(" ");
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Semantica" })).toBeVisible();
  });

  it("renders the complete project narrative inside the active panel", () => {
    render(<SystemProjectTabs projects={caseStudies} />);
    const panel = screen.getByRole("tabpanel", { name: "Ontology Agent" });
    const project = caseStudies[0];

    expect(within(panel).getByRole("heading", { name: project.title })).toBeVisible();
    expect(within(panel).getByText(project.problem)).toBeVisible();
    expect(within(panel).getByText("输入约束")).toBeVisible();
    expect(within(panel).getByText(project.constraints[0])).toBeVisible();
    expect(within(panel).getByText("工程决策")).toBeVisible();
    expect(within(panel).getByText(project.decisions[0])).toBeVisible();
    expect(within(panel).getByText("可验证结果")).toBeVisible();
    expect(within(panel).getByText(project.result)).toBeVisible();
    project.tradeoffs.forEach((tradeoff) => {
      expect(within(panel).getByText(tradeoff)).toBeVisible();
    });
    expect(within(panel).getByText(project.contribution)).toBeVisible();
    expect(within(panel).getByText(project.stack.join("、"))).toBeVisible();
    expect(within(panel).queryByRole("link")).toBeNull();
  });

  it("renders project narrative without links for the first three panels", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    for (const index of [1, 2]) {
      await user.click(tabs[index]);
      const panel = screen.getByRole("tabpanel", {
        name: caseStudies[index].tabLabel,
      });
      const project = caseStudies[index];
      expect(within(panel).getByRole("heading", { name: project.title })).toBeVisible();
      expect(within(panel).getByText(project.problem)).toBeVisible();
      expect(within(panel).getByText(project.result)).toBeVisible();
      expect(within(panel).getByText(project.stack.join("、"))).toBeVisible();
      expect(within(panel).queryByRole("link")).toBeNull();
    }
  });

  it("renders the internal link only inside the Semantica panel", async () => {
    const user = userEvent.setup();
    render(<SystemProjectTabs projects={caseStudies} />);
    const tabs = screen.getAllByRole("tab");

    await user.click(tabs[3]);
    const panel = screen.getByRole("tabpanel", { name: "Semantica" });
    const project = caseStudies[3];

    expect(within(panel).getByRole("heading", { name: project.title })).toBeVisible();
    expect(within(panel).getByText(project.problem)).toBeVisible();
    expect(within(panel).getByText(project.result)).toBeVisible();
    project.tradeoffs.forEach((tradeoff) => {
      expect(within(panel).getByText(tradeoff)).toBeVisible();
    });
    expect(within(panel).getByText(project.contribution)).toBeVisible();
    expect(within(panel).getByText(project.stack.join("、"))).toBeVisible();

    const link = within(panel).getByRole("link", { name: "过程复盘" });
    expect(link).toHaveAttribute("href", project.links[0].url);
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });
});