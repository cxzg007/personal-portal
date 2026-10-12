import Image from "next/image";
import Link from "next/link";

import styles from "./lab-entry.module.css";

/**
 * 首页通往 /lab/latent 的入口。
 *
 * 这里只放一张静帧和文字，不 import 任何 src/components/lab 下的东西：
 * 那套场景带着 three.js，一旦进了首页这棵树，首屏体积就回到当初被撤掉的样子，
 * src/lib/dependency-boundary.test.ts 守的就是这条线。
 */
export function LabEntry() {
  return (
    <article className={styles.card}>
      <Link
        aria-label="进入潜空间原型"
        className={styles.poster}
        href="/lab/latent"
        tabIndex={-1}
      >
        <Image
          alt="潜空间场景静帧：一台终端嵌在多层半透明网络结构中间"
          className={styles.posterImage}
          height={1000}
          sizes="(max-width: 900px) 100vw, 46vw"
          src="/lab/latent-poster.webp"
          width={1600}
        />
      </Link>
      <div className={styles.body}>
        <p className={styles.eyebrow} lang="en">
          WEBGL · THREE.JS · CSS3D
        </p>
        <h3 className={styles.title}>潜空间 · 一个可以走进去的模型</h3>
        <p className={styles.lead}>
          一叠半透明的网络层悬在空中，中间那块屏幕是一张真的网页，可以点、可以输入。向它问一句话，这句话会被切成
          token 从屏幕里飞出来，穿过每一层，再带着答案回到屏幕上。
        </p>
        <p className={styles.note}>
          三段式镜头、真实的载入进度、WebGL 与 DOM 同处一个三维空间。建议在电脑上打开，触屏设备会看到一张静帧。
        </p>
        <Link className={styles.enter} href="/lab/latent">
          进入实验 · Enter the prototype
        </Link>
      </div>
    </article>
  );
}
