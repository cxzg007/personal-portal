"use client";

import { useState } from "react";

import type {
  ArchitecturePillar,
  OpenSourceContribution,
} from "@/content/schema";

type OpenSourceSpotlightProps = {
  pillars: ArchitecturePillar[];
  contributions: OpenSourceContribution[];
};

type Emphasis = "active" | "muted" | "default";

export function OpenSourceSpotlight({ pillars, contributions }: OpenSourceSpotlightProps) {
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const [focusedPillarId, setFocusedPillarId] = useState<string | null>(null);
  const [hoveredPillarId, setHoveredPillarId] = useState<string | null>(null);
  const effectivePillarId = activePillarId ?? focusedPillarId ?? hoveredPillarId;
  const mergedContributions = contributions.filter(({ status }) => status === "merged");
  const pillarById = new Map(pillars.map((pillar) => [pillar.id, pillar]));

  const emphasisFor = (prNumber: number): Emphasis => {
    if (effectivePillarId === null) return "default";
    return pillarById.get(effectivePillarId)?.prNumbers.includes(prNumber) ? "active" : "muted";
  };

  return (
    <section
      className="open-source-spotlight"
      data-selected-pillar={activePillarId ?? "all"}
      data-testid="open-source-spotlight"
      onKeyDown={(event) => {
        if (event.key === "Escape") setActivePillarId(null);
      }}
    >
      <ol aria-label="Semantica 架构支柱" className="open-source-spotlight-pillars">
        {pillars.map((pillar) => (
          <li key={pillar.id}>
            <button
              type="button"
              className="open-source-architecture-pillar"
              aria-pressed={activePillarId === pillar.id}
              onClick={() => setActivePillarId(activePillarId === pillar.id ? null : pillar.id)}
              onMouseEnter={() => setHoveredPillarId(pillar.id)}
              onMouseLeave={() => setHoveredPillarId(null)}
              onFocus={() => setFocusedPillarId(pillar.id)}
              onBlur={() => setFocusedPillarId(null)}
            >
              <span className="open-source-architecture-pillar-title">{`架构支柱：${pillar.title}`}</span>
              <span className="open-source-architecture-pillar-summary">{pillar.summary}</span>
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="open-source-spotlight-reset"
        aria-disabled={activePillarId === null}
        onClick={() => setActivePillarId(null)}
      >
        查看全部贡献
      </button>

      <ol aria-label="Semantica 已合并贡献" className="open-source-spotlight-contributions">
        {mergedContributions.map((contribution) => (
          <li
            key={contribution.number}
            className="open-source-merged-contribution"
            data-emphasis={emphasisFor(contribution.number)}
            data-pr-number={contribution.number}
            data-testid="merged-contribution"
          >
            <a className="open-source-pr-link" href={contribution.url} rel="noreferrer" target="_blank">
              {`PR #${contribution.number}：${contribution.summary}（${contribution.kind.toUpperCase()} · ${contribution.scale}）`}
              <span className={`open-source-spotlight-status contribution-${contribution.status}`}>
                {contribution.status.toUpperCase()}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}