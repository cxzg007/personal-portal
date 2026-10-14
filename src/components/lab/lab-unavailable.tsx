import Image from "next/image";
import Link from "next/link";

import styles from "./lab-unavailable.module.css";

type Reason = "pointer" | "webgl";

const REASON_COPY: Record<Reason, { zh: string; en: string }> = {
  // 终端那一程只能靠悬停触发，手机上点两下也只会停在远景，与其让人卡在那里，
  // 不如把它当成一件明确标注「要在电脑上看」的作品来介绍。
  pointer: {
    zh: "这段交互要靠鼠标悬停和一块够宽的屏幕才走得通，手机上只能先看一张静帧。在电脑上打开 /lab/latent 就能自己走进去。",
    en: "The walkthrough needs hover and a wider screen. Open /lab/latent on a desktop browser to try it.",
  },
  webgl: {
    zh: "当前浏览器没有可用的 WebGL，渲染不了这个三维场景，这里放一张它跑起来的样子。",
    en: "No usable WebGL in this browser. Here is a still of the running scene.",
  },
};

/**
 * WebGL 跑不动、或者设备没有悬停能力时顶上来的页面。
 * 做成一件作品介绍而不是一行报错：看不到动的，至少知道这里原本有什么。
 */
export function LabUnavailable({ reason }: { reason: Reason }) {
  const copy = REASON_COPY[reason];

  return (
    <div className={styles.root}>
      <main className={styles.card}>
        <p className={styles.eyebrow}>LATENT TERMINAL</p>
        <h1 className={styles.title}>潜空间 · 一份可以问的简历</h1>
        <div className={styles.posterFrame}>
          <Image
            alt="潜空间场景静帧：一台终端嵌在多层半透明网络结构中间"
            className={styles.poster}
            height={1000}
            priority
            sizes="(max-width: 720px) 100vw, 720px"
            src="/lab/latent-poster.webp"
            width={1600}
          />
        </div>
        <p className={styles.lead}>
          一叠半透明的结构悬在空中，每一层放着我的一类内容：身份、实习、系统、开源、博客。中间那块屏幕是一张真的网页，
          向它问一句话，这句话会被切成 token
          飞出屏幕，一路走到放着答案的那一层，点亮它，再把检索到的条目带回来。
        </p>
        <p className={styles.reason}>{copy.zh}</p>
        <p className={styles.reasonEn} lang="en">
          {copy.en}
        </p>
        <Link className={styles.back} href="/">
          回到主页 · Back to homepage
        </Link>
      </main>
    </div>
  );
}
