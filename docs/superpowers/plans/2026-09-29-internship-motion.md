# Internship Motion Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task by task in the existing isolated worktree.

**Goal:** 在正式站浅色版的三段实习中加入可读、可暂停的工程动图。

**Architecture:** 服务端 `InternshipDiagram` 提供 SVG 与文字；客户端 `InternshipMotion` 管理每张图的播放权限。CSS Modules 仅影响图示。

**Tech Stack:** 已安装的 Next.js、React、TypeScript、SVG、CSS Modules、Vitest、Playwright，无新依赖。

## Global Constraints

- 基线 `53cc651`，工作分支 `design/internship-motion`。
- 内容来自现有经历，不制造数据。原版页面结构和其他区块保持不变。
- 无 JS、减少动态效果、离屏及隐藏标签页时静态可读。

## Task 1: 实习示意图及生命周期

Files: `src/components/home/internship-motion.tsx`、`internship-motion.test.tsx`、`internship-diagram.tsx`、`internship-diagram.module.css`、`internship-story-card.tsx`、`internship-story-card.test.tsx`。

- [ ] 先在现有实习卡测试中加入可暂停示意图断言，运行确认新功能缺失。
- [ ] 新建 `InternshipMotion({ id, title, children })`，默认 `data-motion="paused"`，通过 IntersectionObserver、visibilitychange、matchMedia 控制动画，保留用户暂停选择。
- [ ] 实现京东规则执行、智元共享时间轴、722 所混合检索三张 SVG，传入客户端容器的 children。
- [ ] 集成左栏；测试真实暂停、离屏重入、系统偏好改变、隐藏页及清理监听。

## Task 2: 视觉及交付

Files: `tests/e2e/internship-motion.spec.ts`、`tests/e2e/accessibility.spec.ts`、受影响视觉快照。

- [ ] 更新键盘顺序；浏览器验证动画实际推进和暂停，减少动态效果与无 JS 的完整静态图。
- [ ] 检查 1440、1280、1920 桌面布局及现有窄屏溢出检查，确认其他区块与基线一致。
- [ ] 运行 Vitest、ESLint、TypeScript、内容校验、生产构建和相关 Playwright 测试。
- [ ] 按 requesting-code-review 技能进行独立审查，处理重要问题。
- [ ] 提交、推送设计分支并提供可访问的部署预览。
