import type { ReactNode } from "react";

import styles from "./project-artwork.module.css";

function OntologyArtwork() {
  return (
    <>
      <path className={styles.baseShadow} d="m56 204 184-106 184 106-184 107z" />
      <path className={styles.layerLow} d="m56 177 184-106 184 106v20L240 304 56 197z" />
      <path className={styles.layerMid} d="m56 149 184-106 184 106v20L240 276 56 169z" />
      <path className={styles.layerTop} d="m56 149 184-106 184 106-184 107z" />
      <path className={styles.fineLine} d="m100 175 184-106m-92 159 184-106M100 124l184 106M192 71l184 106" />
      <path className={styles.flow} d="m148 149 92-53 92 53-92 54z" />
      <path className={styles.flow} d="M240 96v107m-92-54h184" />
      {[[148, 149], [240, 96], [332, 149], [240, 203]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <ellipse className={styles.nodeShadow} cx={cx} cy={cy + 5} rx="17" ry="10" />
          <ellipse className={styles.node} cx={cx} cy={cy} rx="17" ry="10" />
          <ellipse className={styles.nodeCore} cx={cx} cy={cy} rx="4" ry="2.5" />
        </g>
      ))}
      <path className={styles.coreSide} d="m209 140 31 18 31-18v15l-31 18-31-18z" />
      <path className={styles.coreTop} d="m209 140 31-18 31 18-31 18z" />
      <text className={styles.label} x="58" y="62">OBJECT</text>
      <path className={styles.callout} d="M60 72h55l33 62" />
      <text className={styles.label} x="368" y="62">RULE</text>
      <path className={styles.callout} d="M397 72h-47l-18 62" />
      <text className={styles.label} x="332" y="288">ACTION</text>
      <path className={styles.callout} d="M320 282h-38l-42-64" />
    </>
  );
}

function StreamingArtwork() {
  const frames = [12, 23, 17, 31, 19, 29, 13, 35, 24, 17, 26, 33, 15, 28, 21, 31];
  return (
    <>
      <path className={styles.fineLine} d="M42 280h398M86 36v245M200 36v245M314 36v245M428 36v245" />
      <text className={styles.label} x="42" y="33">SESSION / REPLAY</text>
      <text className={styles.smallLabel} x="42" y="81">VIDEO</text>
      <text className={styles.smallLabel} x="42" y="156">JOINT</text>
      <text className={styles.smallLabel} x="42" y="232">STATE</text>
      <path className={styles.track} d="M42 110h396M42 188h396M42 262h396" />
      {frames.map((height, index) => (
        <rect className={index < 8 ? styles.frameActive : styles.frame} height={height} key={index} rx="2" width="17" x={48 + index * 24} y={109 - height} />
      ))}
      <path className={styles.waveGhost} d="m46 178 16-5 10 9 10-32 12 18 10-6 15 22 15-38 12 24 14-10 16 17 14-15 15 18 14-27 15 15 12-16 17 16 15-8 15 15 16-24 12 13 17-7 16 15 14-13 17 4" />
      <path className={styles.wave} d="m46 178 16-5 10 9 10-32 12 18 10-6 15 22 15-38 12 24 14-10 16 17 14-15 15 18 14-27 15 15" />
      {[48, 106, 169, 225, 288, 351, 406].map((x, index) => (
        <rect className={index < 4 ? styles.frameActive : styles.frame} height="13" key={x} rx="3" width={index === 6 ? 26 : 44} x={x} y="243" />
      ))}
      <path className={styles.playhead} d="M245 48v231" />
      <path className={styles.playheadCap} d="m239 45 6 7 6-7z" />
      <rect className={styles.readout} height="25" rx="4" width="80" x="205" y="290" />
      <text className={styles.readoutLabel} textAnchor="middle" x="245" y="307">按需读取</text>
      <circle className={styles.cursor} cx="245" cy="170" r="5" />
    </>
  );
}

function RetrievalArtwork() {
  return (
    <>
      <path className={styles.track} d="M44 273h392" />
      <g transform="translate(52 72) rotate(-8 45 64)">
        <rect className={styles.documentBack} height="128" rx="7" width="92" />
      </g>
      <g transform="translate(60 81)">
        <rect className={styles.document} height="128" rx="7" width="92" />
        <path className={styles.documentLine} d="M17 28h34m-34 17h57m-57 17h57m-57 17h37m-37 17h47" />
        <rect className={styles.highlightLine} height="9" rx="2" width="60" x="14" y="57" />
      </g>
      <path className={styles.callout} d="M160 144h31m-6-4 6 4-6 4" />
      <path className={styles.graphLine} d="m205 133 35-37 43 41-12 64-50 2-16-70 78 4m-62 66 19-107m-35 37 66 68m-31-105 31 105" />
      {[[205, 133], [240, 96], [283, 137], [271, 201], [221, 203]].map(([cx, cy], i) => (
        <circle className={i === 1 || i === 3 ? styles.graphActive : styles.graphNode} cx={cx} cy={cy} key={cx} r={i === 1 ? 9 : 6} />
      ))}
      <path className={styles.callout} d="M297 146h26m-6-4 6 4-6 4" />
      <g transform="translate(337 105)">
        <rect className={styles.document} height="87" rx="7" width="92" />
        <path className={styles.documentLine} d="M16 27h59m-59 16h44m-44 16h53" />
        <circle className={styles.seal} cx="79" cy="79" r="16" />
        <path className={styles.check} d="m72 79 5 5 9-10" />
      </g>
      <text className={styles.label} textAnchor="middle" x="105" y="247">CONTEXT</text>
      <text className={styles.label} textAnchor="middle" x="245" y="247">RETRIEVAL</text>
      <text className={styles.label} textAnchor="middle" x="384" y="247">EVIDENCE</text>
      <text className={styles.smallLabel} textAnchor="middle" x="240" y="305">从上下文，到有依据的回答</text>
    </>
  );
}

const artworks: Record<string, { title: string; caption: string; graphic: ReactNode }> = {
  "jd-ontology-platform": { title: "SEMANTIC LAYER", caption: "工程示意 · 对象定义、规则计算与受控写回", graphic: <OntologyArtwork /> },
  "agibot-agent": { title: "STREAMING SYSTEM", caption: "工程示意 · 多路数据与按需流式回放", graphic: <StreamingArtwork /> },
  "cssc-722": { title: "RETRIEVAL & REASONING", caption: "工程示意 · 上下文检索与有依据的回答", graphic: <RetrievalArtwork /> },
};

export function ProjectArtwork({ id }: { id: string }) {
  const artwork = artworks[id];
  if (!artwork) return null;

  return (
    <figure className={styles.artwork}>
      <div aria-hidden="true" className={styles.title}><span />{artwork.title}</div>
      <svg aria-hidden="true" className={styles.svg} fill="none" focusable="false" viewBox="0 0 480 340">{artwork.graphic}</svg>
      <figcaption className={styles.caption}>{artwork.caption}</figcaption>
    </figure>
  );
}
