# 贡献落点图交付记录

在 `design/internship-motion@13c15ea` 浅色线上版本上，通过隔离分支 `design/contribution-map` 添加六个代表性贡献落点。保留 Semantica 官方图标、四个贡献主题、其他 PR 折叠明细和正在推进区域。

三个方向为执行与查询、规则与证据、Agent 上下文。每个节点显示说明、快照状态、固定提交的源码入口及 PR 入口。连线表示贡献归类，页脚说明边界并链接 GitDiagram 架构参考。无新增依赖和客户端脚本。

证据：使用 GitHub author/files/mergeCommit/headRefOid 核对 #1226、#1243、#1077、#1675、#1556、#1731，六个源码 raw URL 均返回 HTTP 200。页面保留 2026-09-28 内容快照状态。

验证结果：

- Vitest：23 个文件、213 项通过。
- ESLint、TypeScript、内容校验通过；Next.js 生产构建成功。
- 相关 Playwright：68 项通过、4 项按设备条件跳过，含无 JS、键盘顺序、链接、44px 目标、溢出和 WCAG 2.1 A/AA axe 检查。
- 视觉检查：15 项通过、15 项按设备条件跳过。更新五张受影响的主页/开源区截图；博客、实习、系统案例、首屏等基线保持。
- 检查 1440/768/390 宽度；桌面截图保存在 `assets/2026-09-29-contribution-map/contribution-map-1440.png`。
- 独立只读复核无阻塞问题。按建议让列数跟随实际方向数，浏览器模拟仅剩一个方向时，根节点和分组的中心均为 x=720。

部署完成（2026-09-29）：

- 代码提交：`55fd4a7`，已推送 `origin/design/contribution-map`。
- Vercel Production：`dpl_32Uux2z1fhcgpVVg2QAmdh9FAL3K`，状态 READY。
- 正式站：https://jiangjunjie-personal-portal.vercel.app/
- 部署地址：https://jiangjunjie-personal-portal-degimu6v3-junjie1467-6343s-projects.vercel.app
- 正式域名真实浏览器核验：HTTP 200、6 节点、5 已合并 / 1 进行中、13 链接、官方 logo 可见、无 pageerror。
- canonical 指向正式域名。第一次检查因严格要求末尾 `/` 而误报，使用 URL 规范化比较后通过；无需修改页面。
- 主 checkout 原有 diff SHA256 保持 `afd747c811249dc85d7bd15a19b0f092f4b404a26a0da7b96f28f0a22b5317a7`。

本次记录补充提交只更新文档，不改变已部署的页面代码。
