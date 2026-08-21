"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { StaticNetwork } from "@/components/scene/static-network";
import { getHardwareConcurrency, prefersReducedMotion } from "@/lib/motion";
import { getSceneMode, supportsWebGL } from "@/lib/webgl";
import type { SceneMode } from "@/lib/webgl";

const AgentNetworkCanvas = dynamic(
  () => import("@/components/scene/agent-network-canvas"),
  { ssr: false },
);

const SCENE_READY_TIMEOUT_MS = 4_000;

type SceneErrorBoundaryProps = {
  children: ReactNode;
  onError: (error: unknown) => void;
};

type SceneErrorBoundaryState = {
  failed: boolean;
};

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function logSceneFallback(reason: "error" | "timeout", error?: unknown) {
  const kind = error instanceof Error ? error.name : "Unavailable";
  console.warn(`[agent-network] fallback: ${reason} (${kind})`);
}

export function SceneLoader() {
  const [mode, setMode] = useState<SceneMode>("static");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const cores = getHardwareConcurrency();
      const effectiveCores = window.matchMedia("(max-width: 760px)").matches
        ? Math.min(cores, 2)
        : cores;

      setMode(
        getSceneMode({
          webgl: supportsWebGL(),
          reducedMotion: prefersReducedMotion(),
          cores: effectiveCores,
        }),
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (mode === "static" || ready || failed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      logSceneFallback("timeout");
      setFailed(true);
    }, SCENE_READY_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [failed, mode, ready]);

  const handleError = useCallback((error: unknown) => {
    logSceneFallback("error", error);
    setFailed(true);
  }, []);

  const showCanvas = mode !== "static" && !failed;

  return (
    <div className="agent-network" data-scene-mode={failed ? "static" : mode}>
      {(!showCanvas || !ready) && <StaticNetwork />}
      {showCanvas && (
        <SceneErrorBoundary onError={handleError}>
          <AgentNetworkCanvas mode={mode} onReady={() => setReady(true)} />
        </SceneErrorBoundary>
      )}
      <p aria-hidden="true" className="scene-caption">
        AGENT NETWORK / REASON · ACT · VERIFY
      </p>
    </div>
  );
}
