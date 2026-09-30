# 首屏入场动画 Implementation Plan

用户已选择推荐的约一秒编排，并授权安装 `emilkowalski/skills`，应用动画后提交部署。基线 `07499a4`，隔离分支 `design/hero-entrance`。

**Goal:** 首次桌面访问时，用个人标识揭幕与经历错峰引导阅读，约 960ms 内恢复完整静态主页。

**Architecture:** 静态服务端内容默认可见；仅在 HTML 解析时运行一小段本地内联脚本，依据 sessionStorage、动态效果偏好、视口与导航来源开启 CSS 动画，避免 hydration 后才隐藏造成闪烁。脚本限定首屏元素，完成或用户输入后清理监听；浏览器不执行脚本或存储不可用时静态显示。

**Tech Stack:** Next.js 16.3.1 Server Components、CSS keyframes、原生浏览器事件；不新增动画库。

## Global Constraints

- 保持浅蓝白色、版式、事实内容和最终静态几何。
- 首屏只在同一标签页会话首次桌面访问播放；博客返回、历史返回、锚点定位不播放。
- 760px 以下、减少动态效果、隐藏标签页、存储受限时直接显示。
- 按键、聚焦、指针按下、滚轮、滚动、hash 变化、页面离开、视口/偏好切换会结束动画，不能阻止操作。
- 标识采用遮罩内 translateY；文字和经历采用 opacity/translateY；蓝线使用横向揭幕。曲线复用/新增 `cubic-bezier(0.23,1,0.32,1)`，各行错峰80ms。
- 所有内容默认可见，无永久 opacity:0；CSS 完成后回到静态样式，即使后续客户端代码失败也可阅读。

## Tasks

- [x] 核验并通过 skill-installer 安装 `animate`、`review-animations`，固定来源 `d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128`；阅读 RECIPES.md、STANDARDS.md 和已安装 Next 文档。
- [x] 创建 `src/components/home/hero-entrance-script.test.ts`，用实际脚本验证首次/再次访问、存储异常、hash/历史/来源、用户打断和监听清理，先运行确认失败。
- [x] 创建 `hero-entrance-script.ts`，以静态脚本文本输出浏览器门控与有限生命周期；`profile-hero.tsx` 在内容之前插入脚本，局部 suppressHydrationWarning 仅用于已知的入场状态属性。
- [x] 在 `profile.css` 添加局部动画规则；标题文本包装一个 span，给经历列表稳定错峰索引，末项标记结束；不改内容和链接。
- [x] 新建 `tests/e2e/hero-entrance.spec.ts`，验证真实 CSS 动画的时序、中间帧、结束几何、交互打断、二次访问/博客返回、低动态/窄屏/无 JS 和客户端脚本加载失败。
- [x] 运行单元、lint、typecheck、内容校验与构建；相关浏览器和既有视觉回归，人工查看0/300/600/960ms首屏。
- [x] 使用 review-animations 与独立代码复核，修复实际发现；提交、推送、Vercel 正式部署并检查首次访问。
