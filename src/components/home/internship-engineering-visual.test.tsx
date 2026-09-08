import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  InternshipEngineeringVisual,
  type EngineeringVisualKind,
} from "./internship-engineering-visual";

afterEach(cleanup);

const KINDS: EngineeringVisualKind[] = ["ontology", "streaming", "communication"];

describe("internship engineering visual", () => {
  it.each(KINDS)("renders the %s diagram inside a labelled figure", (kind) => {
    render(<InternshipEngineeringVisual kind={kind} label="示例公司 工程示意" />);

    const figure = screen.getByText("示例公司 工程示意").closest("figure");
    expect(figure).not.toBeNull();
    expect(figure).toHaveAttribute("data-engineering-kind", kind);
    expect(figure!.className).toContain("profile-reveal");

    const svg = figure!.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 480 220");

    // 无 JS / 静态基线：未进入视口（无 data-in-view 属性）时内容也完整渲染。
    expect(figure).not.toHaveAttribute("data-in-view");

    // 图内不出现真实业务数字或监控数值，仅抽象示意标签。
    const text = svg!.textContent ?? "";
    expect(text).not.toMatch(/\d{2,}/);
  });

  it("renders the ontology diagram with deterministic node labels", () => {
    render(<InternshipEngineeringVisual kind="ontology" label="工程示意" />);
    const svg = screen.getByText("工程示意").closest("figure")!.querySelector("svg")!;
    const labels = Array.from(svg.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("语义");
    expect(labels).toContain("查询");
    expect(labels).toContain("执行");
    expect(labels).toContain("受控出口");
    // ≤40 图元约束
    expect(svg.children.length).toBeLessThanOrEqual(40);
  });

  it("renders the streaming diagram with session boundary and bounded frame count", () => {
    render(<InternshipEngineeringVisual kind="streaming" label="工程示意" />);
    const svg = screen.getByText("工程示意").closest("figure")!.querySelector("svg")!;
    const labels = Array.from(svg.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("会话边界");
    expect(labels).toContain("A");
    expect(labels).toContain("B");
    expect(labels).toContain("C");
    const frames = svg.querySelectorAll("rect");
    // 3 轨道 + 9 数据帧 = 12 rect，无随机或溢出生成
    expect(frames).toHaveLength(12);
    expect(svg.children.length).toBeLessThanOrEqual(40);
  });

  it("renders the communication diagram with main and alternate paths", () => {
    render(<InternshipEngineeringVisual kind="communication" label="工程示意" />);
    const svg = screen.getByText("工程示意").closest("figure")!.querySelector("svg")!;
    const labels = Array.from(svg.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("主路径");
    expect(labels).toContain("替代路径");
    // 4 主节点 + 2 替代节点
    const circles = svg.querySelectorAll("circle");
    expect(circles).toHaveLength(6);
    expect(svg.children.length).toBeLessThanOrEqual(40);
  });
});