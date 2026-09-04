# Semantica 架构图纯静态化改版 · 实施计划

日期：2026-09-04
设计文档：`docs/superpowers/specs/2026-09-04-semantica-architecture-diagram-design.md`（commit a4cf3ef）
前置：六支柱+三态高亮版本已合并 main（1ee5038）并部署生产。

## Goal

将开源展示区块改为一句话目标：**一张好看的纯静态分层架构图 + 极简 PR 列表**。

- 删除：荣誉徽章、stars 行、亮点列表、"核心架构与合并贡献"标题、交互提示、全部三态交互、feat/fix/MERGED/规模标注
- 新增：四层横带架构图（数据与知识层→推理层→治理层→决策层）+ 端到端溯源右侧贯穿条，纯 CSS、服务端渲染、无 JS
- PR 列表：`PR #1096 · 标题` 一行一条纯链接（open PR 不渲染，与现状一致）

## Architecture

数据模型（`site-content.json` → `openSource` 内）：

```
openSource: {
  name, logo, identity, background, snapshotDate,
  architecture: {
    layers: [                        // 四层，自上而下有序
      { id: "data-knowledge", title: "数据与知识层", summary?, capabilityIds: ["context-management", "knowledge-modeling"] },
      { id: "reasoning",      title: "推理层",       capabilityIds: ["deterministic-reasoning"] },
      { id: "governance",     title: "治理层",       capabilityIds: ["ontology-management"] },
      { id: "decision",       title: "决策层",       capabilityIds: ["decision-intelligence"] }
    ],
    capabilities: [                  // 六个能力域（含溯源）
      { id: "context-management",    label: "上下文管理" },
      { id: "knowledge-modeling",    label: "知识建模" },
      { id: "deterministic-reasoning", label: "确定性推理" },
      { id: "ontology-management",   label: "本体治理" },
      { id: "decision-intelligence", label: "决策智能" },
      { id: "end-to-end-traceability", label: "端到端溯源" }
    ],
    spanningCapabilityIds: ["end-to-end-traceability"]   // 渲染为右侧贯穿条
  },
  contributions: [ { number, title, url, status } ]       // 删 kind/scale，15 条数据完整保留
}
```

渲染层：

- `open-source-spotlight.tsx`（客户端组件）整体删除
- `open-source-showcase.tsx` 改为纯服务端组件：头部标识+background → 分层图 → PR 列表 → 尾注+链接
- `page.tsx` 删除 `fetchGitHubStars` 调用与 `stars` prop 链；`src/lib/github-stars.ts` 确认无引用后删除

## Tech Stack / Global Constraints

- 纯 HTML/CSS 分层带 + 伪元素连接线；**零新增 JS**
- 复用现有暖色 token（terracotta/cream）；能力域为层内小标签
- 响应式：桌面连接线+侧条完整；移动端退化为纯堆叠（媒体查询隐藏连接线与侧条竖排样式）
- 可访问性：`<section aria-label>` + 层带标题文本；无交互即无键盘负担
- 每任务完成必须跑对应测试；全部完成后 `pnpm verify` 全绿
- 提交规范：每任务一个 commit，格式 `semantica-arch: <task 描述>`
- 终端命令一律 `/bin/zsh -lc '<cmd>'` 包装执行

## Tasks

### Task 1 · Schema 闭包改版（TDD）

1. **先改测试** `src/content/schema.test.ts`：
   - 删除 `as unknown as SiteContent` 遗留 cast（3 处），用新结构的合法/非法样例
   - 新增用例：合法 `architecture`（4 层/6 能力域/贯穿条引用合法）通过；capabilityIds 引用不存在能力域时报错；层 id 重复报错；`spanningCapabilityIds` 必须引用已存在能力域；贡献含 `kind`/`scale` 字段时校验失败（严格 schema 拒绝未知字段）；`honors`/`highlights`/`starsSnapshot` 存在时失败
2. **改实现** `src/content/schema.ts`：
   - 删除 `ArchitecturePillar`、`ARCHITECTURE_PILLAR_ORDER`、`CONTRIBUTION_KINDS`、`SCALE_PATTERN`、honors ≥2 校验
   - 新增 `ArchitectureLayer`、`ArchitectureCapability`、`OpenSourceArchitecture` 类型与校验
   - `OpenSourceContribution`：仅 `{number, title, url, status}`；`OpenSource`：移除 `starsSnapshot`/`honors`/`highlights`/`architecturePillars`，新增 `architecture`
   - `validateCapabilityMap` 重命名/重写为分层校验：层有序非空、能力域唯一且全部被 layers 或 spanning 引用、贡献 number 唯一且降序、status ∈ {merged, open}
3. **改 fixture** `src/test/fixtures/site-content.ts`：构造函数与默认值同步新结构
4. 验证：`/bin/zsh -lc 'pnpm vitest run src/content/schema.test.ts'` 全绿

### Task 2 · 内容迁移

1. `content/site-content.json`：
   - `openSource` 下删除 `starsSnapshot`、`honors`、`highlights`、`architecturePillars`
   - 按上文结构写入 `architecture`（4 层 + 6 能力域 + spanningCapabilityIds）
   - 15 条 `contributions` 删除 `kind`、`scale` 字段，其余（number/title/url/status）原样保留
2. `src/content/site-content.test.ts`：更新断言（层数=4、能力域=6、PR 15 条、merged 13 条按 number 降序、无 kind/scale 字段）
3. 检查 `scripts/validate-content.ts` 与 `src/content/loader` 是否引用被删字段，一并更新
4. 验证：`/bin/zsh -lc 'pnpm vitest run src/content'` 全绿；`/bin/zsh -lc 'npx -y tsx scripts/validate-content.ts'` 通过

### Task 3 · UI 重写

1. **先改测试**：
   - 删除 `src/components/home/open-source-spotlight.test.tsx`
   - 重写 `src/components/home/open-source-showcase.test.tsx`：断言渲染 4 个层带标题（数据与知识层/推理层/治理层/决策层）、6 个能力域标签、端到端溯源贯穿条、13 行 `PR #NNNN · 标题` 链接（open PR 不渲染）、尾注"截至 2026-09-04：X 个贡献已合并"、GitHub/复盘链接；断言不出现 stars/Trending/零锁定/feat/fix/MERGED 字样
2. **删** `src/components/home/open-source-spotlight.tsx`
3. **重写** `src/components/home/open-source-showcase.tsx`（服务端组件）：
   - 头部：logo + name + identity + background 段
   - 分层图：`<section aria-label="Semantica 核心架构">` 内四层 `.arch-layer` 带（层名 + 能力域标签）+ 层间连接线（CSS 伪元素）+ 右侧 `.arch-spanning` 竖条（端到端溯源）
   - PR 列表：`<ul class="pr-list">` 每行 `<a>` `PR #{number} · {title}` 外链
   - 尾注 + GitHub/复盘链接保留
4. **改** `src/app/page.tsx`：删 `fetchGitHubStars` import 与调用、删 `stars` prop
5. **删** `src/lib/github-stars.ts`（先 grep 确认零引用）
6. 验证：`/bin/zsh -lc 'pnpm vitest run src/components/home'` 全绿

### Task 4 · CSS

1. `src/app/profile.css`：
   - 删除 `.open-source-stars`、`.open-source-honor-badges`、`.open-source-highlights`、spotlight 全套旧类
   - 新增：`.arch-diagram`（容器/flex 桌面竖排）、`.arch-layer`（横带、轻投影、暖色 token）、`.arch-layer-title`、`.arch-capability`（小标签）、层间连接线（`.arch-layer:not(:last-child)::after` 竖线）、`.arch-spanning`（右侧竖条）
   - 移动断点：隐藏连接线与侧条竖排，全部堆叠
2. `src/app/globals.css:1223` 一带：清理 honor badges 相关规则
3. 验证：`/bin/zsh -lc 'pnpm build'` 成功；`pnpm dev` 人工目检桌面+移动分层图

### Task 5 · E2E 与视觉基线

1. `tests/e2e/helpers/semantica-map.ts`：`expectSemanticaMapComplete` 重写为——4 层带标题、6 能力域、贯穿条、13 条 PR 链接、尾注
2. `tests/e2e/home.spec.ts`、`capability-map-styles.spec.ts`、`accessibility.spec.ts`：更新涉及 stars/支柱按钮/strict-mode 定位的断言
3. 删除旧快照，重生成：`/bin/zsh -lc 'PLAYWRIGHT_UPDATE_SNAPSHOTS=1 npx -y playwright test tests/e2e/visual.spec.ts'`
4. 跑全量 E2E：`/bin/zsh -lc 'npx -y playwright test'`
5. **人工抽查**新视觉基线截图（分层图桌面三档+移动）后确认

### Task 6 · 收尾

1. `/bin/zsh -lc 'pnpm verify'`（typecheck + eslint + vitest + build + e2e）全绿
2. 逐任务 commit 已在 Task 1-5 完成；此处合并检查工作区干净
3. 更新 `.joycode/memory/project_semantica_capability_map.md`：改版完成状态

## Success Criteria

1. 页面无"架构支柱"、Trending/stars/零锁定、feat/fix/MERGED 文案
2. 分层图桌面三档+移动端完整可读，零新增 JS
3. `pnpm verify` 全绿
4. 15 条 PR 数据完整保留在数据层

## Out of Scope

- 部署（push + Vercel CLI 待用户指示后进行）
- metrics 区块与页面其他区域不动