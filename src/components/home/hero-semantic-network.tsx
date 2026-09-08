import {
  HERO_NETWORK_AUX_RADIUS,
  HERO_NETWORK_CORE_RADIUS,
  HERO_NETWORK_EDGES,
  HERO_NETWORK_NODES,
  HERO_NETWORK_VIEWBOX,
} from "@/lib/hero-network";

import styles from "./hero-semantic-network.module.css";

const CORE_IDS = new Set(HERO_NETWORK_NODES.filter((node) => node.core).map((node) => node.id));

/**
 * 静态语义网络：SSR 渲染收拢链路（progress = 0），无 JS / reduced-motion
 * 环境下也始终呈现同一份确定性几何。滚动整理 driver（Task 2）通过
 * data-hero-network / data-network-node / data-network-from / data-network-to
 * 契约接管位移动画。
 */
export function HeroSemanticNetwork() {
  const frame = new Map(HERO_NETWORK_NODES.map((node) => [node.id, node.collapsed]));
  const pointOf = (id: string) => frame.get(id) ?? { x: 0, y: 0 };

  return (
    <figure className={styles.figure}>
      <svg
        aria-hidden="true"
        className={styles.network}
        data-hero-network=""
        focusable="false"
        viewBox={`0 0 ${HERO_NETWORK_VIEWBOX.width} ${HERO_NETWORK_VIEWBOX.height}`}
      >
        {HERO_NETWORK_EDGES.map((edge) => {
          const from = pointOf(edge.from);
          const to = pointOf(edge.to);
          const isCoreChain = CORE_IDS.has(edge.from) && CORE_IDS.has(edge.to);
          return (
            <line
              className={isCoreChain ? styles.coreEdge : styles.auxEdge}
              data-network-from={edge.from}
              data-network-to={edge.to}
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              x2={to.x}
              y1={from.y}
              y2={to.y}
            />
          );
        })}
        {HERO_NETWORK_NODES.map((node) => {
          const point = pointOf(node.id);
          return (
            <g
              data-network-node={node.id}
              key={node.id}
              transform={`translate(${point.x} ${point.y})`}
            >
              <circle
                className={node.core ? styles.coreNode : styles.auxNode}
                r={node.core ? HERO_NETWORK_CORE_RADIUS : HERO_NETWORK_AUX_RADIUS}
              />
              {node.core && node.label ? (
                <text className={styles.coreLabel} textAnchor="middle">
                  {node.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>理解 → 检索 → 约束 → 执行</figcaption>
    </figure>
  );
}