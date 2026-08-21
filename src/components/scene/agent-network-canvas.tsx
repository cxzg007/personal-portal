"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";

import { AgentNetworkScene } from "@/components/scene/agent-network-scene";
import { StaticNetwork } from "@/components/scene/static-network";
import { getSceneRenderBudget } from "@/lib/scene-performance";
import type { SceneMode } from "@/lib/webgl";

type AgentNetworkCanvasProps = {
  mode: Exclude<SceneMode, "static">;
  onReady: () => void;
};

export default function AgentNetworkCanvas({
  mode,
  onReady,
}: AgentNetworkCanvasProps) {
  const [degraded, setDegraded] = useState(false);
  const budget = getSceneRenderBudget(mode, degraded);
  const handlePerformanceDecline = useCallback(() => {
    setDegraded(true);
  }, []);

  return (
    <Canvas
      camera={{ fov: 48, position: [0, 0, 6.8] }}
      dpr={[1, budget.maxDpr]}
      fallback={<StaticNetwork />}
      flat
      gl={{
        alpha: true,
        antialias: mode === "full",
        failIfMajorPerformanceCaveat: true,
        powerPreference: "high-performance",
      }}
      onCreated={onReady}
      performance={{ debounce: 250, max: 1, min: 0.5 }}
    >
      <AgentNetworkScene
        nodeLimit={budget.nodeLimit}
        onPerformanceDecline={handlePerformanceDecline}
        particleLimit={budget.particleLimit}
      />
    </Canvas>
  );
}
