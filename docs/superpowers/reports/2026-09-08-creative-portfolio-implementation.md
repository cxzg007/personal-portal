# 创意作品集视觉升级交付报告（2026-09-08 计划）

## 1. 基线与提交

- 基线 HEAD：`1264013`（招聘转化精修完成态）
- 分支：`codex/creative-portfolio-refinement`（worktree `.worktrees/creative-portfolio`）
- 任务提交序列（每个 Task 独立提交，便于按功能边界 revert）：

| 任务 | 提交 | 说明 |
|---|---|---|
| Task 1 静态视觉首屏 | `c55bc64` | 视觉层级与 hero 精修 |
| Task 2 首屏语义网络 | `cfcbb40` | 语义网络动效与降级 |
| Task 3 公司品牌工程图 | `53ca9a5` | 品牌化实习工程示意 |
| Task 4 系统图数据 | `39a02c1` | 可验证架构内容建模 |
| Task 5 E2E 招聘路径 | `7a0adbd` | 招聘路径 E2E 覆盖 |
| Task 6 开源与杂志式收口 | `37e9b23` | 精选 PR 卡、杂志列表、mdx 快照说明 |
| Task 7 迁移测试验收交付 | 本提交 | `test: verify creative portfolio experience` |

## 2. 任务对照表

Task 0 基线核验、Task 1–7 全部完成，无范围外功能变更、无 package.json/锁文件改动、未新增运行库（`src/lib/dependency-boundary.test.ts` 持续禁止 WebGL/动画运行库，保持通过）。

Task 7 测试迁移按计划 11.2 表逐文件执行：
- `theme.spec.ts`：首页 scoped token 断言迁移至新暖色 token，博客 root/header 原色断言保留。
- `home.spec.ts`：三 CTA、details、PR 列表行为保留；标题同步；新增首屏几何检测（boundingBox y+h≤720 + elementFromPoint）。
- `accessibility.spec.ts`：新增节点按钮、Tab 顺序、唯一 ID、层级检查。
- `reduced-motion.spec.ts`：保留 390→1024 切换、静态网络与导航高亮检查。
- `helpers/semantica-map.ts`：可访问名称调整同步调用者，未删来源验证。
- `capability-map-styles.spec.ts`：保留卡片不旋转、hover ≤2px；移除不存在的 `profile-info-facts` 选择器。
- `server-rendering.spec.ts`：无 JS 模式保留身份/实习/开源链接、静态网络、默认项目解释（服务端 HTML 直取断言）。
- `responsive.spec.ts`：桌面重点与窄屏回归保持；本轮为 sr-only `aria-live` 播报区增加几何特征豁免（详见第 3 节）。
- `blog.spec.ts`：验证首页新代码不污染博客包、文章阅读检查。
- `src/test/fixtures/site-content.ts`：仅同步实际事实数据变化，架构独立 fixture。
- Task 6 遗留旧断言（`阅读《…》全文`、`/^PR #/`）已按新结构（别名主标题 + "已合并 · PR #n"）迁移。

有证据的范围调整（均为测试适配，不改产品行为）：
- `responsive.spec.ts` 扫描器新增 sr-only `aria-live` 豁免：`interactive-architecture.tsx` 的 `liveStatus` 是有意的 1px 裁剪屏幕阅读器播报区（module.css 标准 sr-only 样式），被溢出扫描器误报为 `hidden/scrolling width 1..147`。豁免条件为 `hasAttribute("aria-live") && rect.width <= 2 && rect.height <= 2`，仅命中真实 1px 裁剪的播报区，可见元素溢出仍会被检出。

## 3. 验证命令与真实结果

最终门禁（计划 11.3）：

```
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify   # exit 0
git diff --check                                                  # exit 0
git status --short                                                # 已核对提交范围
```

verify 各阶段真实数字：
- eslint：通过
- typecheck（tsc --noEmit）：通过
- vitest：24 个文件、205 个测试全部通过
- validate-content（4 个 system architectures）+ next build：通过
- Playwright E2E：231 个测试 → **200 passed / 31 skipped / 0 failed**（33.6s，6 workers；skip 均为 tablet/mobile 项目跳过 chromium-only 项等既有条件跳过）

未通过项记录（不粉饰）：
- 首轮 E2E 迁移中 4 处失败（断言过时/选择器变更），已按新结构修复。
- 第一次全量 verify 失败 20 项，根因三类：① 18 个 responsive 失败为上述 sr-only `aria-live` 误报（修扫描器豁免）；② tablet/mobile 两项目 homepage-overflow-regression.png 高度 7568→8073（首页新分区设计变化）；③ tablet/mobile article-detail.png 高度 3859→3886（与 chromium 同源：上游 mdx 内容新增句 + `--brand-accent` 变量修复）。②③ 为基线未随 chromium 同步更新，按 grep 精准选择性更新。
- 修复后第二次 verify 全绿（上述 200/31/0）。

视觉基线更新清单（共 10 张，每张有理由；未做无条件整目录更新）：

| 基线 | 理由 |
|---|---|
| chromium homepage-hero、homepage-internship、homepage-system-projects、homepage-open-source、homepage-writing、homepage-full | 新分区设计落地后的既有基线同步 |
| tablet/homepage-overflow-regression、mobile/homepage-overflow-regression | 高度 7568→8073，首页新分区（hero/网络/架构）设计变化 |
| tablet/article-detail、mobile/article-detail | 上游 mdx 文章内容新增句 + brand-accent 变量修复，与 chromium 同源 |

## 4. 截图

位于 `docs/superpowers/reports/assets/2026-09-08-creative-portfolio/`：
- 首页三视口：`homepage-1280x720-full.png`、`homepage-1440x900-full.png`、`homepage-1920x1080-full.png`
- 首屏初始：`hero-initial-1440.png`；滚动整理后：`hero-scrolled-1440.png`
- 实习卡展开：`internship-expanded-1440.png`
- 架构节点选中：`architecture-node-selected-1440.png`
- 深色开源区：`open-source-dark-1440.png`

## 5. 普通模式与 reduced-motion 观察

- reduced-motion：`html[data-profile-motion="static"]` 生效、Canvas 移除、全部内容保留（`accessibility.spec.ts:182`、`reduced-motion.spec.ts` 全套）；390px 保持静态、回到 >760px 恢复 enhanced。
- 普通模式：`creative-portfolio.spec.ts:213` 覆盖 live 切换"普通→减少动态→普通"——切到 reduce 时 driver 销毁、网络回到静态收拢几何，恢复 no-preference 后回到 enhanced，无 intro 重播、无信息消失；`reduced-motion.spec.ts:49` 验证 enhanced 模式下滚动各分区时导航唯一高亮。
- 跨页往返：`blog.spec.ts` 验证首页新代码不污染博客包，首页→博客→返回无样式串色与残留 driver。
- 截图均停在明确交互状态（初始/滚动后/展开/选中），未以整页截图自动判定美观。

## 6. 事实来源与 PR 快照处理

- 开源区 PR 数据来自 Semantica 公开仓库快照（`content/site-content.json` 精选条目 + `content/posts/first-agent-system.mdx`，状态截至 2026-08-21），链接指向真实 PR，测试断言与快照一致。
- **未补充任何荣誉/奖项**。依据：计划与 AGENTS 约束"不编造荣誉状态"，仓库内无可核验的荣誉事实来源，故未新增。

## 7. bundle 与布局测量

- 测量方法：临时 worktree（detached HEAD `1264013`）与当前分支分别生产构建，对比 `.next/static/chunks` JS gzip 总量：199,466B → 201,559B，**+2,093B（+1.05%）**。
- 语义网络客户端岛：`01j3oinscgv8b.js`（含 `data-network-node`），gzip 13,329B ≈ **13.0KB ≤ 25KB 目标**；基线构建无此岛。
- 未测项：CLS/LCP 未在本地跑 Lighthouse（标注未测）；手工快速滚动与节点连续切换无肉眼卡顿（未量化）。上述数字不等于真实用户数据。

## 8. 推送与部署状态

- **未推送、未部署，无预览地址**。本文所有截图均为本地生产构建（Playwright build+start）产出，不代表线上已更新。
- 回退方式：按上表功能边界 revert 对应提交，经确认后操作，不 reset 主分支。