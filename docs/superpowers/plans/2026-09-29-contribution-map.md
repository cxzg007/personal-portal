# Contribution Map Implementation Plan

**Goal:** 在主页开源区加入六个真实 PR 对应的源码落点。

**Architecture:** `contribution-map.tsx` 读取 `OpenSourceProject` 的 PR 数据并与已核验模块元数据关联；`contribution-map.module.css` 负责三列分组连线与窄屏布局；`open-source-showcase.tsx` 在角色说明后渲染。

**Tech Stack:** Next.js 16.3.1 Server Components、React 19、CSS Modules、Vitest、Playwright。

## Global Constraints

- 保持浅色线上版本、官方 logo、原有主题和 PR 明细。
- 连线表示贡献归类。状态只从已有内容快照读取。源码链接固定提交。
- 不增加运行时图形库、外部 iframe 或实时 GitHub 请求。
- 使用已有隔离 worktree 的 `design/contribution-map` 分支。

## Tasks

- [x] 实现 `contribution-map.tsx` 和 CSS Module，缺失 PR 自动省略；只有 Semantica 仓库匹配时渲染。
- [x] 单元验证六个模块真实 PR/源码映射，开放 PR 不误标为已合并，贡献移除/状态改变时跟随内容。
- [x] 接入 `OpenSourceShowcase`；调整 `accessibility.spec.ts` 中键盘顺序，加入无 JS 与溢出验证。
- [x] 运行 unit、lint、typecheck、content validator 和 production build。
- [x] 在真实浏览器检查 1440、768、390 宽度及 reduced-motion，检查新增截图后更新受影响基线。
- [x] 独立代码复核、提交推送及正式站部署核验完成。部署代码提交为 `55fd4a7`。

Commands: `node node_modules/vitest/vitest.mjs run`、`node node_modules/eslint/bin/eslint.js .`、`node node_modules/typescript/bin/tsc --noEmit`、`node node_modules/tsx/dist/cli.mjs scripts/validate-content.ts`、`NEXT_PUBLIC_SITE_URL=https://portfolio.example.test node node_modules/next/dist/bin/next build`。浏览器测试通过现有 Playwright 配置及本地生产服务执行。
