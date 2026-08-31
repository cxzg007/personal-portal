import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";

import { OpenSourceSpotlight } from "./open-source-spotlight";

const { openSource } = loadSiteContent();

afterEach(cleanup);

describe("OpenSourceSpotlight", () => {
  it("presents the Semantica identity, honors and contribution metrics", () => {
    render(<OpenSourceSpotlight project={openSource} />);

    expect(screen.getByRole("img", { name: openSource.logo.alt })).toBeVisible();
    expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
    expect(screen.getByText("#1 Repository of the Day")).toBeVisible();
    expect(screen.getByText("#3 Repository of the Week")).toBeVisible();
    expect(screen.getByText("13")).toBeVisible();
    expect(screen.getByText("9")).toBeVisible();
  });

  it("renders the graph-native capability chain and verified public links", () => {
    render(<OpenSourceSpotlight project={openSource} />);

    const graph = screen.getByRole("list", { name: "Semantica 图原生能力链路" });
    expect(graph).toHaveTextContent("cxzg007 contributions");

    expect(screen.getByRole("link", { name: "查看 Semantica GitHub 项目" })).toHaveAttribute(
      "href",
      openSource.repositoryUrl,
    );
    expect(screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" })).toHaveAttribute(
      "href",
      openSource.articlePath,
    );
  });

  it("states the dated snapshot and merged contribution boundary", () => {
    render(<OpenSourceSpotlight project={openSource} />);

    expect(
      screen.getByText(
        "截至 2026-08-31：9 个贡献已合并（#1077、#1081、#1094、#1096、#1113、#1143、#1215、#1217、#1226），其余贡献处于开放或审阅状态。",
      ),
    ).toBeVisible();
  });
});