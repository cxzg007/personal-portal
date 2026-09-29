import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AgentReplay } from "./agent-replay";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Agent replay", () => {
  it("prevents submitting a result with read-only permission, even when seeking to the end", () => {
    render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: "只读权限" }));
    fireEvent.change(screen.getByRole("slider", { name: "回放进度" }), {
      target: { value: "100" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("写入已阻断");
    expect(screen.getByRole("status")).toHaveTextContent("事务写回未执行");
    expect(screen.queryByText("风险标记已写回（示例）")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "跳转到事务写回" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "回放进度" })).toHaveValue("75");
  });

  it("rolls back the entire write when an affected-row check fails, and resets before switching to success", () => {
    render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: "行数异常" }));
    fireEvent.change(screen.getByRole("slider", { name: "回放进度" }), { target: { value: "100" } });
    expect(screen.getByRole("status")).toHaveTextContent("整批写回已回滚");
    expect(screen.getByRole("status")).toHaveTextContent("0 条变更生效");
    expect(screen.getByRole("status")).not.toHaveTextContent("风险标记已写回");
    expect(screen.getByRole("button", { name: "重播回放" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "正常授权" }));
    expect(screen.getByRole("slider", { name: "回放进度" })).toHaveValue("0");
    fireEvent.change(screen.getByRole("slider", { name: "回放进度" }), { target: { value: "100" } });
    expect(screen.getByRole("status")).toHaveTextContent("风险标记已写回（示例）");
  });

  it("starts static and pauses playback when seeking or choosing a stage", () => {
    render(<AgentReplay />);
    const slider = screen.getByRole("slider", { name: "回放进度" });
    act(() => vi.advanceTimersByTime(1_000));
    expect(slider).toHaveValue("0");

    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(1_000));
    expect(Number((slider as HTMLInputElement).value)).toBeGreaterThan(0);
    fireEvent.change(slider, { target: { value: "50" } });
    act(() => vi.advanceTimersByTime(1_000));
    expect(slider).toHaveValue("50");
    expect(screen.getByRole("button", { name: "播放回放" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    fireEvent.click(screen.getByRole("button", { name: "跳转到本体映射" }));
    act(() => vi.advanceTimersByTime(1_000));
    expect(slider).toHaveValue("25");
    expect(screen.getByRole("button", { name: "跳转到本体映射" })).toHaveAttribute("aria-current", "step");
  });

  it("resets playback and its previous outcome when changing permission scenarios", () => {
    render(<AgentReplay />);
    const slider = screen.getByRole("slider", { name: "回放进度" });
    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(1_000));
    fireEvent.click(screen.getByRole("button", { name: "只读权限" }));
    act(() => vi.advanceTimersByTime(1_000));
    expect(slider).toHaveValue("0");
    expect(screen.getByRole("button", { name: "播放回放" })).toBeEnabled();

    fireEvent.change(slider, { target: { value: "100" } });
    expect(screen.getByRole("status")).toHaveTextContent("写入已阻断");
    fireEvent.click(screen.getByRole("button", { name: "正常授权" }));
    expect(slider).toHaveValue("0");
    expect(screen.getByRole("status")).not.toHaveTextContent("写入已阻断");
    expect(screen.getByRole("button", { name: "跳转到事务写回" })).toBeEnabled();
  });

  it.each([
    { scenario: "正常授权", progress: "100", result: "风险标记已写回（示例）" },
    { scenario: "只读权限", progress: "75", result: "写入已阻断" },
    { scenario: "行数异常", progress: "100", result: "整批写回已回滚" },
  ])("stops playback at the $scenario outcome and can replay from the beginning", ({ scenario, progress, result }) => {
    render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: scenario }));
    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(20_000));

    expect(screen.getByRole("slider", { name: "回放进度" })).toHaveValue(progress);
    expect(screen.getByRole("status")).toHaveTextContent(result);
    expect(screen.queryByRole("button", { name: "暂停回放" })).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "重播回放" }));
    expect(screen.getByRole("slider", { name: "回放进度" })).toHaveValue("0");
    expect(screen.getByRole("button", { name: "暂停回放" })).toBeEnabled();
  });

  it("pauses and releases its timer when the page is hidden, without restarting on return", () => {
    render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(1_000));
    const slider = screen.getByRole("slider", { name: "回放进度" }) as HTMLInputElement;
    const pausedProgress = slider.value;

    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(2_000));
    expect(slider).toHaveValue(pausedProgress);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("button", { name: "播放回放" })).toBeEnabled();

    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(1_000));
    expect(slider).toHaveValue(pausedProgress);
  });

  it("pauses and releases its timer when the exhibit leaves the viewport", () => {
    let onIntersection: IntersectionObserverCallback | undefined;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { onIntersection = callback; }
      observe() {}
      disconnect() {}
    });
    render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(1_000));
    const slider = screen.getByRole("slider", { name: "回放进度" }) as HTMLInputElement;
    const pausedProgress = slider.value;

    act(() => onIntersection?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    act(() => vi.advanceTimersByTime(2_000));
    expect(slider).toHaveValue(pausedProgress);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("button", { name: "播放回放" })).toBeEnabled();
  });

  it("releases the playback timer when unmounted", () => {
    const view = render(<AgentReplay />);
    fireEvent.click(screen.getByRole("button", { name: "播放回放" }));
    act(() => vi.advanceTimersByTime(1_000));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("server-renders a labeled static example with disabled controls and a no-JavaScript explanation", () => {
    const root = document.createElement("div");
    root.innerHTML = renderToStaticMarkup(<AgentReplay />);
    expect(root.textContent).toContain("虚构数据");
    expect(root.querySelector("noscript")?.textContent).toContain("启用 JavaScript");
    const controls = root.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button, input");
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) expect(control.disabled).toBe(true);
  });
});
