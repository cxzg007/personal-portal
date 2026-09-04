import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { validSiteContent } from "@/test/fixtures/site-content";

import { OpenSourceSpotlight } from "./open-source-spotlight";

const project = validSiteContent.openSource;
const renderSpotlight = () =>
  render(
    <OpenSourceSpotlight
      pillars={project.architecturePillars}
      contributions={project.contributions}
    />,
  );

afterEach(cleanup);

describe("OpenSourceSpotlight", () => {
  it("renders the complete ordered map before interaction", () => {
    renderSpotlight();
    expect(screen.getAllByRole("button", { name: /^架构支柱/ })).toHaveLength(6);
    expect(screen.getAllByTestId("merged-contribution")).toHaveLength(10);
    expect(screen.getAllByRole("link", { name: /^PR #/ })).toHaveLength(10);
    expect(screen.getByRole("button", { name: "查看全部贡献" })).toHaveAttribute("aria-disabled", "true");
  });

  it("orders merged contributions feat-first then by descending scale", () => {
    renderSpotlight();
    const numbers = screen
      .getAllByRole("link", { name: /^PR #/ })
      .map((link) => /PR #(\d+)/.exec(link.textContent ?? "")?.[1]);
    expect(numbers).toEqual(["1096", "1081", "1226", "1077", "1113", "1217", "1094", "1153", "1215", "1143"]);
  });

  it("never renders open contributions", () => {
    renderSpotlight();
    for (const number of [1160, 1208, 1243, 1360, 1364]) {
      expect(screen.queryByText(new RegExp(`PR #${number}`))).toBeNull();
    }
    expect(screen.queryByText("OPEN")).toBeNull();
    expect(screen.queryByText("REVIEW")).toBeNull();
  });

  it("emphasizes associated merged PRs without hiding or reordering content", () => {
    renderSpotlight();
    const linksBefore = screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent);
    fireEvent.click(screen.getByRole("button", { name: /^架构支柱：确定性推理/ }));
    expect(screen.getByRole("button", { name: /^架构支柱：确定性推理/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1096")).toHaveAttribute("data-emphasis", "active");
    expect(screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1081")).toHaveAttribute("data-emphasis", "muted");
    expect(screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent)).toEqual(linksBefore);
  });

  it("clears selection by second activation or 查看全部", () => {
    renderSpotlight();
    const pillar = screen.getByRole("button", { name: /^架构支柱：确定性推理/ });
    fireEvent.click(pillar);
    fireEvent.click(pillar);
    expect(pillar).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pillar);
    fireEvent.click(screen.getByRole("button", { name: "查看全部贡献" }));
    expect(pillar).toHaveAttribute("aria-pressed", "false");
  });

  it("previews on hover only without a clicked selection", () => {
    renderSpotlight();
    const reasoning = screen.getByRole("button", { name: /^架构支柱：确定性推理/ });
    const traceability = screen.getByRole("button", { name: /^架构支柱：端到端溯源/ });
    const itemOf = (prNumber: string) =>
      screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === prNumber)!;

    fireEvent.mouseEnter(reasoning);
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "active");
    fireEvent.mouseLeave(reasoning);
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "default");

    fireEvent.click(traceability);
    fireEvent.mouseEnter(reasoning);
    expect(itemOf("1226")).toHaveAttribute("data-emphasis", "active");
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "muted");
  });

  it("keeps kind, scale, and status text in each PR link name", () => {
    renderSpotlight();
    const first = screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1096")!;
    expect(
      screen.getByRole("link", { name: /PR #1096.+FEAT · 1141\+\/44-.+MERGED/ }),
    ).toBeVisible();
    expect(first).toBeVisible();
  });
});