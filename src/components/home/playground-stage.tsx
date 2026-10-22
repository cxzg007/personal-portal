import Image from "next/image";
import Link from "next/link";
import styles from "./playground-stage.module.css";

export function PlaygroundStage() {
  return (
    <article aria-labelledby="playground-heading" className={styles.stage} id="playground">
      <div className={styles.heading}>
        <h3 id="playground-heading">复古电脑房间</h3>
        <span>OFF THE CLOCK / 屏幕之外</span>
      </div>
      <div className={styles.room}>
        <div className={styles.topline}>
          <span><i aria-hidden="true" /> PERSONAL SPACE</span>
          <span>一台旧电脑，一种新视角。</span>
        </div>
        <Link aria-label="进入 3D 空间" className={styles.preview} href="/playground" prefetch={false}>
          <Image
            alt="灰色房间里的复古电脑、键盘、办公桌与绿植"
            className={styles.image}
            height={768}
            sizes="(max-width: 760px) 100vw, 1100px"
            src="/experiments/henry/room-preview.jpg"
            unoptimized
            width={1507}
          />
          <span className={styles.enter}>进入 3D 空间 <span aria-hidden="true">↗</span></span>
        </Link>
        <div className={styles.caption}>
          <p>坐到电脑前，打开属于我的数字桌面。</p>
          <span>探索房间 · 操作窗口 · 发现彩蛋</span>
        </div>
      </div>
    </article>
  );
}
