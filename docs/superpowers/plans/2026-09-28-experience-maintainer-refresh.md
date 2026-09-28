# 实习内容扩充与 Semantica 维护者展示 Implementation Plan

> 在当前会话顺序执行；用户已明确要求扩充实习内容并按公开项目更新维护者身份。使用 executing-plans 与 test-driven-development，保留当前工作区后端改动。

**Goal:** 在静态实习版式中增加实质内容，准确呈现维护者身份、18 个已合并 PR 与 1 个进行中的 PR。

**Architecture:** 从 f122050 建立 content/experience-maintainer-refresh 工作树，复用 JSON 内容与服务端组件；按贡献状态计算统计，维持主题只覆盖 merged PR 的契约。

**Tech Stack:** Next.js 16.3.1、React、TypeScript、CSS、Vitest、Playwright、pnpm 10.34.5。

## 约束与事实

- API 核验于 2026-09-28：cxzg007 的 role_name=maintain；PR author_association=COLLABORATOR。
- 18 个 merged PR；#1675 于 2026-09-23 合并；#1731 开放、非草稿。Stars 快照 13513。
- #1675 为双时态图证据到真值维护的可选适配，独立 valid_at/known_at，历史查询不修改 live session。
- #1731 是本地 RAG 快照一致组装，支持显式摘要/引用依赖与失效；未合并，不宣称全局检索或跨存储事务。
- 榜单排名保留 2026-09-20 历史核验日期，与本轮 Stars 核验分开。
- 实习仅使用已有履历字段扩写；保留量化指标条件。沿用静态排版、品牌、四个系统案例、两篇博客和 PDF 下线状态。
- 实施阶段不提交、推送或部署；依赖按锁文件安装。用户随后于 2026-09-28 授权发布，继续执行提交、推送与部署。

## Task 1：内容契约与事实同步

**Files:** content/site-content.json、src/content/schema.ts、src/content/schema.test.ts、src/content/site-content.test.ts、src/test/fixtures/site-content.ts、content/system-architectures.json。

**Interfaces:** OpenSourceProject 增加 roleSummary；recognition 增加 honorsCheckedAt。contributions 继续使用 merged/open。主题仍恰好覆盖全部 merged 项。

- [x] 为动态贡献数和独立统计补充回归：向 fixture 添加一个 open PR 后 validateSiteContent 仍通过；把 metric 值增加 1 则拒绝。
- [x] 运行 pnpm test -- src/content/schema.test.ts，确认新行为失败。
- [x] 去除 MERGED_CONTRIBUTION_COUNT=17 的硬编码，校验非空列表、至少一个 merged，以及“已合并 PR”指标等于 merged 数量；保持重复、排序、链接、状态和主题覆盖验证。
- [x] 更新身份、角色说明、日期、星数、新 PR、主题与 Semantica 案例，保留开放 PR 状态并排除出已合并主题。
- [x] 同步 fixture 与相关内容测试，运行内容测试与 typecheck。

## Task 2：实习正文与维护者展示

**Files:** src/components/home/internship-story-card.tsx、open-source-showcase.tsx 及相应 test.tsx；src/app/profile.css。

**Interfaces:** 复用 Internship.context、presentation.contribution/details/outcome、highlights。默认显示背景、贡献、三条工作、成果；原生 details 显示完整 highlights。OpenSourceShowcase 以 status=open 单独显示当前工作，不影响 merged 数量。

- [x] 先修改组件测试，断言背景与三项主要工作可见，完整 highlights 折叠；断言开放 PR 在独立进行中区域而不在已合并主题/统计中。
- [x] 运行组件测试并确认因旧渲染契约失败。
- [x] 增加实习正文与主要工作列表，扩写 contribution 与 outcome；完整记录使用 highlights。保持技术栈与折叠 summary。
- [x] 增加维护者说明与进行中区域；按贡献数组计算开放数量；无开放 PR 时不渲染空区域。
- [x] 局部 CSS 调整正文行距与列表、身份标识、进行中状态，正文 16px、辅助文字至少 13px；验证两端换行。
- [x] 运行组件与内容测试至通过。

## Task 3：验证与交付

**Files:** tests/e2e/home.spec.ts、accessibility.spec.ts、server-rendering.spec.ts、helpers/semantica-map.ts、受影响的视觉截图；README.md；docs/superpowers/reports/2026-09-28-experience-maintainer-refresh.md。

- [x] 同步键盘顺序、新内容计数与 snapshot 日期，确认开放 PR 不算作已合并。
- [x] pnpm lint、pnpm typecheck、pnpm test、NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build。
- [x] 运行非视觉 E2E，检查 320/390/768/1440px、详情展开、导航与减少动态效果。
- [x] 浏览器采集并查看实习、开源桌面和手机截图，再更新受影响首页基线并复跑视觉测试；保持博客基线。
- [x] git diff --check、差异审阅，记录实际测试结果、来源和预览方式。

## 执行结果

2026-09-28 已完成。沙箱内 pnpm 版本签名请求失败，实际使用锁文件已安装的 Node CLI 执行等价校验；构建与浏览器检查经工具授权在沙箱外完成。233 项单元测试、222 项浏览器检查通过（27 项按视口跳过），具体命令、截图与来源见 `../reports/2026-09-28-experience-maintainer-refresh.md`。未提交、推送或部署。
