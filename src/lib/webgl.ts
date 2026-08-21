export type SceneMode = "full" | "lite" | "static";

export type SceneCapabilities = {
  webgl: boolean;
  reducedMotion: boolean;
  cores: number;
};

export function getSceneMode({
  webgl,
  reducedMotion,
  cores,
}: SceneCapabilities): SceneMode {
  if (!webgl || reducedMotion) {
    return "static";
  }

  return cores <= 2 ? "lite" : "full";
}

export function supportsWebGL(): boolean {
  if (typeof WebGLRenderingContext === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ??
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
  } catch {
    return false;
  }
}
