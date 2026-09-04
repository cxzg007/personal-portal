# Semantica 架构图纯静态化改版设计

日期：2026-09-04
前置：2026-09-04-semantica-map-restructure-implementation（六支柱+三态高亮，已上线）

## 目标

将现有“架构支柱+交互高亮 PR”区块改为一句话目标：**一张好看的纯静态分层架构图，让读者了解项目，图下方放极简 PR 列表**。

## 删除项

- 荣誉徽章行（GitHub Trending #1 of the Day）
- `11.4k+ GitHub Stars` 行（含 `formatStars` 调用与 `.open-source-stars`）
- 亮点列表（零厂商锁定：RDF & LPG 存储可热换 等，`highlights` 数据与 UI）
- “核心架构与合并贡献”标题与交互提示文案
- “查看全部贡献”按钮、全部三态交互（click/focus/hover、Escape、reset）
- PR 条目中的 `FEAT/FIX` kind 标注、`MERGED` 状态徽章、规模（`+NNN/−NNN`）

## 图形态：纯 CSS 端到端分层图

四层横带自上而下 + 层间竖向连接线 + 右侧竖向贯穿条：

```
数据与知识层  [上下文管理] [知识建模]
推理层        [确定性推理]
治理层        [本体治理]
决策层        [决策智能]
右侧贯穿条：端到端溯源（贯穿全层）
```

- 实现：纯 HTML/CSS（div 层带 + 伪元素连接线），服务端渲染，无 JS
- 视觉：复用现有暖色 token（terracotta/cream），层带带轻投影，能力域为层内小标签
- 响应式：桌面连接线+侧条完整呈现；移动端连接线与侧条退化为纯堆叠
- 可访问性：`<section aria-label>` + 层带标题文本，无交互即无键盘负担

## PR 列表：极简行式

`PR #1096 · 标题` 一行一条纯链接（外部跳转）。保留数据层 15 条贡献的完整数据（open PR 不渲染，与现状一致），仅 UI 简化。

## 数据与 schema 变化

- `ArchitecturePillar` → `ArchitectureLayer`：`{id, title(层名), summary?, capabilityIds}`，新增层定义（四层+贯穿条）
- 能力域保留六项（上下文管理、知识建模、确定性推理、本体治理、决策智能、端到端溯源）作为层内标签数据
- `OpenSourceContribution` 移除 `kind`；`scale`、`prNumbers`、`highlights`、`honors`（若仅 Trending 用途）一并移除
- `open-source-spotlight.tsx` 客户端组件整体删除，逻辑并入服务端 `open-source-showcase.tsx`

## 保留项

- 项目背景段（`background`）
- 尾注“截至 2026-09-04：X 个贡献已合并”
- GitHub / 复盘文章链接
- `snapshotDate`、`metrics`（stars 数据保留在数据层，仅不渲染——若 metrics 仅用于 stars 显示则同步评估）

## 测试影响

- 组件测试重写：六支柱按钮/三态断言 → 分层结构+PR 行断言
- E2E：home.spec、capability-map-styles.spec、accessibility.spec、helpers/semantica-map.ts 更新；strict-mode 相关 `.open-source-stars` 定位随删除同步移除
- 视觉基线：semantica-architecture-map.png 等重新生成

## 成功标准

1. 页面不再出现“架构支柱”字样、Trending/stars/零锁定文案、feat/fix/MERGED 标注
2. 分层图在桌面三档+移动端完整可读
3. `pnpm verify` 全绿