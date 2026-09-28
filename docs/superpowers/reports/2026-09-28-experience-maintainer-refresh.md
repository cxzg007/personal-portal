# 实习扩充与 Semantica 维护者展示

本轮扩充三段实习的可见内容，并按 2026-09-28 的 GitHub 核验结果更新开源身份和贡献。保留现有静态首页、暖色视觉与两篇博客。

## 工作位置

- 分支：`content/experience-maintainer-refresh`
- 基线：`f122050`（2026-09-23 已发布的前端提交）
- 工作树：`/Users/jiangjunjie.37/personal portal/.worktrees/experience-maintainer-refresh`
- 本报告记录实施与验证结果；用户随后于 2026-09-28 授权提交、推送并部署到现有 Vercel 生产项目。原工作区的联系后端、数据库与邮件相关改动仍保持原状。

## 最终行为

- 每段实习默认展示项目背景、扩写职责、三条主要工作、量化成果和技术栈。原生详情分别容纳京东 7 条、智元 6 条、722 所 5 条完整工程记录。
- 保留真实指标及条件：13 个比较算子 / 11 个聚合算子；50 并发下已接纳请求 P99 810ms → 375ms；默认评测集 Recall@5 91.67%、MRR@10 75.69%、任务规划完整率 95.83%。扩写仅使用原有履历。
- 身份更新为“项目维护者 · Maintainer / Collaborator · cxzg007”，补充推理、真值维护和 RAG 可靠性方面的实际维护工作。
- 18 个已合并 PR 分入贡献主题，#1731 单列“正在推进”，不计入合并数。新增 #1675，并同步系统案例中的“推理与真值维护”节点。
- 正文 16px，相关辅助文字 13px；成果采用淡色底与左侧强调线。桌面四张贡献卡等高，手机按内容自然排列。
- 校验器按贡献状态核对首页合并数，取消固定 17 的限制；仍要求主题恰好覆盖全部 merged PR。新增 `roleSummary` 和独立的 `recognition.honorsCheckedAt`。

## GitHub 核验

核验账号为 `cxzg007`，仓库为 [semantica-agi/semantica](https://github.com/semantica-agi/semantica)。GitHub API `repos/semantica-agi/semantica/collaborators/cxzg007/permission` 返回 `role_name: maintain`、`permission: write`，PR 作者关联为 `COLLABORATOR`。

作者 PR 搜索返回 `total_count: 19`、`incomplete_results: false`，逐项核对后为 18 merged / 1 open。原始公开搜索结果保存在主工作区 `.joycode/tmp/semantica-prs-2026-09-28.json`。

| 来源 | 核验结果与展示边界 |
| --- | --- |
| [PR #1675](https://github.com/semantica-agi/semantica/pull/1675) | 2026-09-23 合并。可选双时态适配层将图证据投影到真值维护会话；独立处理 `valid_at` / `known_at`，历史查询使用独立会话及冻结快照，不修改实时状态。 |
| [PR #1731](https://github.com/semantica-agi/semantica/pull/1731) | 2026-09-28 仍 open、非草稿。本地 RAG 快照一致组装，显式管理摘要与引用依赖，并统一过滤、预算和最终引用输出。尚未合并。 |
| 仓库 Stars | 13,513，核验于 2026-09-28。静态快照，不是实时计数。 |
| 项目榜单徽章 | 保留原先核验于 2026-09-20 的历史记录，独立标注日期；未将历史排名描述为本轮实时排名。 |

未添加未经核验的发布管理、他人 PR 合并或代码审查职责。

## 验证

- 基线：23 个测试文件、223 项单元测试通过；新行为测试先出现预期失败。
- 完成修改后：23 个测试文件、233 项单元测试通过。
- 内容校验、TypeScript、ESLint、生产构建通过。
- 最终完整浏览器回归：222 项通过，27 项按视口适用范围跳过，0 失败；包含视觉基线、无障碍、键盘访问、响应式和无 JavaScript 渲染检查。
- 320 / 390 / 768 / 1440px 均无横向溢出与页面脚本错误，核对了最新系统节点中的 #1675 链接；1440px 四张贡献卡均为 232.75px 高。
- 人工检查实习与开源的桌面、手机截图。仅更新七张受影响的首页基线；系统区截图多出 1px 是前方实习区高度改变后的截图边界取整差异。博客、文章、Hero、写作与联系截图未更新。

本机 pnpm 的版本签名请求在网络受限的沙箱内失败，因此使用锁文件已安装的 Node CLI 执行等价命令，未修改锁文件或跳过签名校验。Turbopack 沙箱内停滞、Chromium 和本地端口被沙箱拒绝后，经工具授权在沙箱外完成构建与浏览器验证。

```sh
node node_modules/vitest/vitest.mjs run
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node --import tsx scripts/validate-content.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test node node_modules/next/dist/bin/next build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3101
node node_modules/@playwright/test/cli.js test --config .superpowers/preview.config.ts --workers 3 --reporter dot
```

`.superpowers/preview.config.ts` 为忽略入库的本地配置，仅将测试目标指向 3101，复用原测试目录、项目与截图路径。仓库的正式 Playwright 配置保持不变。

## 页面截图

- [桌面实习条目](assets/2026-09-28-experience-maintainer/internship-1440.png)
- [手机实习条目](assets/2026-09-28-experience-maintainer/internship-390.png)
- [桌面开源贡献](assets/2026-09-28-experience-maintainer/open-source-1440.png)
- [手机开源贡献](assets/2026-09-28-experience-maintainer/open-source-390.png)
- [四种宽度的实际布局检查](assets/2026-09-28-experience-maintainer/checks.json)
