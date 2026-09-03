import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { validSiteContent } from "@/test/fixtures/site-content";

import { OpenSourceSpotlight } from "./open-source-spotlight";

const project = validSiteContent.openSource;
const renderSpotlight = () =>
  render(
    <OpenSourceSpotlight
      graphNodes={project.graphNodes}
      contributionDomains={project.contributionDomains}
      contributions={project.contributions}
    />,
  );

afterEach(cleanup);

describe("OpenSourceSpotlight", () => {
  it("renders the complete ordered map before interaction", () => {
    renderSpotlight();
    expect(screen.getAllByRole("button", { name: /^能力节点/ })).toHaveLength(5);
    expect(screen.getAllByTestId("contribution-domain")).toHaveLength(6);
    expect(screen.getAllByRole("link", { name: /^PR #/ })).toHaveLength(13);
    expect(screen.getByRole("button", { name: "查看全部贡献" })).toHaveAttribute("aria-disabled", "true");
  });

  it("emphasizes associations without hiding or reordering content", () => {
    renderSpotlight();
    const linksBefore = screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent);
    fireEvent.click(screen.getByRole("button", { name: "能力节点：Rule & Decision" }));
    expect(screen.getByRole("button", { name: "能力节点：Rule & Decision" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("domain-rule-query-reasoning")).toHaveAttribute("data-emphasis", "active");
    expect(screen.getByTestId("domain-graph-data-adapters")).toHaveAttribute("data-emphasis", "muted");
    expect(screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent)).toEqual(linksBefore);
  });

  it("clears selection by second activation or 查看全部", () => {
    renderSpotlight();
    const node = screen.getByRole("button", { name: "能力节点：Rule & Decision" });
    fireEvent.click(node);
    fireEvent.click(node);
    expect(node).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(node);
    fireEvent.click(screen.getByRole("button", { name: "查看全部贡献" }));
    expect(node).toHaveAttribute("aria-pressed", "false");
  });

  it("previews on hover only without a clicked selection", () => {
    renderSpotlight();
    const graph = screen.getByRole("button", { name: "能力节点：ContextGraph" });
    const rule = screen.getByRole("button", { name: "能力节点：Rule & Decision" });
    const graphDomain = screen.getByTestId("domain-graph-data-adapters");
    const ruleDomain = screen.getByTestId("domain-rule-query-reasoning");

    fireEvent.mouseEnter(rule);
    expect(ruleDomain).toHaveAttribute("data-emphasis", "active");
    fireEvent.mouseLeave(rule);
    expect(ruleDomain).toHaveAttribute("data-emphasis", "default");

    fireEvent.click(graph);
    fireEvent.mouseEnter(rule);
    expect(graphDomain).toHaveAttribute("data-emphasis", "active");
    expect(ruleDomain).toHaveAttribute("data-emphasis", "muted");
  });

  it("keeps status text and summary in each PR link name", () => {
    renderSpotlight();
    expect(
      within(screen.getByTestId("domain-graph-data-adapters")).getByRole("link", { name: /PR #1081.+MERGED/ }),
    ).toBeVisible();
  });
});