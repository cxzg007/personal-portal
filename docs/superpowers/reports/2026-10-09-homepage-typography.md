# 首页字体与排版优化

分支 `design/homepage-typography`，基线 `04346b0`。目标是让首页的字体有自己的性格、让正文真正好读，同时不碰任何事实内容、配色体系和已上线的首屏入场编排。

## 两个主要问题

改之前首页所有拉丁字母和数字都走系统默认栈。在 macOS 上是 SF Pro，看着没问题；在 Windows 上会落到 Segoe UI，Linux 上更不确定。等宽标记（`ENGINEERING EXPERIENCE`、`2026-07`、`execution_engine.py`）同样依赖 `SFMono-Regular`，跨平台会掉到 Consolas 或任意 monospace。一个以工程身份为主的作品集，英文和数字的质感恰好是最被看见的部分，却完全交给了运行环境。

更影响阅读的是行长。70rem 容器里，实习经历右栏正文宽 848px，17px 下一行要排到 50 个汉字以上；博客摘要更宽，几乎贴满 1056px。中文正文超过 40 字/行之后回行就开始费劲，这也是"排版不美观"最直接的来源。

## 做了什么

**自托管 IBM Plex Sans Variable + IBM Plex Mono（latin 子集）。** 新增 `src/app/fonts.ts`，用 `next/font/local` 加载 `@fontsource` 里的 woff2，在首页路由自动注入 preload 并生成 Arial 度量回退，避免首屏入场期间字体切换导致大标题回流。两个文件合计约 60KB。选 Plex 的理由是它的工程/文档气质能接住"同济蓝 · 清透作品集"，又明显不是 Inter、Geist 这类一眼模板的默认选项；它的单层 `g`、无横杠 `z`、无斜线 `0` 刚好让 `cxzg007` 这个技术 ID 有了辨识度。

字体只在 `.profile-shell` 作用域里接入，所以博客页面保持基线，视觉快照未变动，确认没有跨路由泄漏。两个子集都只含 latin，中文照常落到 PingFang SC / Microsoft YaHei。额外收益是可变字重让样式表里原有的 `font-weight: 550 / 650` 真正生效，不再被就近吸附到 500 或 700。

**统一一套字号标尺。** 在 `.profile-shell` 上新增 `--profile-type-body: 1.0625rem`、`--profile-type-meta`、`--profile-leading-body: 1.85`、`--profile-measure: 42rem`，然后把九处散落的 `font-size: 1rem; line-height: 1.8` 换成 token。正文提到 17px 是因为 Plex Sans 的 x-height 比 SF Pro 略小，17px 让拉丁字母和同尺寸的中文看起来重量相当。

**把行长收到 42rem（约 38 个汉字）。** 实习正文、系统案例、开源说明、博客摘要、联系文案统一受限。实习卡左栏同时从 14rem 放宽到 16.5rem、栏间距 3rem → 3.5rem，工程示意图因此更宽敞，右侧正文自然收窄，不是靠留白硬挤出来的。

**调紧标题与节奏。** 栏目标题的衬线中文几乎没有降部，原来 1.5 的行高让标题浮在分隔线上方，改成 1.25、字距 0.02em；英文等宽副标字距 0.12em → 0.16em、字重 500，更像刻意排的标记而不是缩小的正文。技术 ID 字距 -0.06em → -0.045em（Plex 比系统栈宽，太紧会糊住字怀），行高 1.05 → 1。章节上下留白 4.5rem → 5.5rem，标题到正文 2rem → 2.5rem。开源区的 star 数和贡献计数加上 tabular-nums 与收紧的字距。

## 验证

Vitest 24 文件 / 231 项通过；ESLint、`tsc --noEmit`、内容校验、生产构建全部通过。

Playwright 首轮 272 passed / 9 failed，9 项全部是首页视觉快照差异（排版改动的必然结果），没有功能或可访问性失败；博客快照原样通过。人工看过桌面首屏、实习、博客和移动端截图后 `--update-snapshots`，复跑 281 passed / 34 按设备跳过。

320 / 390 / 768 / 1024 / 1440 / 1920px 无横向溢出；`html{font-size:32px}` 模拟 200% 文字放大同样无溢出。

## 截图

- 桌面首屏：`assets/2026-10-09-typography-hero.png`
- 实习经历：`assets/2026-10-09-typography-internships.png`
- 技术博客：`assets/2026-10-09-typography-writing.png`
- 移动端 390px：`assets/2026-10-09-typography-mobile.png`

## 没有改的部分

事实内容（实习经历、19 个 PR、维护者身份、量化指标、教育信息、文章正文）、蓝白配色 token、栏目中英双层标题、首屏约 1920ms 入场编排、贡献落点图结构、Semantica 官方图标，以及博客页面的版式。
