import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { CaseStudies } from "./case-studies";

const { caseStudies } = loadSiteContent();

afterEach(cleanup);

describe("system case studies", () => {
  it("presents each engineering narrative with independently identifiable labels", () => {
    render(<CaseStudies caseStudies={caseStudies} />);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);

    caseStudies.forEach((caseStudy, index) => {
      const article = articles[index];

      expect(within(article).getByRole("heading", { name: caseStudy.title })).toBeVisible();
      expect(within(article).getByRole("heading", { name: "问题" })).toBeVisible();
      expect(within(article).getByText(caseStudy.problem)).toBeVisible();
      expect(within(article).getByRole("heading", { name: "约束" })).toBeVisible();
      expect(within(article).getByRole("heading", { name: "决策" })).toBeVisible();
      expect(within(article).getByRole("heading", { name: "权衡" })).toBeVisible();
      expect(within(article).getByRole("heading", { name: "个人贡献" })).toBeVisible();
      expect(within(article).getByText(caseStudy.contribution)).toBeVisible();
      expect(within(article).getByRole("heading", { name: "结果" })).toBeVisible();
      expect(within(article).getAllByText(caseStudy.result).length).toBeGreaterThan(0);

      caseStudy.constraints.forEach((constraint) => {
        expect(within(article).getAllByText(constraint).length).toBeGreaterThan(0);
      });
      caseStudy.decisions.forEach((decision) => {
        expect(within(article).getAllByText(decision).length).toBeGreaterThan(0);
      });
      caseStudy.tradeoffs.forEach((tradeoff) => {
        expect(within(article).getByText(tradeoff)).toBeVisible();
      });

      const architecture = within(article).getByRole("list", {
        name: `${caseStudy.title} 静态架构链路`,
      });
      const architectureNodes = within(architecture).getAllByRole("listitem");
      expect(architectureNodes).toHaveLength(3);
      expect(architectureNodes.map((node) => node.getAttribute("data-chain-step"))).toEqual([
        "1",
        "2",
        "3",
      ]);
      expect(within(architectureNodes[0]).getByText("输入约束")).toBeVisible();
      expect(within(architectureNodes[1]).getByText("工程决策")).toBeVisible();
      expect(within(architectureNodes[2]).getByText("可验证结果")).toBeVisible();
      expect(architecture.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
    });
  });
});
