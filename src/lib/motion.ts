export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function getHardwareConcurrency(): number {
  const cores = navigator.hardwareConcurrency;

  return Number.isFinite(cores) && cores > 0 ? cores : 2;
}
