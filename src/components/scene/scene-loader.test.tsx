import { act, cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SceneLoader } from "@/components/scene/scene-loader";

const fakeCanvas = vi.hoisted(() => ({ shouldThrow: false }));

vi.mock("next/dynamic", () => ({
  default: () =>
    function PendingCanvas() {
      if (fakeCanvas.shouldThrow) {
        throw new Error("synthetic canvas failure");
      }

      return <canvas data-testid="pending-canvas" />;
    } as ComponentType,
}));

describe("SceneLoader fallbacks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fakeCanvas.shouldThrow = false;
    vi.stubGlobal("WebGLRenderingContext", class WebGLRenderingContext {});
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as RenderingContext,
    );
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("removes an unready canvas and preserves the static network after four seconds", async () => {
    const { container } = render(<SceneLoader />);

    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(screen.getByTestId("pending-canvas")).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(4_000));

    expect(screen.queryByTestId("pending-canvas")).not.toBeInTheDocument();
    expect(screen.getByTestId("static-network")).toBeInTheDocument();
    expect(container.querySelector(".agent-network")).toHaveAttribute(
      "data-scene-mode",
      "static",
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[agent-network] fallback: timeout (Unavailable)",
    );
  });

  it("contains a canvas render error and keeps the static fallback", async () => {
    fakeCanvas.shouldThrow = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<SceneLoader />);

    await act(() => vi.advanceTimersByTimeAsync(20));

    expect(screen.getByTestId("static-network")).toBeInTheDocument();
    expect(container.querySelector(".agent-network")).toHaveAttribute(
      "data-scene-mode",
      "static",
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[agent-network] fallback: error (Error)",
    );
  });
});
