import Image from "next/image";

import styles from "./semantica-ecosystem.module.css";

export function SemanticaEcosystem({
  repositoryUrl,
}: {
  repositoryUrl: string;
}): React.JSX.Element {
  return (
    <figure
      aria-label="Semantica 语义与上下文能力图"
      className={styles.figure}
    >
      <Image
        alt="Semantica 项目能力：从多源数据到语义与上下文层，再支持 Agent、检索问答与可审计决策。底栏单列我的四项贡献重点。"
        className={styles.image}
        height={820}
        src="/diagrams/semantica-context-layer.svg"
        unoptimized
        width={1440}
      />
      <figcaption className={styles.caption}>
        <p className={styles.description}>
          图中展示项目整体能力；我的贡献重点为规则推理、真值维护、SPARQL 查询与 DAG 并行。
        </p>
        <div className={styles.links}>
          <a
            className={styles.link}
            href="/diagrams/semantica-context-layer.svg"
            rel="noopener noreferrer"
            target="_blank"
          >
            查看完整能力图
            <span aria-hidden="true">↗</span>
          </a>
          <a
            className={styles.source}
            href={repositoryUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            能力图来源：项目 README
          </a>
        </div>
      </figcaption>
    </figure>
  );
}
