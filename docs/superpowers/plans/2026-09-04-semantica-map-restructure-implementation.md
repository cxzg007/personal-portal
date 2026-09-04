# Semantica 双层地图语义重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将开源经历双层地图重构为"上层六大架构支柱+亮点摘要、下层仅按重要性排序的已合并 PR"，并刷新 PR 状态（10 merged / 5 open）。

**Architecture:** 数据先行：schema 类型与校验（Task 1）→ 内容与 fixture 迁移（Task 2）→ 客户端岛重写（Task 3）→ 服务端组件与 CSS（Task 4）→ E2E（Task 5）→ 视觉基线与全量验证（Task 6）。spotlight 仍是唯一客户端岛，服务端渲染边界不变。

**Tech Stack:** Next.js (App Router) + TypeScript + Vitest + Playwright + 现有 CSS（无 CSS 框架）。

**Spec:** `docs/superpowers/specs/2026-09-04-semantica-map-restructure-design.md`

## Global Constraints

- 不新增任何依赖（package.json 零变化）。
- spotlight 保持 `"use client"`，showcase 保持服务端组件；不改变渲染边界。
- 所有 15 条 PR（10 merged + 5 open）保留在数据中；**UI 只渲染 merged**。
- 下层排序：feat 在 fix 前，同级按变更量（additions+deletions）降序；open PR 排在 merged 之后、按编号升序。
- 快照事实：#1153 已 merged；新增 open PR #1360、#1364；snapshotDate = `2026-09-04`；merged 计数 = 10。
- `validateSiteContent` 中 contributions 数量锁从 13 改为 15、merged 计数锁从 9 改为 10。
- PR 链接一律 `target="_blank" rel="noreferrer"`。
- 不新增静态旋转；保留 reduced-motion 支持。
- 现有响应式布局体系（5/3/1 列）与 `data-emphasis` 三态机制沿用，仅做语义化 class 更名。
- 测试命令：单测 `pnpm vitest run <file>`；全量门禁 `pnpm verify`。
- 每个 Task 结束必须提交（feat/test/chore 前缀）。

---

### Task 1: Schema 类型与校验闭包

**Files:**
- Modify: `src/content/schema.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: 现有 `OpenSourceContribution`、`OpenSourceProject`、`validateSiteContent`。
- Produces（后续任务依赖的精确签名）:
  - `export type ArchitecturePillar = { id: string; title: string; summary: string; prNumbers: number[] };`
  - `OpenSourceContribution` 增加 `kind: "feat" | "fix"` 与 `scale: string`（格式 `NNN+/NNN-`）
  - `OpenSourceProject` 增加 `highlights: string[]` 与 `architecturePillars: ArchitecturePillar[]`，移除 `graphNodes`、`contributionDomains`
  - `export function validateCapabilityMap(architecturePillars: unknown, contributions: unknown): string[];`（签名从 3 参变 2 参）
  - 移除导出：`ProjectGraphNode`、`ContributionDomain`

- [ ] **Step 1: 写失败测试**

在 `src/content/schema.test.ts` 中改造能力地图相关用例（保留其余 describe 不动）：

```ts
import { validateCapabilityMap, validateSiteContent } from "@/content/schema";

const PILLARS = [
  { id: "context-management", title: "上下文管理", summary: "ContextGraph 结构化、可查询。", prNumbers: [1081] },
  { id: "knowledge-modeling", title: "知识建模", summary: "冲突检测与语义去重。", prNumbers: [1113, 1143] },
  { id: "deterministic-reasoning", title: "确定性推理", summary: "RETE/Datalog/SPARQL 可解释。", prNumbers: [1096, 1077] },
  { id: "ontology-management", title: "本体治理", summary: "SHACL 真实约束解释。", prNumbers: [1094] },
  { id: "decision-intelligence", title: "决策智能", summary: "决策为一等公民对象。", prNumbers: [1153] },
  { id: "end-to-end-traceability", title: "端到端溯源", summary: "执行链路并行与 PROV-O 审计。", prNumbers: [1215, 1217, 1226] },
];

const CONTRIBUTIONS = [
  { number: 1096, status: "merged", kind: "feat", scale: "1141+/44-", summary: "规则驱动动作。", url: "https://github.com/semantica-agi/semantica/pull/1096" },
  { number: 1081, status: "merged", kind: "feat", scale: "277+/28-", summary: "KG 适配器。", url: "https://github.com/semantica-agi/semantica/pull/1081" },
  { number: 1226, status: "merged", kind: "fix", scale: "1204+/63-", summary: "依赖层并行。", url: "https://github.com/semantica-agi/semantica/pull/1226" },
  { number: 1077, status: "merged", kind: "fix", scale: "620+/93-", summary: "RETE Token 模型。", url: "https://github.com/semantica-agi/semantica/pull/1077" },
  { number: 1143, status: "merged", kind: "fix", scale: "77+/3-", summary: "时间稳定性。", url: "https://github.com/semantica-agi/semantica/pull/1143" },
  { number: 1160, status: "open", kind: "fix", scale: "113+/20-", summary: "合规检查抛错。", url: "https://github.com/semantica-agi/semantica/pull/1160" },
];
```

用例清单（每个独立 `it`）：
1. `validateCapabilityMap(PILLARS, CONTRIBUTIONS)` 返回 `[]`。
2. 支柱引用不存在的 PR（prNumbers 含 9999）→ errors 包含 "must reference an existing contribution"。
3. merged PR #1143 不归属任何支柱 → errors 包含 "must belong to at least one architecture pillar"。
4. 支柱 id 重复 → errors 包含 "duplicate ids"。
5. 支柱 id 顺序与固定六 id 不符（交换前两项）→ errors 包含 "required ordered ids"。
6. merged 排序违规（把 #1143 移到 #1096 之前，即 fix 在 feat 前）→ errors 包含 "merged contributions must be ordered"。
7. feat 同级排序违规（#1081 在 #1096 前）→ 同上排序错误。
8. `scale` 格式非法（"1141"）→ errors 包含 "must match the NNN+/NNN- format"。
9. `kind` 非 feat/fix → errors 包含 "kind must be feat or fix"。
10. `validateSiteContent` 快照（fixture 迁移后 Task 2 提供，本 task 先以"count 15 / merged 10"错误信息断言占位——见 Step 3 中对应实现，测试先写好：传入缺 graphNodes 的旧结构应报 "openSource.contributions must contain exactly 15 entries" 当只有 13 条时）。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run src/content/schema.test.ts`
Expected: FAIL（`ArchitecturePillar` 不存在 / validateCapabilityMap 参数不匹配）。

- [ ] **Step 3: 修改 `src/content/schema.ts`**

1. 删除类型 `ProjectGraphNode`、`ContributionDomain`；新增：

```ts
export type ArchitecturePillar = {
  id: string;
  title: string;
  summary: string;
  prNumbers: number[];
};
```

2. `OpenSourceContribution` 增加：

```ts
  kind: "feat" | "fix";
  scale: string;
```

3. `OpenSourceProject` 移除 `graphNodes`、`contributionDomains`，增加：

```ts
  highlights: string[];
  architecturePillars: ArchitecturePillar[];
```

4. 常量替换：

```ts
const ARCHITECTURE_PILLAR_ORDER = [
  "context-management",
  "knowledge-modeling",
  "deterministic-reasoning",
  "ontology-management",
  "decision-intelligence",
  "end-to-end-traceability",
] as const;
const CONTRIBUTION_KINDS = new Set<OpenSourceContribution["kind"]>(["feat", "fix"]);
const SCALE_PATTERN = /^\d+\+\/\d+-$/;
```

删除 `CAPABILITY_NODE_ORDER`、`CONTRIBUTION_DOMAIN_ORDER`。

5. `validateSiteContent` 中 openSource 段：
   - `contributions.length !== 13` → `!== 15`；`mergedCount !== 9` → `!== 10`。
   - 每条 contribution 增加 `kind`（`CONTRIBUTION_KINDS` 校验）与 `scale`（`SCALE_PATTERN` 校验）字段检查。
   - 增加 `checkStringArray(openSource.highlights, "openSource.highlights", 1)`。
   - 调用改为 `errors.push(...validateCapabilityMap(openSource.architecturePillars, openSource.contributions))`。

6. `validateCapabilityMap` 重写为两参版本：

```ts
export function validateCapabilityMap(
  architecturePillars: unknown,
  contributions: unknown,
): string[] {
  const errors: string[] = [];
  const checkRecord = (value: unknown, path: string): Record<string, unknown> | undefined => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path} must be an object`);
      return undefined;
    }
    return value as Record<string, unknown>;
  };
  const checkText = (value: unknown, path: string): string | undefined => {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${path} must be a non-empty string`);
      return undefined;
    }
    return value;
  };
  const scaleValue = (scale: string): number =>
    scale.split("/").reduce((sum, part) => sum + Number(part.replace(/\D/g, "")), 0);

  // 1. 收集 PR 编号与 merged 排序合规
  const mergedOrder: Array<{ number: number; kind: string; scale: number }> = [];
  if (!Array.isArray(contributions)) {
    errors.push("openSource.contributions must be an array");
  } else {
    contributions.forEach((contribution, index) => {
      const value = checkRecord(contribution, `openSource.contributions[${index}]`);
      if (!value) return;
      if (value.status === "merged") {
        mergedOrder.push({
          number: value.number as number,
          kind: value.kind as string,
          scale: scaleValue(String(value.scale ?? "0+/0-")),
        });
      }
    });
    const rank = (kind: string) => (kind === "feat" ? 0 : 1);
    for (let i = 1; i < mergedOrder.length; i += 1) {
      const prev = mergedOrder[i - 1];
      const curr = mergedOrder[i];
      const outOfOrder =
        rank(prev.kind) > rank(curr.kind) ||
        (rank(prev.kind) === rank(curr.kind) && prev.scale < curr.scale);
      if (outOfOrder) {
        errors.push("openSource.contributions merged entries must be ordered: feat before fix, then descending scale");
        break;
      }
    }
  }

  // 2. 支柱校验
  const validPrNumbers = new Set<number>(
    Array.isArray(contributions)
      ? contributions
          .map((c) => (typeof (c as Record<string, unknown>).number === "number" ? (c as Record<string, unknown>).number as number : undefined))
          .filter((n): n is number => n !== undefined)
      : [],
  );
  const mappedPrNumbers = new Set<number>();
  const orderedPillarIds: string[] = [];
  const seenPillarIds = new Set<string>();
  if (!Array.isArray(architecturePillars)) {
    errors.push("openSource.architecturePillars must be an array");
  } else {
    if (architecturePillars.length !== ARCHITECTURE_PILLAR_ORDER.length) {
      errors.push("openSource.architecturePillars must contain exactly 6 entries");
    }
    architecturePillars.forEach((pillar, index) => {
      const value = checkRecord(pillar, `openSource.architecturePillars[${index}]`);
      if (!value) return;
      const id = checkText(value.id, `openSource.architecturePillars[${index}].id`);
      if (id !== undefined) {
        orderedPillarIds.push(id);
        if (seenPillarIds.has(id)) errors.push("openSource.architecturePillars must not contain duplicate ids");
        else seenPillarIds.add(id);
      }
      checkText(value.title, `openSource.architecturePillars[${index}].title`);
      checkText(value.summary, `openSource.architecturePillars[${index}].summary`);
      if (!Array.isArray(value.prNumbers)) {
        errors.push(`openSource.architecturePillars[${index}].prNumbers must be an array`);
      } else {
        value.prNumbers.forEach((prNumber, prIndex) => {
          if (typeof prNumber === "number" && validPrNumbers.has(prNumber)) {
            mappedPrNumbers.add(prNumber);
            return;
          }
          errors.push(`openSource.architecturePillars[${index}].prNumbers[${prIndex}] must reference an existing contribution`);
        });
      }
    });
    if (
      orderedPillarIds.length !== ARCHITECTURE_PILLAR_ORDER.length ||
      orderedPillarIds.some((id, index) => id !== ARCHITECTURE_PILLAR_ORDER[index])
    ) {
      errors.push("openSource.architecturePillars must use the required ordered ids");
    }
  }

  // 3. merged PR 归属覆盖
  if (Array.isArray(contributions)) {
    contributions.forEach((contribution) => {
      const value = contribution as Record<string, unknown>;
      if (value.status === "merged" && !mappedPrNumbers.has(value.number as number)) {
        errors.push(`openSource.contributions PR #${value.number} must belong to at least one architecture pillar`);
      }
    });
  }

  return errors;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `pnpm vitest run src/content/schema.test.ts`
Expected: PASS（本 task 用例全绿；fixture 相关旧断言若失败属预期，统一在 Task 2 迁移后修复——若 schema.test.ts 中依赖旧 fixture 的用例失败，将其标记/调整为依赖新 fixture 结构，与 Task 2 的 Step 2 一并完成后再验证）。

- [ ] **Step 5: 提交**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "feat: replace capability map schema with architecture pillars and merged-first ordering"
```

---

### Task 2: 内容迁移与 fixture 同步

**Files:**
- Modify: `content/site-content.json`
- Modify: `src/test/fixtures/site-content.ts`
- Modify: `scripts/validate-content.ts`（如引用旧字段则同步）

**Interfaces:**
- Consumes: Task 1 的 `ArchitecturePillar`、`OpenSourceContribution`（含 kind/scale）。
- Produces: `validSiteContent.openSource` 新结构（Task 3/4 组件与 Task 5 E2E 依赖）。

- [ ] **Step 1: 迁移 `content/site-content.json` 的 openSource**

1. `snapshotDate` 改为 `"2026-09-04"`。
2. 删除 `graphNodes`、`contributionDomains` 两个数组。
3. 新增 `highlights`（置于 honors 之后）：

```json
"highlights": [
  "GitHub Trending #1 Repository of the Day",
  "11.4k+ GitHub Stars",
  "零厂商锁定：RDF & LPG 存储可热换"
],
```

4. 新增 `architecturePillars`（置于 highlights 之后）：

```json
"architecturePillars": [
  {
    "id": "context-management",
    "title": "上下文管理",
    "summary": "ContextGraph 结构化、可查询；to_kg_dict() 规范形状统一下游消费。",
    "prNumbers": [1081]
  },
  {
    "id": "knowledge-modeling",
    "title": "知识建模",
    "summary": "冲突检测与语义去重；时间稳定性度量。",
    "prNumbers": [1113, 1143]
  },
  {
    "id": "deterministic-reasoning",
    "title": "确定性推理",
    "summary": "RETE/Datalog/SPARQL 推理路径完全可解释。",
    "prNumbers": [1096, 1077]
  },
  {
    "id": "ontology-management",
    "title": "本体治理",
    "summary": "SHACL 真实约束值解释。",
    "prNumbers": [1094]
  },
  {
    "id": "decision-intelligence",
    "title": "决策智能",
    "summary": "决策为一等公民对象：可追溯、因果关联。",
    "prNumbers": [1153]
  },
  {
    "id": "end-to-end-traceability",
    "title": "端到端溯源",
    "summary": "执行链路并行化与 PROV-O 审计。",
    "prNumbers": [1215, 1217, 1226]
  }
],
```

5. `contributions` 全量重排为 15 条（每条保留现有 `summary`、`url` 原文，仅按新顺序排列并补 `kind`/`scale`；#1153 status 改 `"merged"`；新增 #1360、#1364）。**数组顺序即最终顺序**：

| 序 | number | status | kind | scale |
|---|---|---|---|---|
| 1 | 1096 | merged | feat | 1141+/44- |
| 2 | 1081 | merged | feat | 277+/28- |
| 3 | 1226 | merged | fix | 1204+/63- |
| 4 | 1077 | merged | fix | 620+/93- |
| 5 | 1113 | merged | fix | 200+/6- |
| 6 | 1217 | merged | fix | 144+/2- |
| 7 | 1094 | merged | fix | 141+/4- |
| 8 | 1153 | merged | fix | 106+/14- |
| 9 | 1215 | merged | fix | 99+/8- |
| 10 | 1143 | merged | fix | 77+/3- |
| 11 | 1160 | open | fix | 113+/20- |
| 12 | 1208 | open | fix | 137+/11- |
| 13 | 1243 | open | feat | 1095+/53- |
| 14 | 1360 | open | fix | 46+/3- |
| 15 | 1364 | open | fix | 82+/5- |

两条新增 PR 的完整对象：

```json
{
  "number": 1360,
  "status": "open",
  "kind": "fix",
  "scale": "46+/3-",
  "summary": "决策因果追踪中启发式原因去重。",
  "url": "https://github.com/semantica-agi/semantica/pull/1360"
},
{
  "number": 1364,
  "status": "open",
  "kind": "fix",
  "scale": "82+/5-",
  "summary": "对齐 enforce_decision_policy 与 record_decision 的默认推理上限。",
  "url": "https://github.com/semantica-agi/semantica/pull/1364"
}
```

6. `metrics` 中 "Semantica PR" 指标同步：`value: 15`，`evidence: "GitHub 查询于 2026-09-04 返回十五个 PR，其中十个已合并。"`（保持其余字段不变）。
7. `repositoryUrl`、`articlePath`、`honors`、`background`、`identity`、`logo`、`starsSnapshot` 保持原值。

- [ ] **Step 2: 同步 `src/test/fixtures/site-content.ts`**

fixture 的 `openSource` 与 Step 1 的正式内容完全一致（六个支柱、15 条 contributions、highlights、snapshotDate、metrics 同步）。fixture 的 `metrics` 中 "Semantica PR" 也改为 15。fixture 类型断言（如文件尾部有 `satisfies SiteContent`）保持通过。

- [ ] **Step 3: 验证内容合法**

Run: `pnpm vitest run src/content/schema.test.ts src/components/home/open-source-showcase.test.tsx src/components/home/open-source-spotlight.test.tsx 2>&1 | tail -20`
Expected: schema 测试 PASS；两个组件测试 FAIL 属预期（组件尚未迁移，Task 3/4 处理）。若 `pnpm tsx scripts/validate-content.ts` 存在且引用旧字段，同步更新后运行通过。

- [ ] **Step 4: 提交**

```bash
git add content/site-content.json src/test/fixtures/site-content.ts scripts/validate-content.ts
git commit -m "feat: migrate openSource content to architecture pillars and refreshed PR snapshot"
```

---

### Task 3: 客户端岛重构（OpenSourceSpotlight）

**Files:**
- Modify: `src/components/home/open-source-spotlight.tsx`
- Test: `src/components/home/open-source-spotlight.test.tsx`

**Interfaces:**
- Consumes: Task 1 类型、Task 2 fixture。
- Produces（Task 4/5 依赖的 DOM 契约）:
  - 支柱按钮：`className="open-source-architecture-pillar"`，可访问名以 `架构支柱：{title}` 开头（含摘要副文本），`aria-pressed` 三态
  - merged 条目：`li[data-testid="merged-contribution"][data-pr-number][data-emphasis]`，内部 `a.open-source-pr-link`
  - 容器：`data-testid="open-source-spotlight"`、`data-selected-pillar={activePillarId ?? "all"}`
  - 列表 aria-label：支柱层 `"Semantica 架构支柱"`；贡献层 `"Semantica 已合并贡献"`

- [ ] **Step 1: 重写失败测试 `src/components/home/open-source-spotlight.test.tsx`**

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { validSiteContent } from "@/test/fixtures/site-content";

import { OpenSourceSpotlight } from "./open-source-spotlight";

const project = validSiteContent.openSource;
const renderSpotlight = () =>
  render(
    <OpenSourceSpotlight
      pillars={project.architecturePillars}
      contributions={project.contributions}
    />,
  );

afterEach(cleanup);

describe("OpenSourceSpotlight", () => {
  it("renders the complete ordered map before interaction", () => {
    renderSpotlight();
    expect(screen.getAllByRole("button", { name: /^架构支柱/ })).toHaveLength(6);
    expect(screen.getAllByTestId("merged-contribution")).toHaveLength(10);
    expect(screen.getAllByRole("link", { name: /^PR #/ })).toHaveLength(10);
    expect(screen.getByRole("button", { name: "查看全部贡献" })).toHaveAttribute("aria-disabled", "true");
  });

  it("orders merged contributions feat-first then by descending scale", () => {
    renderSpotlight();
    const numbers = screen
      .getAllByRole("link", { name: /^PR #/ })
      .map((link) => /PR #(\d+)/.exec(link.textContent ?? "")?.[1]);
    expect(numbers).toEqual(["1096", "1081", "1226", "1077", "1113", "1217", "1094", "1153", "1215", "1143"]);
  });

  it("never renders open contributions", () => {
    renderSpotlight();
    for (const number of [1160, 1208, 1243, 1360, 1364]) {
      expect(screen.queryByText(new RegExp(`PR #${number}`))).toBeNull();
    }
    expect(screen.queryByText("OPEN")).toBeNull();
    expect(screen.queryByText("REVIEW")).toBeNull();
  });

  it("emphasizes associated merged PRs without hiding or reordering content", () => {
    renderSpotlight();
    const linksBefore = screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent);
    fireEvent.click(screen.getByRole("button", { name: /^架构支柱：确定性推理/ }));
    expect(screen.getByRole("button", { name: /^架构支柱：确定性推理/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1096")).toHaveAttribute("data-emphasis", "active");
    expect(screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1081")).toHaveAttribute("data-emphasis", "muted");
    expect(screen.getAllByRole("link", { name: /^PR #/ }).map((link) => link.textContent)).toEqual(linksBefore);
  });

  it("clears selection by second activation or 查看全部", () => {
    renderSpotlight();
    const pillar = screen.getByRole("button", { name: /^架构支柱：确定性推理/ });
    fireEvent.click(pillar);
    fireEvent.click(pillar);
    expect(pillar).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pillar);
    fireEvent.click(screen.getByRole("button", { name: "查看全部贡献" }));
    expect(pillar).toHaveAttribute("aria-pressed", "false");
  });

  it("previews on hover only without a clicked selection", () => {
    renderSpotlight();
    const reasoning = screen.getByRole("button", { name: /^架构支柱：确定性推理/ });
    const traceability = screen.getByRole("button", { name: /^架构支柱：端到端溯源/ });
    const itemOf = (prNumber: string) =>
      screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === prNumber)!;

    fireEvent.mouseEnter(reasoning);
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "active");
    fireEvent.mouseLeave(reasoning);
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "default");

    fireEvent.click(traceability);
    fireEvent.mouseEnter(reasoning);
    expect(itemOf("1226")).toHaveAttribute("data-emphasis", "active");
    expect(itemOf("1096")).toHaveAttribute("data-emphasis", "muted");
  });

  it("keeps kind, scale, and status text in each PR link name", () => {
    renderSpotlight();
    const first = screen.getAllByTestId("merged-contribution").find((item) => item.getAttribute("data-pr-number") === "1096")!;
    expect(
      screen.getByRole("link", { name: /PR #1096.+FEAT · 1141\+\/44-.+MERGED/ }),
    ).toBeVisible();
    expect(first).toBeVisible();
  });
});
```

Run: `pnpm vitest run src/components/home/open-source-spotlight.test.tsx`
Expected: FAIL（props 不匹配 graphNodes/contributionDomains）。

- [ ] **Step 2: 重写 `src/components/home/open-source-spotlight.tsx`（完整替换）**

```tsx
"use client";

import { useState } from "react";

import type {
  ArchitecturePillar,
  OpenSourceContribution,
} from "@/content/schema";

type OpenSourceSpotlightProps = {
  pillars: ArchitecturePillar[];
  contributions: OpenSourceContribution[];
};

type Emphasis = "active" | "muted" | "default";

export function OpenSourceSpotlight({ pillars, contributions }: OpenSourceSpotlightProps) {
  const [activePillarId, setActivePillarId] = useState<string | null>(null);
  const [focusedPillarId, setFocusedPillarId] = useState<string | null>(null);
  const [hoveredPillarId, setHoveredPillarId] = useState<string | null>(null);
  const effectivePillarId = activePillarId ?? focusedPillarId ?? hoveredPillarId;
  const mergedContributions = contributions.filter(({ status }) => status === "merged");
  const pillarById = new Map(pillars.map((pillar) => [pillar.id, pillar]));

  const emphasisFor = (prNumber: number): Emphasis => {
    if (effectivePillarId === null) return "default";
    return pillarById.get(effectivePillarId)?.prNumbers.includes(prNumber) ? "active" : "muted";
  };

  return (
    <section
      className="open-source-spotlight"
      data-selected-pillar={activePillarId ?? "all"}
      data-testid="open-source-spotlight"
      onKeyDown={(event) => {
        if (event.key === "Escape") setActivePillarId(null);
      }}
    >
      <ol aria-label="Semantica 架构支柱" className="open-source-spotlight-pillars">
        {pillars.map((pillar) => (
          <li key={pillar.id}>
            <button
              type="button"
              className="open-source-architecture-pillar"
              aria-pressed={activePillarId === pillar.id}
              onClick={() => setActivePillarId(activePillarId === pillar.id ? null : pillar.id)}
              onMouseEnter={() => setHoveredPillarId(pillar.id)}
              onMouseLeave={() => setHoveredPillarId(null)}
              onFocus={() => setFocusedPillarId(pillar.id)}
              onBlur={() => setFocusedPillarId(null)}
            >
              <span className="open-source-architecture-pillar-title">{`架构支柱：${pillar.title}`}</span>
              <span className="open-source-architecture-pillar-summary">{pillar.summary}</span>
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="open-source-spotlight-reset"
        aria-disabled={activePillarId === null}
        onClick={() => setActivePillarId(null)}
      >
        查看全部贡献
      </button>

      <ol aria-label="Semantica 已合并贡献" className="open-source-spotlight-contributions">
        {mergedContributions.map((contribution) => (
          <li
            key={contribution.number}
            className="open-source-merged-contribution"
            data-emphasis={emphasisFor(contribution.number)}
            data-pr-number={contribution.number}
            data-testid="merged-contribution"
          >
            <a className="open-source-pr-link" href={contribution.url} rel="noreferrer" target="_blank">
              {`PR #${contribution.number}：${contribution.summary}（${contribution.kind.toUpperCase()} · ${contribution.scale}）`}
              <span className={`open-source-spotlight-status contribution-${contribution.status}`}>
                {contribution.status.toUpperCase()}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

注意：按钮内两个 `span` 使可访问名包含摘要，因此所有按名查找必须用前缀正则（如 `/^架构支柱：确定性推理/`）而非 exact。

- [ ] **Step 3: 跑测试确认通过**

Run: `pnpm vitest run src/components/home/open-source-spotlight.test.tsx`
Expected: PASS（7 个用例全绿；showcase 测试仍 FAIL 属预期，Task 4 处理）。

- [ ] **Step 4: 提交**

```bash
git add src/components/home/open-source-spotlight.tsx src/components/home/open-source-spotlight.test.tsx
git commit -m "feat: rebuild spotlight around architecture pillars with merged-only contributions"
```

---

### Task 4: 服务端组件与 CSS 语义更名

**Files:**
- Modify: `src/components/home/open-source-showcase.tsx`
- Modify: `src/components/home/open-source-showcase.test.tsx`
- Modify: `src/app/profile.css`

**Interfaces:**
- Consumes: Task 3 的 spotlight props（`pillars`、`contributions`）。
- Produces（Task 5 E2E 依赖）:
  - 地图 region：`aria-label="Semantica 架构与合并贡献"`，`className="open-source-architecture-map"`，标题 `核心架构与合并贡献`
  - 亮点列表：`ul[aria-label="Semantica 项目亮点"]`，`className="open-source-highlights"`
  - 边界行文案：`截至 2026-09-04：10 个贡献已合并。`（由 merged.length 计算，不再提及 open）

- [ ] **Step 1: 重写失败测试 `src/components/home/open-source-showcase.test.tsx`**

保留前两个用例（logo/identity、honor badges）与最后两个用例（外链）不变，改动以下用例：

```tsx
  it("renders ten merged PR links with exact hrefs and visible status text", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    const map = screen.getByRole("region", { name: "Semantica 架构与合并贡献" });
    const links = within(map).getAllByRole("link", { name: /^PR #/ });
    expect(links).toHaveLength(10);
    const merged = openSource.contributions.filter(({ status }) => status === "merged");
    merged.forEach((contribution) => {
      expect(
        within(map).getByRole("link", {
          name: `PR #${contribution.number}：${contribution.summary}（${contribution.kind.toUpperCase()} · ${contribution.scale}）MERGED`,
        }),
      ).toHaveAttribute("href", contribution.url);
    });
  });

  it("renders highlights and the pillar map in schema order with merged-only content", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    expect(screen.getByRole("list", { name: "Semantica 项目亮点" })).toBeVisible();
    openSource.highlights.forEach((highlight) => {
      expect(screen.getByText(highlight, { exact: true })).toBeVisible();
    });
    const map = screen.getByRole("region", { name: "Semantica 架构与合并贡献" });
    expect(within(map).getByRole("heading", { name: "核心架构与合并贡献" })).toBeVisible();
    expect(within(map).getAllByRole("button", { name: /^架构支柱/ })).toHaveLength(6);
    expect(
      within(map)
        .getAllByTestId("merged-contribution")
        .map((item) => item.getAttribute("data-pr-number")),
    ).toEqual(["1096", "1081", "1226", "1077", "1113", "1217", "1094", "1153", "1215", "1143"]);
    expect(within(map).getAllByText("MERGED")).toHaveLength(10);
    expect(within(map).queryByText("OPEN")).toBeNull();
  });

  it("exposes stable styling hooks without removing map content", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    expect(screen.getByTestId("open-source-spotlight")).toHaveClass("open-source-spotlight");
    expect(screen.getAllByRole("button", { name: /^架构支柱/ })[0]).toHaveClass("open-source-architecture-pillar");
    expect(screen.getAllByTestId("merged-contribution")[0]).toHaveClass("open-source-merged-contribution");
    expect(screen.getAllByRole("link", { name: /^PR #/ })[0]).toHaveClass("open-source-pr-link");
  });

  it("states the dated snapshot boundary computed from merged contributions", () => {
    render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
    expect(screen.getByText("截至 2026-09-04：10 个贡献已合并。")).toBeVisible();
  });
```

Run: `pnpm vitest run src/components/home/open-source-showcase.test.tsx`
Expected: FAIL（组件仍传旧 props / 旧标题）。

- [ ] **Step 2: 修改 `src/components/home/open-source-showcase.tsx`**

1. 地图 section 整块替换为：

```tsx
      <ul aria-label="Semantica 项目亮点" className="open-source-highlights">
        {project.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <section aria-label="Semantica 架构与合并贡献" className="open-source-architecture-map">
        <h4>核心架构与合并贡献</h4>
        <p>点击架构支柱可高亮相关的已合并 PR；全部内容始终保留。</p>
        <OpenSourceSpotlight
          contributions={project.contributions}
          pillars={project.architecturePillars}
        />
      </section>

      <p className="open-source-showcase-boundary">{`截至 ${project.snapshotDate}：${merged.length} 个贡献已合并。`}</p>
```

2. `merged` 变量保留（`.filter(({ status }) => status === "merged")`），其余部分不动。

- [ ] **Step 3: 更名 `src/app/profile.css`（约 766-950 行区段与两处媒体查询）**

1. `.open-source-capability-map` → `.open-source-architecture-map`（先 `grep -n "open-source-capability-map" -r src/` 确认全部出现点，含 showcase class）。
2. `.open-source-spotlight-chain` → `.open-source-spotlight-pillars`，主网格 `repeat(5, minmax(0, 1fr))` → `repeat(6, minmax(0, 1fr))`；对应 `li::after` 连接线选择器同步更名。
3. `.open-source-capability-node`（含 :hover/:focus-visible/[aria-pressed] 变体）→ `.open-source-architecture-pillar`，并增加：

```css
.open-source-architecture-pillar {
  display: grid;
  gap: 0.35rem;
  /* 保留原有 padding/border/背景等声明 */
}

.open-source-architecture-pillar-summary {
  color: var(--profile-muted);
  font-size: 0.68rem;
  line-height: 1.5;
}
```

4. `.open-source-spotlight-domains` → `.open-source-spotlight-contributions`；其 `li` 的 transition / `[data-emphasis="muted"]` 规则同步更名。
5. `.open-source-spotlight-domain`（含 `li[data-emphasis="active"]` 复合选择器）→ `.open-source-merged-contribution`（padding/border/bg 直接作用于 li；`li[data-emphasis="active"] .open-source-merged-contribution` 简化为 `li[data-emphasis="active"]` 或直接 `[data-emphasis="active"].open-source-merged-contribution`）。
6. 删除 `.open-source-contribution-domain` 相关引用（原为 `.open-source-spotlight-domain` 的第二个 class，现在不存在）。
7. 新增亮点列表样式：

```css
.open-source-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.2rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.open-source-highlights li {
  color: var(--profile-accent);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.open-source-highlights li:not(:last-child)::after {
  content: "·";
  margin-left: 1.2rem;
  color: var(--profile-line);
}
```

8. 媒体查询（约 1109 / 1178 行处）：`.open-source-spotlight-pillars` 在 768px 档 `repeat(3, minmax(0, 1fr))`（6 个支柱 3×2 排布），390px 档单列；原 `.open-source-spotlight-domains`/`.open-source-spotlight-domain`/`.open-source-pr-link` 的移动端覆盖规则更名同步。
9. 保留 `.contribution-merged`/`.contribution-open`（contribution-open 暂无引用，保留不动以避免超范围删除）。

- [ ] **Step 4: 跑组件测试 + 类型检查**

Run: `pnpm vitest run src/components/home/ && pnpm typecheck`
Expected: 组件测试全部 PASS；typecheck PASS（若 spotlight/showcase 以外的文件引用旧类型，在此一并修复）。

- [ ] **Step 5: 提交**

```bash
git add src/components/home/open-source-showcase.tsx src/components/home/open-source-showcase.test.tsx src/app/profile.css
git commit -m "feat: rename capability map to architecture map with highlights row"
```

---

### Task 5: E2E 同步更新

**Files:**
- Modify: `tests/e2e/helpers/semantica-map.ts`
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/capability-map-styles.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/server-rendering.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts`

**Interfaces:**
- Consumes: Task 3/4 的 DOM 契约（支柱按钮名前缀 `架构支柱：`、`merged-contribution` testid、`data-pr-number`、`data-selected-pillar`、region 名 `"Semantica 架构与合并贡献"`、列表 label `"Semantica 架构支柱"`）。

- [ ] **Step 1: 重写 `tests/e2e/helpers/semantica-map.ts`（完整替换）**

```ts
import { expect, type Locator } from "@playwright/test";

export async function expectSemanticaMapComplete(map: Locator): Promise<void> {
  await expect(map.getByRole("button", { name: /^架构支柱/ })).toHaveCount(6);
  await expect(map.getByTestId("merged-contribution")).toHaveCount(10);
  await expect(map.getByRole("link", { name: /^PR #/ })).toHaveCount(10);
  await expect(map.getByRole("link", { name: /PR #1226/ })).toHaveAttribute(
    "href",
    /\/pull\/1226$/,
  );
}
```

- [ ] **Step 2: 更新 `tests/e2e/home.spec.ts`**

1. 行 81：`openSource.getByText(/截至 2026-08-31/)` → `openSource.getByText(/截至 2026-09-04：10 个贡献已合并。/)`。
2. 用例 `open source showcase exposes thirteen PR links and statuses` 改名 `open source showcase exposes ten merged PR links`，body 改为：

```ts
test("open source showcase exposes ten merged PR links", async ({ page }) => {
  await page.goto("/");

  const openSource = page.locator("main > section#open-source");
  await expect(openSource.getByRole("list", { name: "Semantica 项目亮点" })).toBeVisible();
  await expect(openSource.getByRole("link", { name: /^PR #/ })).toHaveCount(10);
  await expect(openSource.getByText("MERGED", { exact: true })).toHaveCount(10);
  await expect(openSource.getByText("OPEN", { exact: true })).toHaveCount(0);
  await expect(openSource.getByLabel("Semantica 架构支柱")).toBeVisible();
  await expect(openSource.getByLabel("Semantica 公开资料")).toBeVisible();
});
```

3. 用例 `Semantica map preserves click priority and DOM order` 改为：

```ts
test("Semantica map preserves click priority and DOM order", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("region", { name: "Semantica 架构与合并贡献" });
  await expectSemanticaMapComplete(map);
  const reasoning = map.getByRole("button", { name: /^架构支柱：确定性推理/ });
  const traceability = map.getByRole("button", { name: /^架构支柱：端到端溯源/ });
  const reasoningItem = map.locator('[data-testid="merged-contribution"][data-pr-number="1096"]');
  const traceabilityItem = map.locator('[data-testid="merged-contribution"][data-pr-number="1226"]');
  const links = map.getByRole("link", { name: /^PR #/ });
  const before = await links.allTextContents();

  await traceability.hover();
  await expect(traceabilityItem).toHaveAttribute("data-emphasis", "active");
  await expect(reasoningItem).toHaveAttribute("data-emphasis", "muted");
  await page.mouse.move(0, 0);
  await expect(traceabilityItem).toHaveAttribute("data-emphasis", "default");

  await reasoning.click();
  await traceability.hover();
  await expect(reasoning).toHaveAttribute("aria-pressed", "true");
  await expect(reasoningItem).toHaveAttribute("data-emphasis", "active");
  await expect(traceabilityItem).toHaveAttribute("data-emphasis", "muted");
  await expect(links).toHaveCount(10);
  expect(await links.allTextContents()).toEqual(before);

  await reasoning.click();
  await expect(reasoning).toHaveAttribute("aria-pressed", "false");
});
```

- [ ] **Step 3: 更新 `tests/e2e/accessibility.spec.ts`**

1. 键盘遍历用例（行 69-81）：五个能力节点名替换为六个支柱名：

```ts
    ...[
      "上下文管理",
      "知识建模",
      "确定性推理",
      "本体治理",
      "决策智能",
      "端到端溯源",
    ].map((name) =>
      openSource.getByRole("button", { name: `架构支柱：${name}`, exact: false }),
    ),
    openSource.getByRole("button", { name: "查看全部贡献", exact: true }),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) =>
      openSource.getByRole("link", { name: /^PR #/ }).nth(index),
    ),
```

（原 `[0..12].map` 的 13 个链接改为 10 个。）

2. 用例 `Semantica capability map supports focus priority, Space, and Escape` 改为：

```ts
test("Semantica architecture map supports focus priority, Space, and Escape", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("region", { name: "Semantica 架构与合并贡献" });
  const reasoning = map.getByRole("button", { name: /^架构支柱：确定性推理/ });
  const context = map.getByRole("button", { name: /^架构支柱：上下文管理/ });
  const reasoningItem = map.locator('[data-testid="merged-contribution"][data-pr-number="1096"]');
  const contextItem = map.locator('[data-testid="merged-contribution"][data-pr-number="1081"]');

  await reasoning.focus();
  await expect(reasoningItem).toHaveAttribute("data-emphasis", "active");
  await context.hover();
  await expect(reasoningItem).toHaveAttribute("data-emphasis", "active");
  await expect(contextItem).toHaveAttribute("data-emphasis", "muted");

  await reasoning.evaluate((element) => (element as HTMLButtonElement).blur());
  await expect(contextItem).toHaveAttribute("data-emphasis", "active");
  await page.mouse.move(0, 0);
  await expect(contextItem).toHaveAttribute("data-emphasis", "default");

  await reasoning.focus();
  await page.keyboard.press("Space");
  await expect(reasoning).toHaveAttribute("aria-pressed", "true");
  await expectVisibleFocus(reasoning);
  await context.focus();
  await expect(reasoningItem).toHaveAttribute("data-emphasis", "active");
  await expect(contextItem).toHaveAttribute("data-emphasis", "muted");

  await page.keyboard.press("Escape");
  await expect(reasoning).toHaveAttribute("aria-pressed", "false");
  await expect(map.getByTestId("open-source-spotlight")).toHaveAttribute("data-selected-pillar", "all");
  await expect(contextItem).toHaveAttribute("data-emphasis", "active");
});
```

- [ ] **Step 4: 更新 `tests/e2e/capability-map-styles.spec.ts`**

1. `columnCount` 的定位：`page.getByLabel("Semantica 架构支柱")`。
2. 列数断言：`[[1280, 6], [768, 3], [390, 1]]`。
3. 静音测试：点击 `架构支柱：确定性推理`；`domainGraph` 改为 `map.locator('[data-testid="merged-contribution"][data-pr-number="1081"]')`，opacity 断言（0.65 ≤ opacity < 1）不变。

- [ ] **Step 5: 更新 `tests/e2e/responsive.spec.ts`（约 134-142 行）**

```ts
    const map = openSource.getByRole("region", { name: "Semantica 架构与合并贡献" });
    const pillars = map.getByRole("button", { name: /^架构支柱/ });
    await expectSemanticaMapComplete(map);
    await expectHorizontallyContained(map);
    await expect(pillars).toHaveCount(6);
    await expect(map.getByTestId("merged-contribution")).toHaveCount(10);
    await expect(map.getByRole("link", { name: /^PR #/ })).toHaveCount(10);
```

（其后 390px 档的 `nodes` 变量改为 `pillars`。）

- [ ] **Step 6: 更新 `tests/e2e/server-rendering.spec.ts`（约 21-26 行）**

region 名改 `"Semantica 架构与合并贡献"`；`按钮 /^能力节点/` 计数 5 → `/^架构支柱/` 计数 6；`getByTestId("contribution-domain")` 计数 6 → `getByTestId("merged-contribution")` 计数 10；链接计数 13 → 10；`PR #1208` 断言改为 `PR #1226`（1208 为 open，不再渲染）。

- [ ] **Step 7: 更新 `tests/e2e/reduced-motion.spec.ts`（行 20-22）**

```ts
  const map = page.getByRole("region", { name: "Semantica 架构与合并贡献" });
  const motionTargets = map.locator(
    ".open-source-architecture-pillar, .open-source-merged-contribution, .open-source-pr-link",
  );
```

- [ ] **Step 8: 运行 E2E（视觉用例除外）**

Run: `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/capability-map-styles.spec.ts tests/e2e/responsive.spec.ts tests/e2e/server-rendering.spec.ts tests/e2e/reduced-motion.spec.ts`
Expected: 全部 PASS（visual.spec.ts 中的地图截图用例会失败，Task 6 处理；本步不含 visual.spec.ts）。

- [ ] **Step 9: 提交**

```bash
git add tests/e2e
git commit -m "test: update e2e suites for architecture pillar map"
```

---

### Task 6: 视觉基线更新与全量验证

**Files:**
- Modify: `tests/e2e/visual.spec.ts`
- Update: `tests/e2e/__screenshots__/`（基线图）

**Interfaces:**
- Consumes: Task 5 完成后的稳定 DOM。

- [ ] **Step 1: 更新 `tests/e2e/visual.spec.ts`（行 130-142 的地图用例）**

```ts
test("Semantica architecture map remains stable", async ({ page }) => {
  await prepareStablePage(page, "/");
  const map = page.getByRole("region", { name: "Semantica 架构与合并贡献" });
  await expect(map).toBeVisible();
  await expect(map).toHaveScreenshot("semantica-architecture-map.png", {
    animations: "disabled",
  });

  await map.getByRole("button", { name: /^架构支柱：确定性推理/ }).click();
  await expect(map).toHaveScreenshot("semantica-deterministic-reasoning.png", {
    animations: "disabled",
  });
});
```

- [ ] **Step 2: 删除旧基线并重新生成**

```bash
rm -f tests/e2e/__screenshots__/**/semantica-capability-map.png tests/e2e/__screenshots__/**/semantica-rule-decision.png
pnpm playwright test tests/e2e/visual.spec.ts --update-snapshots
```

注意：visual.spec.ts 中其他用例（hero、internships、article 等）的基线若因页高变化而失配，也需一并 `--update-snapshots` 重新生成；生成后人工抽查 `semantica-architecture-map.png` 与 `semantica-deterministic-reasoning.png`（6 支柱、亮点行、10 条 merged 列表、确定性推理高亮正确）。

- [ ] **Step 3: 视觉用例验证**

Run: `pnpm playwright test tests/e2e/visual.spec.ts`
Expected: 全部 PASS。

- [ ] **Step 4: 全量门禁**

Run: `pnpm verify`
Expected: lint、typecheck、vitest、build、playwright 全部通过。

- [ ] **Step 5: 提交**

```bash
git add tests/e2e/visual.spec.ts tests/e2e/__screenshots__
git commit -m "test: refresh visual baselines for architecture pillar map"
```

---

## 完成清单（供终审核对）

- [ ] `pnpm verify` 全绿（含 lint / typecheck / vitest / build / playwright）
- [ ] 首页地图：6 张支柱卡片 + 亮点行 + 10 条已合并 PR，open PR 不渲染
- [ ] 排序：#1096 → #1081 → #1226 → #1077 → #1113 → #1217 → #1094 → #1153 → #1215 → #1143
- [ ] 交互：click > focus > hover 三态高亮、Escape 清除、查看全部贡献 reset、DOM 顺序不变
- [ ] schema 校验：15 条 contributions、10 merged、支柱引用/归属/排序全闭环
- [ ] 数据保留：site-content.json 仍含全部 15 条 PR（5 open 不渲染但保留）
- [ ] 快照事实：#1153 已合并、#1360/#1364 新增、snapshotDate 2026-09-04、metrics 15