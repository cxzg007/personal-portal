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

export function getNarrativeStage(
  bounds: Pick<DOMRect, "bottom" | "top">,
  viewportHeight: number,
): 0 | 1 | 2 | 3 {
  if (bounds.bottom <= 0 || bounds.top < viewportHeight * 0.25) return 3;
  if (bounds.top < viewportHeight * 0.5) return 2;
  if (bounds.top < viewportHeight) return 1;
  return 0;
}

function clearEnhancementStates() {
  document
    .querySelector<HTMLElement>(".agent-network")
    ?.removeAttribute("data-scene-transition");
  document.querySelectorAll<HTMLElement>(".architecture-flow").forEach((flow) => {
    flow.removeAttribute("data-chain-stage");
  });
  document.querySelectorAll<HTMLElement>(".metric-card").forEach((card) => {
    card.removeAttribute("data-metric-visible");
  });
  document.querySelectorAll<HTMLElement>(".internship-card").forEach((card) => {
    card.removeAttribute("data-story-stage");
  });
  document
    .querySelector<HTMLElement>(".open-source-spotlight")
    ?.removeAttribute("data-open-source-stage");
}

export function ScrollEnhancements() {
  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewportPreference = window.matchMedia("(max-width: 760px)");
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

      document.querySelectorAll<HTMLElement>(".metric-card").forEach((card) => {
        if (getNarrativeStage(card.getBoundingClientRect(), viewportHeight) > 0) {
          card.dataset.metricVisible = "true";
        }
      });

      document.querySelectorAll<HTMLElement>(".internship-card").forEach((card) => {
        card.dataset.storyStage = String(
          getNarrativeStage(card.getBoundingClientRect(), viewportHeight),
        );
      });

      const openSource = document.querySelector<HTMLElement>(".open-source-spotlight");
      if (openSource) {
        openSource.dataset.openSourceStage = String(
          getNarrativeStage(openSource.getBoundingClientRect(), viewportHeight),
        );
      }
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = -1;
      const handle = window.requestAnimationFrame(update);
      if (frameId === -1) frameId = handle;
    };

    const stopListening = () => {
      if (!listening) return;
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      listening = false;
    };

    const applyPreference = () => {
      if (motionPreference.matches || viewportPreference.matches) {
        stopListening();
        if (frameId !== null) window.cancelAnimationFrame(frameId);
        frameId = null;
        clearEnhancementStates();
        document.documentElement.dataset.scrollEnhancement = "disabled";
        document.documentElement.dataset.brandMotion = "static";
        return;
      }

      document.documentElement.dataset.scrollEnhancement = "enabled";
      document.documentElement.dataset.brandMotion = "enhanced";
      if (!listening) {
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        listening = true;
      }
      update();
    };

    applyPreference();
    motionPreference.addEventListener?.("change", applyPreference);
    viewportPreference.addEventListener?.("change", applyPreference);

    return () => {
      stopListening();
      motionPreference.removeEventListener?.("change", applyPreference);
      viewportPreference.removeEventListener?.("change", applyPreference);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      clearEnhancementStates();
      document.documentElement.removeAttribute("data-scroll-enhancement");
      document.documentElement.removeAttribute("data-brand-motion");
    };
  }, []);

  return null;
}