# 图文博客发布与首页入口

目标：发布《高并发架构：读写分工与一致性取舍》，从首页首屏直接进入博客列表，新文章显示在首位。

方案：沿用现有 MDX 加载器、文章模板和首页按钮样式。正文保留九个编号章节和四张手绘图；图片使用 Next Image、固定宽高及现有 article-figure 样式，点击后打开高清原图。

实施范围：现有 `design/homepage-typography` 隔离工作区；不修改主目录中的联系表单开发。沿用已授权的 GitHub 推送与 Vercel 正式站发布流程。

## 内容接入

- [x] 将已完成的 Markdown 稿转换为 `content/posts/high-concurrency-read-write-design.mdx`，添加 2026-10-10 发布日期、简介、标签和 featured 标记。
- [x] 将四张 PNG 放入 `public/blog/high-concurrency/`；可编辑 Excalidraw、SVG 和文章草稿保留在 docs 中。
- [x] 在 `src/content/posts.ts` 显式登记新文章，使列表、首页精选、站点地图和 RSS 自动收录。

## 首页入口

- [x] 在 `src/components/home/profile-hero.tsx` 中添加 Next Link，文字“阅读博客”，目标 `/blog`，使用现有次级按钮样式，放在“查看实习”和 GitHub 之间。
- [x] 同步已有文章排序、相邻文章和首页入口断言；以浏览器检查首页 → 列表 → 新文章 → 高清图的完整路径。

## 验证和发布

- [x] 运行 ESLint、TypeScript、单元测试及生产构建。
- [x] 检查博客与元数据回归、四张配图加载、目录跳转、首屏布局和键盘操作，并查看实际截图。
- [ ] 提交并推送当前功能分支，部署 Vercel 正式站，核验公开首页、新文章和图片地址。

验证记录：ESLint、TypeScript、232 项单元测试、Next.js 生产构建通过。浏览器回归首轮 120 项通过；三类旧断言更新后，8 项相关检查通过（含新增文章三种视口的 Axe 检查）。9 项对应视觉检查通过，已逐张查看文章四张图及首页、列表截图。

部署输入使用 `.vercelignore` 排除本地环境文件、草稿、截图和测试报告；干运行确认四张公开 PNG 与新 MDX 均进入部署包。
