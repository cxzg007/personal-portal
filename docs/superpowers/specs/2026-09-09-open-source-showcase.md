# 开源贡献卡片：暖色与核心贡献聚焦

## 边界与设计

- 只调整首页开源区，不改其他栏目、部署平台或博客架构。
- 与首页奶油白 / 陶土橙配色融合，移除整块深咖啡色背景。
- 上半区：Semantica 官方 logo、项目背景、Stars 与榜单徽章记录。
- 下半区：个人身份和 10 个已合并 PR，突出 #1226；#1081、#1094 为辅卡。
- 主卡用依赖层 SVG 示意图解释并行执行，不暗示未经测量的性能提升。
- 剩余 7 个已合并 PR 使用原生 details，默认关闭，键盘与禁用 JS 时可用。
- 不把项目荣誉包装成个人获奖；不把未合并 PR 计入贡献数量。
- 不增加运行时外部请求或依赖。Stars 为静态快照，而非实时计数。

## 核实依据（2026-09-09）

- GitHub API `GET /repos/semantica-agi/semantica` 返回 `stargazers_count: 12455`。
- [项目 README](https://github.com/semantica-agi/semantica) 使用如下两枚徽章：
  - [GitHub Trending 日榜 #1](https://trendshift.io/api/badge/repositories/18986)：SVG 文本 `GITHUB TRENDING`、`#1 Repository Of The Day`。
  - [Trendshift · Python 周榜 #3](https://trendshift.io/api/badge/trendshift/repositories/18986/weekly?language=Python)：SVG 文本 `#3 Repository Of The Week`。
- 徽章为项目榜单记录，不声明是今天的实时排名，也不捏造上榜日期。
- [PR #1226](https://github.com/semantica-agi/semantica/pull/1226)：打通并行配置与序列化、按依赖层执行、显式安全声明、输入隔离、有序合并和串行回退。
- [PR #1081](https://github.com/semantica-agi/semantica/pull/1081)：正式 `to_kg_dict()` 适配器连接 ContextGraph、RDF 导出和时间查询。
- [PR #1094](https://github.com/semantica-agi/semantica/pull/1094)：从 `sh:sourceShape` 获取真实约束值，修正校验解释。
- 三个 PR 均通过 GitHub API 确认已合并。其余贡献保留原有 2026-09-04 快照，不扩大本次 PR 状态更新范围。

## 实施与验收

1. `content/site-content.json` / `src/content/schema.ts`：新增带核验日期、正整数名次和 HTTPS 来源的 recognition 结构；测试非法星数、日期、名次、链接。
2. `src/components/home/open-source-showcase.tsx`：项目与个人成果分组；主辅贡献布局；保留真实 PR 链接、自动计算的剩余数量、无 JS 折叠。
3. `src/app/profile.css`：浅暖色卡片、金色名次、主卡并行图、最多 2px 悬停位移；继承 reduced-motion 降级。
4. 检查 lint、TypeScript、Vitest、生产构建，再用 Playwright 验证键盘顺序、可访问性、禁用 JS、展开 / 收起及桌面和窄屏布局，人工复核截图后更新本区影响到的视觉基线。

## 验收结果

- `pnpm lint`、`pnpm typecheck`、`pnpm build` 与 `git diff --check` 通过。
- Vitest：24 个文件、212 项测试通过。
- Playwright 全量：200 项通过，31 项按设备 / 视口条件跳过，0 失败。
- 人工查看 1280 / 1440 桌面、390 窄屏以及展开后截图；更新 5 张受本区改版影响的基线，其余栏目基线不变。
- 本地浏览器无脚本错误、无横向溢出；折叠在禁用 JavaScript 时仍可操作。
- 本地生产预览使用 `http://localhost:3000/#open-source`；上线前验收与正式发布分开进行。
- 发布范围：只提交本次开源区代码、测试、视觉基线及本文；从提交后的干净副本部署到现有 Vercel 项目，不上传工作区的简历原件、临时文件或本地环境变量文件。
