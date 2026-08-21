"use client";

import { useEffect } from "react";

type SceneTransition = "network" | "decomposing" | "timeline";

export function getSceneTransition(
  scrollY: number,
  viewportHeight: number,
  internshipTop: number,
): SceneTransition {
  const transitionStart = Math.max(0, internshipTop - viewportHeight);
  const transitionEnd = Math.max(
    transitionStart + 1,
    internshipTop - viewportHeight * 0.25,
  );
  const progress = Math.max(
    0,
    Math.min(1, (scrollY - transitionStart) / (transitionEnd - transitionStart)),
  );

  if (progress === 0) return "network";
  if (progress < 0.75) return "decomposing";
  return "timeline";
}

export function getCaseChainStage(
  bounds: Pick<DOMRect, "bottom" | "top">,
  viewportHeight: number,
): 0 | 1 | 2 | 3 {
  if (bounds.bottom <= 0 || bounds.top < viewportHeight * 0.25) return 3;
  if (bounds.top < viewportHeight * 0.5) return 2;
  if (bounds.top < viewportHeight * 0.75) return 1;
  return 0;
}

function clearEnhancementStates() {
  document
    .querySelector<HTMLElement>(".agent-network")
    ?.removeAttribute("data-scene-transition");
  document.querySelectorAll<HTMLElement>(".architecture-flow").forEach((flow) => {
    flow.removeAttribute("data-chain-stage");
  });
}

export function ScrollEnhancements() {
  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId: number | null = null;
    let listening = false;

    const update = () => {
      frameId = null;
      const viewportHeight = window.innerHeight;
      const scene = document.querySelector<HTMLElement>(".agent-network");
      const internships = document.querySelector<HTMLElement>("#internships");

      if (scene && internships) {
        const internshipTop = internships.getBoundingClientRect().top + window.scrollY;
        scene.dataset.sceneTransition = getSceneTransition(
          window.scrollY,
          viewportHeight,
          internshipTop,
        );
      }

      document.querySelectorAll<HTMLElement>(".architecture-flow").forEach((flow) => {
        flow.dataset.chainStage = String(
          getCaseChainStage(flow.getBoundingClientRect(), viewportHeight),
        );
      });
    };

    const scheduleUpdate = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(update);
    };

    const stopListening = () => {
      if (!listening) return;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      listening = false;
    };

    const applyPreference = () => {
      if (motionPreference.matches) {
        stopListening();
        if (frameId !== null) window.cancelAnimationFrame(frameId);
        frameId = null;
        clearEnhancementStates();
        document.documentElement.dataset.scrollEnhancement = "disabled";
        return;
      }

      document.documentElement.dataset.scrollEnhancement = "enabled";
      if (!listening) {
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        listening = true;
      }
      update();
    };

    applyPreference();
    motionPreference.addEventListener?.("change", applyPreference);

    return () => {
      stopListening();
      motionPreference.removeEventListener?.("change", applyPreference);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      clearEnhancementStates();
      document.documentElement.removeAttribute("data-scroll-enhancement");
    };
  }, []);

  return null;
}
