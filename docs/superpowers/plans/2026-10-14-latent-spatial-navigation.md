# 潜空间内容层导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将五层结构变成可读、可点的个人内容导航。

**Architecture:** 复用 `DOMAIN_LAYER`/`DOMAIN_LABEL` 为标签和内容分类的唯一映射；在场景 RAF 中将层锚点投影到 HTML 覆盖层，悬停强调该层；经已存在的桥消息让 iframe 打开对应内容域。

**Tech Stack:** Next.js App Router 16、React 19、Three.js、CSS Modules、Vitest、Playwright。

## Global Constraints

- 主目录 main 有用户未提交后端修改，只在 `.worktrees/ui-ux-homepage` 工作。
- 遵守 `node_modules/next/dist/docs/` 中客户端组件指南；首页不能导入 `three` 或 lab 模块。
- 不引入新依赖；静帧降级、减少动画偏好、键盘访问保持有效。

---

### Task 1: 域名消息与内容页

**Files:** `src/components/lab/terminal-bridge.ts`, `src/components/lab/terminal-bridge.test.ts`, `src/components/lab/terminal-ui.tsx`, `src/components/lab/terminal-ui.module.css`

**Interfaces:** `BridgeMessage` 新增 `{ type: "open-domain"; domain: LatentDomain }`；内层将收到的 domain 设置为对应 TabKey。

- [x] **Step 1: 写桥消息失败测试**：`parseBridgeMessage(encodeBridgeMessage({type:"open-domain",domain:"internship"}))` 返回同一语义；`domain:"invalid"` 返回 null；切换消息不改变机位。
- [x] **Step 2: 运行 `pnpm vitest run src/components/lab/terminal-bridge.test.ts`，确认上述失败。**
- [x] **Step 3: 实现 `open-domain` 分支，只接受 `LATENT_DOMAINS` 中的值。**
- [x] **Step 4: 将终端视图拆成五个域页签，选择消息到达时 `setTab(message.domain)` 并重置 main 滚动。**
- [x] **Step 5: 运行桥消息测试、lint、typecheck。**

### Task 2: 空间标签和层反馈

**Files:** `src/components/lab/latent-scene.tsx`, `src/components/lab/latent-scene.module.css`

**Interfaces:** `requestStage("terminal")` 后向屏幕 `postToScreen({type:"open-domain",domain})`；`createLayerBuilder.fade(delta,dim,lit,hoveredLayer)` 保留飞行层优先级。

- [x] **Step 1: 在 HUD 添加五个真实按钮，用 DOMAIN_LAYER 显示层号，按鼠标悬停/键盘焦点更新 hovered domain。**
- [x] **Step 2: RAF 将每层锚点投影为按钮 transform 位置；终端、载入、飞行阶段按钮不可见不可聚焦。**
- [x] **Step 3: fade 在非飞行时压暗未悬停层，突出选中层；退出恢复，减少动态效果时立即呈现。**
- [x] **Step 4: 点击请求镜头并通过桥消息切页，iframe 未 ready 时缓存域并在 ready 后发送。**
- [x] **Step 5: 运行 typecheck、lint、生产 build 并检查场景截图。**

### Task 3: 浏览器回归与交付

**Files:** `src/components/lab/latent-scene.tsx`, `src/components/lab/latent-scene.module.css`（如截图暴露错位）

- [x] **Step 1: Playwright 验证 L3–L7 可见、焦点/点击可用、标签准确打开身份和开源页。**
- [x] **Step 2: 检查提问穿层、读全文跳转、静帧降级、控制台错误。**
- [x] **Step 3: 运行 `pnpm test`, `pnpm lint`, `pnpm typecheck`, `NEXT_PUBLIC_SITE_URL=https://jiangjunjie-personal-portal.vercel.app pnpm build`。**
- [x] **Step 4: 提交工作树，推送并同步 main，按项目既有流程部署生产并验收。**
