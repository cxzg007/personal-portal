import { InternshipMotion } from "./internship-motion";
import styles from "./internship-diagram.module.css";

function OntologyFlow() {
  const route = "M48 47 H100 V117 V195";
  return (
    <svg className={styles.diagram} viewBox="0 0 200 240" role="img" aria-label="供应商与资质形成业务关系，经过规则校验，再进行受控的事务写入。">
      <g className={styles.connector}>
        <path d="M48 47H152M100 47V105M100 153V189" />
        <path d="m97 101 3 4 3-4m-6 84 3 4 3-4" />
      </g>
      <path d={route} className={styles.signal} pathLength="100" />
      <rect x="16" y="25" width="65" height="42" rx="7" className={styles.node} />
      <rect x="119" y="25" width="65" height="42" rx="7" className={styles.node} />
      <text x="48" y="51" className={styles.label}>供应商</text>
      <text x="152" y="51" className={styles.label}>资质</text>
      <text x="100" y="88" className={styles.annotation}>实体 · 属性 · 关系</text>
      <rect x="24" y="107" width="152" height="48" rx="7" className={styles.focusNode} />
      <text x="100" y="128" className={styles.label}>规则校验</text>
      <text x="100" y="145" className={styles.annotation}>授权 / 预览 / 配置指纹</text>
      <text x="142" y="176" className={styles.code}>SQL</text>
      <rect x="42" y="191" width="116" height="32" rx="7" className={styles.node} />
      <path d="m54 207 3 3 6-6" className={styles.check} />
      <text x="108" y="212" className={styles.label}>事务写入</text>
    </svg>
  );
}

function PlaybackFlow() {
  return (
    <svg className={styles.diagram} viewBox="0 0 200 240" role="img" aria-label="HTTP 与 WebSocket 共用解析层，三条事件轨道沿同一虚拟时钟同步回放。">
      <g className={styles.connector}>
        <path d="M52 48V63H148V48M100 63V82M100 118V138" />
        <path d="m97 78 3 4 3-4" />
      </g>
      <rect x="15" y="22" width="75" height="28" rx="6" className={styles.node} />
      <rect x="110" y="22" width="75" height="28" rx="6" className={styles.node} />
      <text x="52" y="40" className={styles.code}>HTTP</text>
      <text x="148" y="40" className={styles.code}>WebSocket</text>
      <rect x="24" y="84" width="152" height="34" rx="7" className={styles.focusNode} />
      <text x="100" y="106" className={styles.label}>共享解析 · clip-player</text>
      <rect x="15" y="138" width="170" height="85" rx="7" className={styles.node} />
      <text x="28" y="157" className={styles.trackTitle}>虚拟时钟</text>
      <text x="171" y="157" className={styles.timelineUnit}>t →</text>
      <g className={styles.tracks}>
        <path d="M28 173H172M28 189H172M28 205H172" />
      </g>
      <g className={styles.events}>
        <rect x="35" y="169" width="28" height="8" rx="2" />
        <rect x="76" y="169" width="18" height="8" rx="2" />
        <rect x="107" y="169" width="39" height="8" rx="2" />
        <rect x="47" y="185" width="15" height="8" rx="2" />
        <rect x="78" y="185" width="44" height="8" rx="2" />
        <rect x="141" y="185" width="20" height="8" rx="2" />
        <rect x="33" y="201" width="50" height="8" rx="2" />
        <rect x="101" y="201" width="24" height="8" rx="2" />
        <rect x="145" y="201" width="21" height="8" rx="2" />
      </g>
      <g className={styles.playhead}>
        <path d="M0 165V213" />
        <path d="m-3 162 3 4 3-4z" />
      </g>
    </svg>
  );
}

function RetrievalFlow() {
  const route = "M48 47V67H100V175H151V202H100V214";
  return (
    <svg className={styles.diagram} viewBox="0 0 200 240" role="img" aria-label="关键词与向量进行混合检索，Supervisor 路由到知识问答或任务规划，生成可追溯的回答。">
      <g className={styles.connector}>
        <path d="M48 47V67H152V47M100 67V83M100 111V130M100 158V172H49V180M100 172H151V180M49 205V219H151V205" />
        <path d="m97 79 3 4 3-4m-6 43 3 4 3-4" />
      </g>
      <path d={route} className={styles.signal} pathLength="100" />
      <rect x="15" y="21" width="67" height="28" rx="6" className={styles.node} />
      <rect x="118" y="21" width="67" height="28" rx="6" className={styles.node} />
      <text x="48" y="40" className={styles.label}>关键词</text>
      <text x="152" y="40" className={styles.label}>向量</text>
      <rect x="40" y="85" width="120" height="28" rx="6" className={styles.node} />
      <text x="100" y="104" className={styles.label}>混合检索</text>
      <rect x="24" y="132" width="152" height="28" rx="6" className={styles.focusNode} />
      <text x="100" y="151" className={styles.label}>Supervisor 路由</text>
      <rect x="15" y="182" width="68" height="26" rx="6" className={styles.node} />
      <rect x="117" y="182" width="68" height="26" rx="6" className={styles.node} />
      <text x="49" y="200" className={styles.annotation}>知识问答</text>
      <text x="151" y="200" className={styles.annotation}>任务规划</text>
      <rect x="58" y="211" width="84" height="26" rx="5" className={styles.answerLabel} />
      <text x="100" y="229" className={styles.annotation}>可追溯回答</text>
    </svg>
  );
}

export function InternshipDiagram({ internshipId }: { internshipId: string }) {
  switch (internshipId) {
    case "jd-ontology-platform":
      return <InternshipMotion id={internshipId} title="从本体到执行"><OntologyFlow /></InternshipMotion>;
    case "agibot-agent":
      return <InternshipMotion id={internshipId} title="沿同一时间轴回放"><PlaybackFlow /></InternshipMotion>;
    case "cssc-722":
      return <InternshipMotion id={internshipId} title="从检索到回答"><RetrievalFlow /></InternshipMotion>;
    default:
      return null;
  }
}
