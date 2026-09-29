import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { ContributionMap } from "./contribution-map";

const { openSource } = loadSiteContent();
afterEach(cleanup);

describe("ContributionMap", () => {
  it("links representative PRs to their verified source files at immutable commits", () => {
    render(<ContributionMap project={openSource} />);
    const map = screen.getByRole("figure", { name: "贡献落点图" });
    const sources = [
      [1226, "pipeline/execution_engine.py", "cce5ea177cbac29a526effa546219c48f8ec36f4"],
      [1243, "reasoning/sparql_reasoner.py", "7996d1ab4bd0c96ea7e3d91a4ce70fe5881d224b"],
      [1077, "reasoning/rete_engine.py", "0384a8de306477332fabbd2de82d7de157a2c5f0"],
      [1675, "reasoning/temporal_truth_maintenance.py", "b14a2b8d2f989c8c3deca107a21d1da93ee2a506"],
      [1556, "context/truth_maintenance_filter.py", "d46529adb316829bdc75b8467278f3f0ccb310f7"],
      [1731, "context/grounded_context.py", "340eb0c31cca25029cbf8bb5fbbec6703645b06b"],
    ] as const;

    for (const [number, path, revision] of sources) {
      const pr = openSource.contributions.find((entry) => entry.number === number)!;
      const prLink = within(map).getByRole("link", { name: new RegExp(`贡献落点 · .* · PR #${number} ·`) });
      expect(prLink).toHaveAttribute("href", pr.url);
      // Verify source and PR stay attached to the same node.
      const node = prLink.closest("li")!;
      const source = within(node).getByRole("link", { name: new RegExp(`查看源码 ${path}`) });
      expect(source).toHaveAttribute("href", `${openSource.repositoryUrl}/blob/${revision}/semantica/${path}`);
      expect(node).toHaveAttribute("data-status", pr.status);
      for (const link of [source, prLink]) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noreferrer");
      }
    }
    expect(within(map).getByText(/连线表示贡献归类/)).toHaveTextContent(`贡献状态截至 ${openSource.snapshotDate}`);
  });

  it("labels open work and derives changed status from the shared content snapshot", () => {
    const { rerender } = render(<ContributionMap project={openSource} />);
    expect(screen.getByRole("link", { name: /贡献落点 · 进行中 · PR #1731/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /贡献落点 · 已合并 · PR #1731/ })).toBeNull();

    const updated = structuredClone(openSource);
    updated.contributions.find(({ number }) => number === 1731)!.status = "merged";
    rerender(<ContributionMap project={updated} />);
    expect(screen.getByRole("link", { name: /贡献落点 · 已合并 · PR #1731/ }).closest("li")).toHaveAttribute("data-status", "merged");
    expect(screen.queryByText("进行中")).toBeNull();
  });

  it("omits missing contributions and their now-empty area", () => {
    render(<ContributionMap project={{ ...openSource, contributions: openSource.contributions.filter(({ number }) => ![1556, 1731].includes(number)) }} />);
    expect(screen.queryByRole("heading", { name: "Agent 上下文" })).toBeNull();
    expect(screen.queryByRole("link", { name: /PR #1731/ })).toBeNull();
    expect(screen.getByText("2 个方向 · 4 个代表性落点")).toBeVisible();
  });

  it("omits the map when none of the evidenced contributions exist", () => {
    const { container } = render(<ContributionMap project={{ ...openSource, contributions: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not attribute Semantica contributions to an unrelated project", () => {
    const { container } = render(<ContributionMap project={{ ...openSource, repositoryUrl: "https://github.com/example/another-project" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
