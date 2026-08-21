"use client";

import { Canvas } from "@react-three/fiber";

import { AgentNetworkScene } from "@/components/scene/agent-network-scene";
import { StaticNetwork } from "@/components/scene/static-network";
import type { SceneMode } from "@/lib/webgl";

type AgentNetworkCanvasProps = {
  mode: Exclude<SceneMode, "static">;
  onReady: () => void;
};

export default function AgentNetworkCanvas({
  mode,
  onReady,
}: AgentNetworkCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 48, position: [0, 0, 6.8] }}
      dpr={[1, mode === "full" ? 1.5 : 1.15]}
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
      <AgentNetworkScene mode={mode} />
    </Canvas>
  );
}
