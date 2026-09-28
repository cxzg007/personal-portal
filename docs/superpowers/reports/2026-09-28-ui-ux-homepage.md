# UI UX Pro Max 个人主页设计交付

日期：2026-09-28。用户要求安装 `nextlevelbuilder/ui-ux-pro-max-skill` 并用于主页优化。

## 交付位置

- 工作树：`.worktrees/ui-ux-homepage`，分支 `design/ui-ux-homepage`。
- 基线：已发布的 `9632184b654591cdbf96992570c6259f54504fe9`。
- 本地生产预览：`http://localhost:3102`。本轮未推送、未部署生产。
- 主目录 `main@1ea823e` 的联系后端开发保持原状。

## Skill 安装与应用

通过 `skill-installer` 从仓库提交 `09170eec67eefd46a7ae85de61b40c194020f997` 安装 `.claude/skills/ui-ux-pro-max`，实际目录为 `/Users/jiangjunjie.37/.joycode/skills/ui-ux-pro-max`。

完整读取技能后执行作品集设计系统、极简样式、文字重排、标题层级及 Next.js 技术栈查询。将 Claude 插件路径示例适配为本机 JoyCode 路径，脚本与数据保持原样，`installation.json` 记录来源和适配。自动建议经人工校准，最终规范见 `design-system/personal-portal/MASTER.md`。

## 页面变化

- 采用「同济蓝 · 清透作品集」：冷白底色、深蓝正文、蓝色主操作、统一分隔线与留白。
- 首屏突出姓名、技术 ID、求职方向和操作入口；三段真实实习构成可直接跳转的经历索引，教育和联系方式置于下方。
- 实习以公司信息与工作内容双栏呈现；系统案例、开源贡献、博客入口与联系区统一排版。保留全部实习扩写、维护者身份、18 merged / 1 open 及指标适用条件。
- 删除首屏语义网络及专用驱动、样式和测试，保留章节导航与系统节点交互。
- 系统说明正文16px、辅助文字至少13px。窄容器和200%字号下节点切换为自然高度列表，保持DOM及键盘顺序；标题、英文词和折叠入口可安全换行。
- 主页样式在 `.profile-shell` 下生效；博客及事实数据没有改动。

## 验证证据

| 检查 | 结果 |
| --- | --- |
| `pnpm lint` | 通过 |
| `pnpm typecheck` | 通过 |
| `pnpm test` | 21文件、203项通过 |
| `NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build` | 内容校验、TypeScript及9个静态页面构建通过 |
| 完整 Playwright（3个项目） | 233通过、22按视口/动效条件跳过、0失败 |
| 200%字号、无JS、品牌加载、手机布局定点复验 | 21通过 |
| 视觉基线 | 更新9张主页截图；6张博客/文章截图未修改且验证通过 |
| `git diff --check` | 通过 |

完整浏览器命令：`pnpm exec playwright test --config=.superpowers/preview.config.ts --workers=4 --reporter=line`。该配置复用3102独立生产预览，日志为 `.superpowers/e2e-final.log`，忽略入库。

320/390/768/1024/1440px实际浏览器检查无文档横向溢出、无页面脚本错误；320/390/768/1440px在200%根字号下核验全部四个系统Tab、节点无重叠、展开详情及页面内容不溢出。无JS原生锚点、Tab焦点和详情展开通过。完整测试还覆盖键盘菜单、低动效、axe、SSR、导航和博客路由。

使用 `requesting-code-review` 独立只读审查；首屏与开源标题的字号放大问题已修复，补充处理320px下数字和英文换行、导航宽度及旋转折叠图标溢出。原有无JS鼠标测试会在锚点平滑滚动期间等待稳定超时，改为验证原生锚点后Tab聚焦summary、Enter展开，同时继承各项目真实视口。

已人工复核桌面及手机首屏、实习、系统、开源、博客入口与联系截图。章节截图从页面顶部使用完整页面裁剪，避免固定导航在截图滚动时遮挡内容。

## 后续使用

从本工作树继续修改。重启预览需先配置站点URL并构建，再运行 `NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm start --port 3102`。测试域名只用于本地构建；部署时采用已有生产环境配置。

桌面首屏：`tests/e2e/visual.spec.ts-snapshots/chromium/profile-hero-1440.png`。手机全页：`tests/e2e/visual.spec.ts-snapshots/mobile/homepage-overflow-regression.png`。
