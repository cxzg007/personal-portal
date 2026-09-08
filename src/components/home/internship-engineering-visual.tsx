import type { JSX } from "react";

import styles from "./internship-engineering-visual.module.css";

export type EngineeringVisualKind = "ontology" | "streaming" | "communication";

type InternshipEngineeringVisualProps = {
  kind: EngineeringVisualKind;
  label: string;
};

/* 确定性工程示意图：无随机数、无 JS 计时器；一次 data-in-view 入场动画由 CSS 驱动。
   所有图形均为抽象示意，不含真实业务数据、监控数值或部署信息。 */

function OntologyDiagram() {
  return (
    <svg
      aria-hidden="true"
      className={styles.diagram}
      focusable="false"
      role="presentation"
      viewBox="0 0 480 220"
    >
      <rect className={styles.entityNode} data-step={1} height={44} rx={12} width={104} x={40} y={26} />
      <text className={styles.entityLabel} x={92} y={52}>
        语义
      </text>
      <rect className={styles.entityNode} data-step={2} height={44} rx={12} width={104} x={40} y={84} />
      <text className={styles.entityLabel} x={92} y={110}>
        查询
      </text>
      <rect className={styles.entityNode} data-step={3} height={44} rx={12} width={104} x={40} y={142} />
      <text className={styles.entityLabel} x={92} y={168}>
        执行
      </text>
      <path className={styles.queryPath} d="M92 12 V26" data-step={1} />
      <path className={styles.queryPath} d="M92 70 V84" data-step={2} />
      <path className={styles.queryPath} d="M92 128 V142" data-step={3} />
      <path className={styles.queryPath} d="M144 164 H296 V106 H348" data-step={4} />
      <rect className={styles.controlledExit} data-step={4} height={44} rx={12} width={92} x={348} y={84} />
      <text className={styles.exitLabel} x={394} y={110}>
        受控出口
      </text>
    </svg>
  );
}

function StreamingDiagram() {
  return (
    <svg
      aria-hidden="true"
      className={styles.diagram}
      focusable="false"
      role="presentation"
      viewBox="0 0 480 220"
    >
      <text className={styles.trackLabel} x={48} y={38}>
        A
      </text>
      <text className={styles.trackLabel} x={48} y={78}>
        B
      </text>
      <text className={styles.trackLabel} x={48} y={118}>
        C
      </text>
      <rect className={styles.streamTrack} height={16} rx={8} width={348} x={72} y={44} />
      <rect className={styles.streamTrack} height={16} rx={8} width={348} x={72} y={84} />
      <rect className={styles.streamTrack} height={16} rx={8} width={348} x={72} y={124} />
      <rect className={styles.dataFrame} data-step={1} height={8} rx={4} width={40} x={84} y={48} />
      <rect className={styles.dataFrame} data-step={2} height={8} rx={4} width={40} x={172} y={48} />
      <rect className={styles.dataFrame} data-step={3} height={8} rx={4} width={40} x={260} y={48} />
      <rect className={styles.dataFrame} data-step={4} height={8} rx={4} width={40} x={84} y={88} />
      <rect className={styles.dataFrame} data-step={5} height={8} rx={4} width={40} x={172} y={88} />
      <rect className={styles.dataFrame} data-step={6} height={8} rx={4} width={40} x={260} y={88} />
      <rect className={styles.dataFrame} data-step={7} height={8} rx={4} width={40} x={84} y={128} />
      <rect className={styles.dataFrame} data-step={8} height={8} rx={4} width={40} x={172} y={128} />
      <rect className={styles.dataFrame} data-step={9} height={8} rx={4} width={40} x={260} y={128} />
      <line className={styles.timeline} x1={72} x2={420} y1={172} y2={172} />
      <line className={styles.timelineTick} x1={72} x2={72} y1={168} y2={176} />
      <line className={styles.timelineTick} x1={188} x2={188} y1={168} y2={176} />
      <line className={styles.timelineTick} x1={304} x2={304} y1={168} y2={176} />
      <line className={styles.timelineTick} x1={420} x2={420} y1={168} y2={176} />
      <line className={styles.sessionBoundary} x1={366} x2={366} y1={28} y2={156} />
      <text className={styles.boundaryLabel} x={366} y={20}>
        会话边界
      </text>
      <line className={styles.playhead} x1={72} x2={72} y1={30} y2={176} />
    </svg>
  );
}

function CommunicationDiagram() {
  return (
    <svg
      aria-hidden="true"
      className={styles.diagram}
      focusable="false"
      role="presentation"
      viewBox="0 0 480 220"
    >
      <text className={styles.pathLabel} x={240} y={40}>
        主路径
      </text>
      <text className={styles.pathLabel} x={240} y={202}>
        替代路径
      </text>
      <line className={styles.mainEdge} data-step={1} x1={68} x2={158} y1={110} y2={64} />
      <line className={styles.mainEdge} data-step={2} x1={178} x2={302} y1={64} y2={64} />
      <line className={styles.mainEdge} data-step={3} x1={322} x2={412} y1={64} y2={110} />
      <line className={styles.degradingEdge} x1={178} x2={302} y1={64} y2={64} />
      <line className={styles.altEdge} data-step={1} x1={168} x2={168} y1={78} y2={142} />
      <line className={styles.altEdge} data-step={2} x1={178} x2={302} y1={156} y2={156} />
      <line className={styles.altEdge} data-step={3} x1={312} x2={312} y1={142} y2={78} />
      <circle className={styles.mainNode} cx={56} cy={110} r={12} />
      <circle className={styles.mainNode} cx={168} cy={64} r={12} />
      <circle className={styles.mainNode} cx={312} cy={64} r={12} />
      <circle className={styles.mainNode} cx={424} cy={110} r={12} />
      <circle className={styles.altNode} data-step={1} cx={168} cy={156} r={12} />
      <circle className={styles.altNode} data-step={3} cx={312} cy={156} r={12} />
    </svg>
  );
}

const DIAGRAMS: Record<EngineeringVisualKind, () => JSX.Element> = {
  ontology: OntologyDiagram,
  streaming: StreamingDiagram,
  communication: CommunicationDiagram,
};

export function InternshipEngineeringVisual({ kind, label }: InternshipEngineeringVisualProps) {
  const Diagram = DIAGRAMS[kind];

  return (
    <figure className={`${styles.figure} profile-reveal`} data-engineering-kind={kind}>
      <Diagram />
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  );
}