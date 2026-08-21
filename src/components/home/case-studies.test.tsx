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
    expect(articles).toHaveLength(3);

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

      const architecture = within(article).getByRole("img", {
        name: `${caseStudy.title} 静态架构链路`,
      });
      expect(within(architecture).getByText("输入约束")).toBeVisible();
      expect(within(architecture).getByText("工程决策")).toBeVisible();
      expect(within(architecture).getByText("可验证结果")).toBeVisible();
      expect(architecture.querySelectorAll("ol > li.architecture-node")).toHaveLength(3);
      expect(architecture.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
    });
  });

  it("preserves verified Semantica links and the dated contribution boundary", () => {
    render(<CaseStudies caseStudies={caseStudies} />);

    const semantica = caseStudies.find(({ id }) => id === "semantica-open-source");
    expect(semantica).toBeDefined();

    const article = screen.getByRole("article", { name: semantica?.title });
    expect(within(article).getByText(/截至 2026-08-21/)).toBeVisible();
    expect(within(article).getByText(/#1081 与 #1094 已合并/)).toBeVisible();

    semantica?.links.forEach((link) => {
      expect(within(article).getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        link.url,
      );
    });
  });
});
