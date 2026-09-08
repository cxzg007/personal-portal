import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { loadSiteContent } from "@/content/load-site-content";
import { loadSystemArchitectures } from "@/content/system-architectures";

import { InteractiveArchitecture } from "./interactive-architecture";

const content = loadSiteContent();
const architectures = loadSystemArchitectures(content);
const byProject = new Map(architectures.map((a) => [a.projectId, a]));
const ontology = byProject.get("ontology-agent-platform");
const semantica = byProject.get("semantica-contributions");
const ontologyProject = content.caseStudies.find(
  (p) => p.id === "ontology-agent-platform",
);
const semanticaProject = content.caseStudies.find(
  (p) => p.id === "semantica-contributions",
);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("InteractiveArchitecture", () => {
  it("SSR 首帧渲染默认节点的解释区与节点按钮", () => {
    expect(ontology).toBeDefined();
    expect(ontologyProject).toBeDefined();

    render(<InteractiveArchitecture architecture={ontology!} />);

    const region = screen.getByRole("region", { name: "节点解释" });
    expect(region).toBeInTheDocument();

    // 默认节点 semantic 的 details：constraints[0] + decisions[0]
    const node = ontology!.nodes.find((n) => n.id === ontology!.defaultNodeId)!;
    for (const detail of node.details) {
      const withinRegion = within(region);
      if (detail.label && detail.text) {
        expect(withinRegion.getByText(detail.text)).toBeInTheDocument();
      }
    }
    expect(region.textContent).toContain(ontologyProject!.constraints[0]);
    expect(region.textContent).toContain(ontologyProject!.decisions[0]);

    // 全部四个节点按钮在 DOM 中，默认节点 aria-pressed=true
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toEqual(["本体语义", "关联推导", "语义查询", "执行约束"]);
    const defaultButton = screen.getByRole("button", { name: "本体语义" });
    expect(defaultButton).toHaveAttribute("aria-pressed", "true");
    expect(defaultButton).toHaveAttribute(
      "aria-controls",
      region.getAttribute("id") ?? "",
    );
  });

  it("点击“执行约束”切换解释区并保持按钮焦点", async () => {
    const user = userEvent.setup();
    render(<InteractiveArchitecture architecture={ontology!} />);

    const button = screen.getByRole("button", { name: "执行约束" });
    await user.click(button);

    const region = screen.getByRole("region", { name: "节点解释" });
    expect(region.textContent).toContain(ontologyProject!.constraints[2]);
    expect(region.textContent).toContain(ontologyProject!.constraints[3]);
    expect(region.textContent).toContain(ontologyProject!.decisions[3]);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "本体语义" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // 状态播报：当前查看：执行约束
    expect(
      screen.getByText("当前查看：执行约束"),
    ).toBeInTheDocument();
  });

  it("键盘 Tab + Space 可激活节点", async () => {
    const user = userEvent.setup();
    render(<InteractiveArchitecture architecture={ontology!} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "本体语义" })).toHaveFocus();
    await user.tab();
    const second = screen.getByRole("button", { name: "关联推导" });
    expect(second).toHaveFocus();
    await user.keyboard(" ");

    expect(second).toHaveAttribute("aria-pressed", "true");
    const region = screen.getByRole("region", { name: "节点解释" });
    expect(region.textContent).toContain(ontologyProject!.constraints[1]);
    expect(region.textContent).toContain(ontologyProject!.decisions[1]);
  });

  it("贡献图（无 edges）渲染空 SVG 仍为 aria-hidden，PR 以链接 + 状态展示", () => {
    expect(semantica).toBeDefined();
    expect(semanticaProject).toBeDefined();

    render(<InteractiveArchitecture architecture={semantica!} />);

    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }

    // 默认节点 data → PR 1081 / 1113
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("https://github.com/semantica-agi/semantica/pull/1081");
    expect(hrefs).toContain("https://github.com/semantica-agi/semantica/pull/1113");
    // 两个 PR 均为 merged，出现多个状态徽章
    const mergedBadges = screen.getAllByText("merged");
    expect(mergedBadges.length).toBeGreaterThanOrEqual(2);

    const region = screen.getByRole("region", { name: "节点解释" });
    expect(region.textContent).toContain("图数据适配");
  });

  it("节点标签与详情完整呈现长文案（不截断、不吞字）", async () => {
    const user = userEvent.setup();
    render(<InteractiveArchitecture architecture={ontology!} />);
    await user.click(screen.getByRole("button", { name: "执行约束" }));
    const region = screen.getByRole("region", { name: "节点解释" });
    // 执行约束节点三条 detail 全文在 DOM 中
    expect(region.textContent).toContain(ontologyProject!.constraints[2]);
    expect(region.textContent).toContain(ontologyProject!.constraints[3]);
    expect(region.textContent).toContain(ontologyProject!.decisions[3]);
    // 无 hidden 截断
    const details = region.querySelectorAll("dd, p");
    for (const el of details) {
      expect(el).not.toHaveAttribute("hidden");
    }
  });

  it("多实例共存时无重复的 HTML/SVG ID", () => {
    render(
      <>
        <InteractiveArchitecture architecture={ontology!} />
        <InteractiveArchitecture architecture={semantica!} />
      </>,
    );
    const idElements = document.querySelectorAll("[id]");
    const ids = Array.from(idElements).map((el) => el.getAttribute("id"));
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("贡献图说明保留 caption 诚实声明", () => {
    render(<InteractiveArchitecture architecture={semantica!} />);
    expect(screen.getByText("贡献领域 · 非完整项目架构")).toBeInTheDocument();
  });
});