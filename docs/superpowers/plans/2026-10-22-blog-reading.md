# 博客阅读版式实施计划

**Goal:** 将已确认的参考方向应用到全部博客详情页。
**Architecture:** 复用 MDX 服务端文章模板，在现有 blog.css 中调整限定于文章页的样式；ArticleToc 增加渐进增强的阅读位置跟踪。
**Tech Stack:** Next.js 16.3.1、React、CSS、Playwright。

## 约束

在现有隔离工作树执行；不修改主目录未提交工作。正文保留 18px/1.85 与小屏 17px；不改文章正文或图片内容；沿用编号标题、原生锚点与无脚本目录。

## 执行

- [ ] 在 tests/e2e/article-reading.spec.ts 增加目录点击与回读、直接锚点、图片展示的行为检查，确认当前实现尚无 aria-current。
- [ ] 修改 src/components/blog/article-toc.tsx，以 rAF 合并滚动事件，按标题位置设置 aria-current，监听内容尺寸变化并清理所有监听；保留 SSR 链接和 details。
- [ ] 修改 src/app/blog/[slug]/page.tsx 标题主题层级、日期去重与中英目录标识；修改 src/app/blog.css 的标题区、章节、图注、引用、代码及相邻文章样式。
- [ ] 同步 tests/e2e/blog.spec.ts 的文章列表预期与标题区背景预期；宽屏扩展配图后调整 concurrency-article.spec.ts 的图片宽度边界。
- [ ] 运行 lint、单元测试、正确域名的生产构建；用独立端口跑博客 E2E、目录新行为及 Axe 检查。
- [ ] 截图审阅标题区、图文区及小屏；更新对应文章视觉基线；提交推送并部署正式站，核验线上入口及配图。
