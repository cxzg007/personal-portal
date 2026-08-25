"use client";

import { useRef, useState } from "react";

import type { CaseStudy } from "@/content/schema";

import { ArchitectureStage } from "./architecture-stage";

type SystemProjectTabsProps = {
  projects: CaseStudy[];
};

function nextIndex(key: string, current: number, count: number) {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return current;
}

export function SystemProjectTabs({ projects }: SystemProjectTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function activate(next: number) {
    setActiveIndex(next);
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    const next = nextIndex(key, index, projects.length);
    activate(next);
    tabRefs.current[next]?.focus();
  }

  const activeProject = projects[activeIndex];

  return (
    <div className="system-project-tabs">
      <div aria-label="系统项目" className="system-project-tablist" role="tablist">
        {projects.map((project, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              aria-controls={`system-panel-${project.id}`}
              aria-selected={isActive}
              className="system-project-tab"
              id={`system-tab-${project.id}`}
              key={project.id}
              onClick={() => activate(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {project.tabLabel}
            </button>
          );
        })}
      </div>
      <div
        aria-labelledby={`system-tab-${activeProject.id}`}
        className="system-project-panel"
        id={`system-panel-${activeProject.id}`}
        role="tabpanel"
      >
        <h3 className="system-project-title">{activeProject.title}</h3>
        <p className="system-project-problem">{activeProject.problem}</p>
        <ArchitectureStage project={activeProject} />
        <ul className="system-project-tradeoffs">
          {activeProject.tradeoffs.map((tradeoff) => (
            <li key={tradeoff}>{tradeoff}</li>
          ))}
        </ul>
        <p className="system-project-contribution">{activeProject.contribution}</p>
        <p className="system-project-stack">{activeProject.stack.join("、")}</p>
        {activeProject.links.length > 0 ? (
          <ul className="system-project-links">
            {activeProject.links.map((link) => (
              <li key={link.url}>
                <a href={link.url}>{link.label}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}