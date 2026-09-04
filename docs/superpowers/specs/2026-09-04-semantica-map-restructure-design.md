# Semantica 双层地图语义重构设计

- 日期：2026-09-04
- 状态：已获用户批准的设计
- 范围：`content/site-content.json`（openSource）、`src/content/schema.ts`、`src/components/home/open-source-spotlight.tsx`、`src/components/home/open-source-showcase.tsx`、相关测试与视觉基线

## 1. 背景与目标

现有"双层能力地图"上层为 5 个能力节点（用户贡献视角的工作链），下层为 6 个贡献域分组（含 open/merged 混排）。用户反馈：

1. 五能力节点对项目本身的表述不完全；
2. 期望上层体现**项目的核心架构和亮点**；
3. 期望下层只放**已合并 PR**，并按重要程度排序（重大的、核心功能增强的在前）。

同时基于 GitHub 实时数据刷新 PR 状态（快照 2026-08-31 → 2026-09-04）。

## 2. PR 状态刷新（数据事实）

以 GitHub `gh pr list -R semantica-agi/semantica --author cxzg007 --state all` 为准：

| 变化 | 详情 |
|---|---|
| #1153 open → merged | `make auto_generate_id a real InitVar in decision models`，2026-08-31 合并，106+/14- |
| 新增 #1360（open） | `dedupe heuristic causes in trace_decision_causality`，46+/3- |
| 新增 #1364（open） | `Align enforce_decision_policy default reasoning limit with record_decision`，82+/5- |

刷新后：**10 merged / 5 open**。

### 2.1 已合并 PR 重要性排序

排序规则（用户确认）：**先 feat 后 fix；同级按代码变更量（additions+deletions）降序**。

| 序 | PR | kind | 规模 | 标题（摘要） |
|---|---|---|---|---|
| 1 | #1096 | feat | 1141+/44- | rule-driven actions with provenance（规则驱动动作+溯源） |
| 2 | #1081 | feat | 277+/28- | to_kg_dict() 适配器（KG 规范形状） |
| 3 | #1226 | fix | 1204+/63- | 依赖层并行执行（set_parallelism） |
| 4 | #1077 | fix | 620+/93- | RETE alpha/beta Token 模型匹配 |
| 5 | #1113 | fix | 200+/6- | RDF 全路径实体名归一化 |
| 6 | #1217 | fix | 144+/2- | 序列化往返保持 |
| 7 | #1094 | fix | 141+/4- | SHACL 真实约束解释 |
| 8 | #1153 | fix | 106+/14- | 决策模型 auto_generate_id InitVar |
| 9 | #1215 | fix | 99+/8- | 已注册步骤处理器接线 |
| 10 | #1143 | fix | 77+/3- | 时间稳定性真实时长计算 |

## 3. 数据模型

### 3.1 `content/site-content.json`（openSource 部分）

- **移除**：`graphNodes`（5 节点）、`contributionDomains`（6 域）。
- **新增 `architecturePillars`**（六支柱，顺序固定如下，每项含 `id`、`title`、`summary`、`prNumbers`）：

| id | title | summary 要点 | prNumbers（均为 merged） |
|---|---|---|---|
| context-management | 上下文管理 | ContextGraph 结构化、可查询；to_kg_dict() 规范形状统一下游消费 | [1081] |
| knowledge-modeling | 知识建模 | 冲突检测与语义去重；时间稳定性度量 | [1113, 1143] |
| deterministic-reasoning | 确定性推理 | RETE/Datalog/SPARQL 推理路径完全可解释 | [1096, 1077] |
| ontology-management | 本体治理 | SHACL 真实约束值解释 | [1094] |
| decision-intelligence | 决策智能 | 决策为一等公民对象：可追溯、因果关联 | [1153] |
| end-to-end-traceability | 端到端溯源 | 执行链路并行化与 PROV-O 审计 | [1215, 1217, 1226] |

- **新增 `highlights`**（亮点摘要行，三项）：
  1. `GitHub Trending #1 Repository of the Day`
  2. `11.4k+ GitHub Stars`
  3. `零厂商锁定：RDF & LPG 存储可热换`
- **`contributions`**：保留全部 15 条（10 merged + 5 open）以保证数据快照真实；#1153 状态更新为 merged；新增 #1360、#1364（open）。每条新增字段：
  - `kind`: `"feat" | "fix"`
  - `scale`: 如 `"1141+/44-"`
  - 数组顺序即下层展示顺序（按 2.1 排序规则，open PR 排在 merged 之后，open 之间按 PR 编号升序）。
- `snapshotDate` → `2026-09-04`。

### 3.2 `src/content/schema.ts`

- 类型替换：`ProjectGraphNode`、`ContributionDomain` → `ArchitecturePillar { id, title, summary, prNumbers }`。
- `OpenSourceContribution` 增加 `kind`、`scale` 字段。
- `OpenSourceProject` 增加 `highlights: string[]`、`architecturePillars: ArchitecturePillar[]`。
- `validateCapabilityMap` 新校验规则：
  1. 支柱 `id` 唯一且非空；
  2. 支柱 `prNumbers` 引用的 PR 均存在于 `contributions`；
  3. 每个 merged PR 至少归属一个支柱；
  4. merged PR 排序合规：feat 在 fix 前；同级 `scale`（additions+deletions 数值）降序。

## 4. 组件与交互

### 4.1 `OpenSourceSpotlight`（客户端岛）

Props 简化为 `{ architecturePillars, highlights, contributions }`。

- **上层**：
  - 顶部渲染 `highlights` 摘要行（`<ul>`，每项一个 `<li>`）。
  - 其后 `<ol aria-label="Semantica 核心架构支柱">` 渲染六张支柱卡片按钮（含 `title` 与 `summary`）。
  - 交互沿用现有模式：`effectivePillarId = activePillarId ?? focusedPillarId ?? hoveredPillarId`；click 切换（`aria-pressed`）、focus/hover 三态、Escape 清除 active；保留"查看全部贡献" reset 按钮。
- **下层**：`<ol aria-label="Semantica 已合并贡献">` 仅渲染 `status === "merged"` 的 contributions，按数据数组顺序平铺（不分域、不分组）。选中支柱时，相关 PR `data-emphasis="active"`，其余 `"muted"`，未选中时全部 `"default"`。
- **open PR 完全不渲染**（数据保留，UI 不展示）。

### 4.2 `OpenSourceShowcase`（服务端组件）

- 地图小节标题改为"核心架构与合并贡献"，说明文字同步（如"六大架构支柱；点击支柱可强调相关已合并贡献"）。
- 边界行改为：`截至 2026-09-04：10 个贡献已合并`（不再提及 open PR）。
- 荣誉徽章、BrandMark、stars、背景说明、两个公开链接保持不变。

### 4.3 CSS

复用现有 5/3/1 列响应式布局与 `data-emphasis` 样式体系；class 语义化更名（如 `open-source-capability-node` → `open-source-architecture-pillar`，`open-source-spotlight-domains` → `open-source-spotlight-contributions`），保留 reduced-motion 支持，不新增静态旋转。

## 5. 测试同步

- **单元**：
  - `schema.test.ts`：新校验规则（支柱引用、归属覆盖、排序合规、非法用例拒绝）。
  - `open-source-spotlight.test.tsx`：6 支柱渲染、摘要行渲染、仅 10 条 merged 链接、排序断言、open PR 不渲染、支柱高亮（active/muted/default）、Escape 与 reset。
  - `open-source-showcase.test.tsx`：新标题/边界行文案、10 merged 计数。
- **fixture**：`src/test/fixtures/site-content.ts` 全量同步新结构。
- **E2E**：`helpers/semantica-map.ts` 的 `expectSemanticaMapComplete` 更新（6 支柱按钮、0 域、10 merged 链接）；`home.spec.ts`、`accessibility.spec.ts` 断言同步。
- **视觉基线**：能力地图相关快照基线更新。
- **门禁**：`pnpm verify` 全绿（lint / typecheck / Vitest / Build / Playwright）。

## 6. 错误处理与边界

- 数据校验失败（引用缺失、排序漂移）在构建期由 `validateCapabilityMap` 拦截。
- `highlights` 或支柱数组为空时组件不渲染对应区块（不抛错）。
- PR 链接沿用 `target="_blank" rel="noreferrer"`。

## 7. 非目标

- 不改动荣誉徽章、stars 展示、文章复盘链接等其他 openSource 区块内容。
- 不新增依赖、不改变服务端渲染边界（spotlight 仍是唯一客户端岛）。
- 不处理 worktree 流程与部署（沿用既有部署方式）。