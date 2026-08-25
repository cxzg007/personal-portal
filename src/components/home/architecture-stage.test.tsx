import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ArchitectureStage } from "./architecture-stage";

const { caseStudies } = loadSiteContent();

afterEach(cleanup);

describe("architecture stage", () => {
  it("renders one named ordered list with exactly three nodes for every project", () => {
    caseStudies.forEach((project) => {
      cleanup();
      render(<ArchitectureStage project={project} />);

      const list = screen.getByRole("list", {
        name: `${project.tabLabel} 架构阶段`,
      });
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(3);
    });
  });

  it("labels the three stages with the first constraint, first decision, and verifiable result", () => {
    caseStudies.forEach((project) => {
      cleanup();
      const { container } = render(<ArchitectureStage project={project} />);

      expect(screen.getByText("输入约束")).toBeVisible();
      expect(screen.getByText(project.constraints[0])).toBeVisible();
      expect(screen.getByText("工程决策")).toBeVisible();
      expect(screen.getByText(project.decisions[0])).toBeVisible();
      expect(screen.getByText("可验证结果")).toBeVisible();
      expect(screen.getByText(project.result)).toBeVisible();

      expect(container.firstElementChild).toHaveAttribute(
        "data-visual-kind",
        project.visualKind,
      );
    });
  });

  it("keeps visual connectors hidden from assistive technology", () => {
    const { container } = render(<ArchitectureStage project={caseStudies[0]} />);

    const connectors = container.querySelectorAll("[aria-hidden='true']");
    expect(connectors.length).toBeGreaterThan(0);
  });
});