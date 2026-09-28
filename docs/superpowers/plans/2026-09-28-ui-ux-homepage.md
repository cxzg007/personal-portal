# UI UX Pro Max 主页改版计划

目标：以已上线的实习与维护者内容为基础，实现清透蓝色主页与可直接定位的真实经历索引。

技术栈：Next.js 16.3.1、React 19、TypeScript、原生CSS、Vitest、Playwright。

依据：`design-system/personal-portal/MASTER.md`。本轮用户已授权安装技能并应用优化，在当前会话按顺序实施。

- [x] 安装并读取技能，执行设计、文字重排、Next.js检索，校准自动建议。
- [x] 从9632184创建 `design/ui-ux-homepage` 工作树，安装锁定依赖，233项基线测试通过。
- [x] 重组 `profile-hero.tsx` 和 `profile-dock.tsx`，增加复用实习数据的经历索引与文章锚点；同步组件与键盘顺序测试。
- [x] 在 `profile.css` 直接更新语义颜色、首屏布局、各区域表面、文字与响应式规则，避免另加整套覆盖样式。
- [x] 清理首屏网络动效消费，保留导航控制及现有案例交互；浏览器测试改为验证实际新行为。
- [x] 运行lint、typecheck、test、内容校验和build，启动独立预览。
- [x] 检查主要视口、无障碍、文字放大、无JS、低动效，人工审阅截图并更新主页基线。
- [x] 记录结果、预览地址、技能安装信息及项目记忆。
