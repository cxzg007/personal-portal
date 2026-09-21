import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";
import type { OpenSourceProject } from "@/content/schema";

import { groupContributionsByTheme, OpenSourceShowcase } from "./open-source-showcase";

const { openSource } = loadSiteContent();
const merged = openSource.contributions.filter(({ status }) => status === "merged");
const openPullRequests = openSource.contributions.filter(({ status }) => status === "open");

afterEach(cleanup);

function renderShowcase(project: OpenSourceProject = openSource) {
  return render(<OpenSourceShowcase project={project} />);
}

describe("groupContributionsByTheme", () => {
  it("maps every resume theme to its merged PRs in content order", () => {
    const groups = groupContributionsByTheme(openSource);

    expect(groups.map(({ theme }) => theme.id)).toEqual([
      "rule-reasoning",
      "truth-maintenance",
      "sparql-execution",
      "pipeline-parallelism",
      "other-contributions",
    ]);
    expect(groups.map(({ contributions }) => contributions.map(({ number }) => number))).toEqual([
      [1096, 1077],
      [1556, 1544],
      [1243],
      [1226],
      [1364, 1360, 1217, 1215, 1208, 1160, 1153, 1143, 1113, 1094, 1081],
    ]);
  });

  it("covers all merged contributions exactly once", () => {
    const grouped = groupContributionsByTheme(openSource).flatMap(({ contributions }) =>
      contributions.map(({ number }) => number),
    );

    expect(grouped).toHaveLength(merged.length);
    expect(new Set(grouped).size).toBe(merged.length);
    expect([...grouped].sort((a, b) => b - a)).toEqual(merged.map(({ number }) => number));
  });

  it("drops themes whose PRs are no longer merged", () => {
    const withoutSparql = {
      ...openSource,
      contributions: openSource.contributions.filter(({ number }) => number !== 1243),
    };

    const groups = groupContributionsByTheme(withoutSparql);
    expect(groups.map(({ theme }) => theme.id)).not.toContain("sparql-execution");
    expect(groups).toHaveLength(openSource.contributionThemes.length - 1);
  });
});

describe("OpenSourceShowcase", () => {
  it("presents the official Semantica logo, identity and background", () => {
    renderShowcase();

    expect(screen.getByRole("img", { name: "Semantica 项目标志" })).toBeVisible();
    expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Semantica" })).toBeVisible();
    expect(screen.getByText(openSource.background)).toBeVisible();
  });

  it("groups the personal merged PR count with the key contributions heading", () => {
    renderShowcase();

    const statistic = screen.getByText("已合并 PR").closest("p");
    expect(statistic).not.toBeNull();
    expect(statistic).toHaveTextContent("17");
    expect(screen.getByRole("heading", { name: "我的关键贡献" })).toBeVisible();
  });

  it("renders the four highlighted themes with their summaries and PR chips", () => {
    renderShowcase();

    const list = screen.getByRole("list", { name: "Semantica 贡献主题" });
    const items = within(list)
      .getAllByRole("listitem")
      .filter((item) => item.classList.contains("open-source-theme-item"));
    expect(items).toHaveLength(4);

    const expected = openSource.contributionThemes.filter(
      ({ id }) => id !== "other-contributions",
    );
    expected.forEach((theme, index) => {
      const item = items[index];
      expect(item).toHaveAttribute("data-theme-id", theme.id);
      expect(within(item).getByRole("heading", { name: theme.name })).toBeVisible();
      expect(within(item).getByText(theme.summary)).toBeVisible();
      expect(within(item).getByText(`${theme.prNumbers.length} 个已合并 PR`)).toBeVisible();

      theme.prNumbers.forEach((number) => {
        const contribution = merged.find((entry) => entry.number === number);
        const link = within(item).getByRole("link", { name: `已合并 · PR #${number} · ${contribution?.title}` });
        expect(link).toHaveAttribute("href", contribution?.url);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noreferrer");
        expect(within(link).getByText(`PR #${number}`)).toBeVisible();
      });
    });
  });

  it("folds the remaining merged PRs into a closed details disclosure", () => {
    const { container } = renderShowcase();

    const otherTheme = openSource.contributionThemes.find(({ id }) => id === "other-contributions");
    if (!otherTheme) {
      throw new Error("other-contributions theme is required by the showcase disclosure");
    }
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(
      within(details as HTMLElement).getByText(
        `查看其他 ${otherTheme.prNumbers.length} 个已合并 PR`,
      ),
    ).toBeVisible();
    expect(within(details as HTMLElement).getByText(otherTheme.summary)).toBeInTheDocument();

    const remainingLinks = within(details as HTMLElement).getAllByRole("link", {
      name: /^已合并 · PR #/,
    });
    expect(remainingLinks).toHaveLength(otherTheme.prNumbers.length);
    for (const link of remainingLinks) {
      const number = Number(link.textContent?.match(/PR #(\d+)/)?.[1]);
      expect(merged.some((contribution) => contribution.number === number)).toBe(true);
    }
  });

  it("keeps open pull requests and retired wording out of the credibility summary", () => {
    const { container } = renderShowcase();

    for (const pullRequest of openPullRequests) {
      expect(screen.queryByText(new RegExp(`PR #${pullRequest.number}\\b`))).toBeNull();
    }
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/FEAT|FIX|MERGED/);
    expect(text).not.toContain("架构支柱");
    expect(text).not.toContain("点击");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    renderShowcase();

    expect(screen.getByText("截至 2026-09-20：17 个贡献已合并")).toBeVisible();
  });

  it("separates sourced project recognition from the personal contribution count", () => {
    renderShowcase();

    const recognition = screen.getByRole("region", { name: "项目影响力与荣誉" });
    const stars = within(recognition).getByRole("link", { name: /13,300 GitHub Stars/ });
    expect(stars).toHaveAttribute("href", openSource.repositoryUrl);
    expect(within(recognition).getByText(/2026-09-20/)).toBeVisible();
    expect(within(recognition).getByRole("link", { name: /#1 GitHub Trending 日榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/repositories/18986");
    expect(within(recognition).getByRole("link", { name: /#3 Trendshift · Python 周榜/ }))
      .toHaveAttribute("href", "https://trendshift.io/api/badge/trendshift/repositories/18986/weekly?language=Python");
    expect(within(recognition).queryByText("已合并 PR")).toBeNull();
  });

  it("renders every theme card with the same structure and no featured variant", () => {
    const { container } = renderShowcase();

    const themeItems = Array.from(container.querySelectorAll(".open-source-theme-item"));
    expect(themeItems).toHaveLength(4);
    for (const item of themeItems) {
      expect(item.className).toBe("open-source-theme-item");
      expect(within(item as HTMLElement).queryByRole("img")).toBeNull();
    }
  });

  it("links to the external repository and the internal article", () => {
    renderShowcase();

    const repository = screen.getByRole("link", { name: "Semantica GitHub repository" });
    expect(repository).toHaveAttribute("href", "https://github.com/semantica-agi/semantica");
    expect(repository).toHaveAttribute("target", "_blank");
    expect(repository).toHaveAttribute("rel", "noreferrer");

    const article = screen.getByRole("link", { name: "阅读相关技术文章" });
    expect(article).toHaveAttribute("href", "/blog/graph-engineering-ontology");
  });
});