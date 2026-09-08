"use client";

import { useState } from "react";

import type {
  ResolvedArchitectureNode,
  ResolvedSystemArchitecture,
} from "@/content/system-architectures";

import styles from "./interactive-architecture.module.css";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 260;
const NODE_GAP = 12;

type InteractiveArchitectureProps = {
  architecture: ResolvedSystemArchitecture;
};

function nodeCenter(
  node: ResolvedArchitectureNode,
  columnCount: number,
  rowCount: number,
): { cx: number; cy: number } {
  return {
    cx: (node.column + 0.5) * (VIEW_WIDTH / columnCount),
    cy: (node.row + 0.5) * (VIEW_HEIGHT / rowCount),
  };
}

export function InteractiveArchitecture({
  architecture,
}: InteractiveArchitectureProps) {
  const [activeNodeId, setActiveNodeId] = useState(architecture.defaultNodeId);

  const nodesById = new Map(architecture.nodes.map((node) => [node.id, node]));
  const activeNode =
    nodesById.get(activeNodeId) ?? architecture.nodes[0] ?? null;

  const columnCount =
    Math.max(...architecture.nodes.map((node) => node.column)) + 1;
  const rowCount =
    Math.max(...architecture.nodes.map((node) => node.row)) + 1;
  const readingOrderNodes = [...architecture.nodes].sort(
    (a, b) => a.row - b.row || a.column - b.column,
  );

  const regionId = `architecture-region-${architecture.projectId}`;

  if (!activeNode) {
    return null;
  }

  return (
    <div className={styles.workbench}>
      <figure className={styles.canvasFigure}>
        <div className={styles.canvas}>
          <svg
            className={styles.canvasSvg}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {architecture.edges.map((edge) => {
              const from = nodesById.get(edge.from);
              const to = nodesById.get(edge.to);
              if (!from || !to) {
                return null;
              }
              const start = nodeCenter(from, columnCount, rowCount);
              const end = nodeCenter(to, columnCount, rowCount);
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  className={styles.edge}
                  x1={start.cx}
                  y1={start.cy}
                  x2={end.cx}
                  y2={end.cy}
                />
              );
            })}
          </svg>
          {readingOrderNodes.map((node) => {
            const center = nodeCenter(node, columnCount, rowCount);
            return (
              <button
                key={node.id}
                type="button"
                id={`architecture-node-${architecture.projectId}-${node.id}`}
                className={styles.node}
                style={{
                  left: `${(center.cx / VIEW_WIDTH) * 100}%`,
                  top: `${(center.cy / VIEW_HEIGHT) * 100}%`,
                  width: `calc(${100 / columnCount}% - ${NODE_GAP}px)`,
                }}
                aria-pressed={node.id === activeNode.id}
                aria-controls={regionId}
                onClick={() => setActiveNodeId(node.id)}
              >
                {node.label}
              </button>
            );
          })}
        </div>
        <figcaption className={styles.caption}>{architecture.caption}</figcaption>
      </figure>
      <div
        id={regionId}
        role="region"
        aria-label="节点解释"
        className={styles.explanation}
      >
        <p aria-live="polite" className={styles.liveStatus}>
          当前查看：{activeNode.label}
        </p>
        <h4 className={styles.explanationHeading}>{activeNode.label}</h4>
        <dl className={styles.detailList}>
          {activeNode.details.map((detail, index) => (
            <div
              key={`${detail.label}-${index}`}
              className={styles.detailItem}
            >
              <dt className={styles.detailLabel}>{detail.label}</dt>
              <dd className={styles.detailText}>
                {detail.href ? (
                  <a
                    className={styles.prLink}
                    href={detail.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {detail.text}
                  </a>
                ) : (
                  detail.text
                )}
                {detail.status ? (
                  <span className={styles.statusBadge}>{detail.status}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}