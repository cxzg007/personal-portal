"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Points } from "three";

import type { SceneMode } from "@/lib/webgl";

type AgentNetworkSceneProps = {
  mode: Exclude<SceneMode, "static">;
};

const NODE_LIMITS = {
  full: 48,
  lite: 18,
} as const;

function createNodePositions(count: number): Array<[number, number, number]> {
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return [0, 0, 0];
    }

    const progress = index / (count - 1);
    const angle = index * 2.399963;
    const radius = 1.35 + (index % 5) * 0.24;

    return [
      Math.cos(angle) * radius,
      (progress - 0.5) * 3.8,
      Math.sin(angle) * radius * 0.72,
    ];
  });
}

function createLinePositions(nodes: Array<[number, number, number]>): Float32Array {
  const vertices: number[] = [];

  for (let index = 1; index < nodes.length; index += 1) {
    vertices.push(0, 0, 0, ...nodes[index]);

    if (index > 1 && index % 3 === 0) {
      vertices.push(...nodes[index - 1], ...nodes[index]);
    }
  }

  return new Float32Array(vertices);
}

function createParticlePositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = index * 1.618034;
    const radius = 2.15 + (index % 4) * 0.3;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = ((index % 9) - 4) * 0.42;
    positions[index * 3 + 2] = Math.sin(angle) * radius * 0.55;
  }

  return positions;
}

export function AgentNetworkScene({ mode }: AgentNetworkSceneProps) {
  const groupRef = useRef<Group>(null);
  const particlesRef = useRef<Points>(null);
  const nodeCount = NODE_LIMITS[mode];
  const nodes = useMemo(() => createNodePositions(nodeCount), [nodeCount]);
  const lines = useMemo(() => createLinePositions(nodes), [nodes]);
  const particles = useMemo(
    () => createParticlePositions(mode === "full" ? 30 : 10),
    [mode],
  );

  useFrame(({ pointer, performance }, delta) => {
    if (groupRef.current) {
      const frameScale = Math.max(performance.current, 0.35);
      groupRef.current.rotation.y += delta * 0.035 * frameScale;
      groupRef.current.rotation.x +=
        (pointer.y * 0.035 - groupRef.current.rotation.x) * 0.025;
      groupRef.current.position.x +=
        (pointer.x * 0.08 - groupRef.current.position.x) * 0.02;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.z -= delta * 0.012;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.08, -0.2, -0.08]}>
      <ambientLight intensity={0.55} />
      <pointLight color="#68d8ff" intensity={14} position={[1.8, 2.4, 3]} />
      <pointLight color="#9c7cff" intensity={8} position={[-2.5, -1.2, 1]} />

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute args={[lines, 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color="#68d8ff" opacity={0.23} transparent />
      </lineSegments>

      {nodes.map((position, index) => (
        <mesh key={`${position.join("-")}-${index}`} position={position}>
          <sphereGeometry args={[index === 0 ? 0.22 : index % 7 === 0 ? 0.09 : 0.055, 10, 10]} />
          <meshStandardMaterial
            color={index % 7 === 0 ? "#9c7cff" : "#68d8ff"}
            emissive={index === 0 ? "#68d8ff" : "#223e55"}
            emissiveIntensity={index === 0 ? 1.2 : 0.55}
            roughness={0.38}
          />
        </mesh>
      ))}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute args={[particles, 3]} attach="attributes-position" />
        </bufferGeometry>
        <pointsMaterial color="#d9f7ff" opacity={0.48} size={0.025} transparent />
      </points>
    </group>
  );
}
