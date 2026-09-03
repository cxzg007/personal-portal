"use client";

import { useState } from "react";

import type {
  ContributionDomain,
  OpenSourceContribution,
  ProjectGraphNode,
} from "@/content/schema";

type OpenSourceSpotlightProps = {
  graphNodes: ProjectGraphNode[];
  contributionDomains: ContributionDomain[];
  contributions: OpenSourceContribution[];
};

type DomainEmphasis = "active" | "muted" | "default";

export function OpenSourceSpotlight({
  graphNodes,
  contributionDomains,
  contributions,
}: OpenSourceSpotlightProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const effectiveNodeId = activeNodeId ?? hoveredNodeId;
  const contributionsByNumber = new Map<number, OpenSourceContribution>(
    contributions.map((contribution) => [contribution.number, contribution]),
  );

  const emphasisFor = (domain: ContributionDomain): DomainEmphasis => {
    if (effectiveNodeId === null) return "default";
    return domain.nodeIds.includes(effectiveNodeId) ? "active" : "muted";
  };

  return (
    <section
      className="open-source-spotlight"
      data-selected-node={activeNodeId ?? "all"}
      data-testid="open-source-spotlight"
    >
      <ol aria-label="Semantica 项目工作链" className="open-source-spotlight-chain">
        {graphNodes.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              aria-pressed={activeNodeId === node.id}
              onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              {`能力节点：${node.title}`}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="open-source-spotlight-reset"
        aria-disabled={activeNodeId === null}
        onClick={() => setActiveNodeId(null)}
      >
        查看全部贡献
      </button>

      <ol aria-label="Semantica 贡献领域" className="open-source-spotlight-domains">
        {contributionDomains.map((domain) => (
          <li
            key={domain.id}
            data-testid={`domain-${domain.id}`}
            data-emphasis={emphasisFor(domain)}
          >
            <div className="open-source-spotlight-domain" data-testid="contribution-domain">
              <h4>{domain.title}</h4>
              <p>{domain.outcome}</p>
              <ul>
                {domain.prNumbers.map((prNumber) => {
                  const contribution = contributionsByNumber.get(prNumber);
                  if (!contribution) return null;
                  return (
                    <li key={prNumber}>
                      <a href={contribution.url} rel="noreferrer" target="_blank">
                        {`PR #${contribution.number}：${contribution.summary}，${contribution.status.toUpperCase()}`}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}