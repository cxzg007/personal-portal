# 江俊杰 · AI Agent / 后端开发个人门户

面向校招求职展示的个人门户，使用原生 Next.js App Router、TypeScript、MDX 和渐进增强的 Three.js 场景构建。核心身份、教育、实习、系统设计和联系方式由服务端 HTML 提供；3D 只是可完全降级的视觉增强层。

内容由 JSON、MDX 与 Git 管理。当前没有 CMS、管理后台、账号、评论或数据库；每次内容修改都通过代码审查、自动校验和重新部署发布。

## 环境合同

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`。这是当前锁文件中最严格的运行时交集：`jsdom@30.0.1` 要求 Node 22.22.2+、24.15.0+ 或 26+；Vite 等工具的 22.12/22.13 要求已被它覆盖。Vercel 当前推荐选择 24.x，并在构建日志确认实际版本至少为 24.15.0。
- pnpm `10.34.5`，由 `package.json#packageManager` 固定。`pnpm-lock.yaml` 必须随依赖变化一起提交。
- 应用唯一必需的公开生产变量是 `NEXT_PUBLIC_SITE_URL`。Vercel 构建还必须在 Preview 和 Production 中设置 `ENABLE_EXPERIMENTAL_COREPACK=1`，让平台按 `packageManager` 使用精确的 pnpm 10.34.5。

`.env.example` 中的 `https://portfolio.example.com` **仅是非生产格式示例**，不是站点默认值，也不能直接用于真实部署。生产值必须是最终公开站点的 HTTPS Origin：只包含协议、域名和可选端口，不包含路径、查询参数或片段，例如 `https://name.example.com`。

`NEXT_PUBLIC_*` 会在 `next build` 时写入客户端产物；修改变量后必须重新构建/部署。开发环境可不设置该变量，此时站点仅在非生产模式回退到 `http://localhost:3000`。如需本地检查生产 metadata，可创建不会提交的 `.env.local`：

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-preview-origin.example
```

## 本地运行

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
```

访问 `http://localhost:3000`。完整质量门禁使用一个明确的临时 HTTPS Origin，避免把示例值误认为生产配置：

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify
```

生产构建和本地生产服务器：

```bash
NEXT_PUBLIC_SITE_URL=https://your-real-origin.example pnpm build
pnpm start
```

构建命令会先校验结构化内容、博客和简历资产，再运行标准 `next build`。不要添加 vinext、Cloudflare Workers 适配层或 `.openai/hosting.json`。

## 更新个人内容

编辑 `content/site-content.json`，保持现有结构和字段类型。内容校验会拒绝空实习、无效 HTTPS 外链、内部地址、私钥和常见令牌样式文本。

```bash
pnpm exec tsx scripts/validate-content.ts
pnpm test -- src/content/schema.test.ts
```

公开页面的隐私基线是不展示手机号、政治面貌和籍贯，也不写入内部地址、密钥、客户信息、未公开数据或受保密协议约束的实现细节。更新简历或经历时，应重新从源文件提取文本，逐项核对姓名、教育、时间、成果数字和公开链接，再运行内容校验与完整门禁；自动扫描不能替代人工脱敏检查。

## 替换 PDF 简历

公开路径固定为 `public/resume.pdf`。先在仓库外生成脱敏 PDF，人工检查每一页及文本提取结果，确认不含上述隐私字段和隐藏元数据，再替换文件。不要直接覆盖唯一的源简历；保留可恢复的源文件副本。

替换后执行：

```bash
pnpm test -- src/lib/resume-asset.test.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build
```

最后在浏览器访问 `/resume.pdf`，确认响应为 PDF、页面完整且下载链接可用。当前构建校验能确认文件存在、非空且有 PDF 签名，但不能判断版式、事实准确性或隐私安全，因此每次更新都必须重新提取和人工审阅。

## 发布 MDX 文章

在 `content/posts/` 新建小写英文、数字和连字符组成的文件名，例如 `agent-memory-design.mdx`。Frontmatter 中以下字段是必需的：

```yaml
---
title: 文章标题
description: 列表摘要
publishedAt: 2026-08-21
updatedAt: 2026-08-21
tags:
  - Agent 工程
featured: false
seoDescription: 用于搜索与分享的独立描述
draft: false
---
```

`title`、`description`、`publishedAt`、`updatedAt`、`tags`、`featured` 和 `seoDescription` 由加载器强制校验；`draft` 可省略并默认 `false`。日期必须是存在的 `YYYY-MM-DD`，`updatedAt` 不得早于 `publishedAt`，标签至少一个。生产构建会排除 `draft: true` 的文章。

新增文件后还必须在 `src/content/posts.ts` 中同步登记两处显式映射：

1. 在 `postLoaders` 中添加 slug 到动态 `import()` 的映射；
2. 在 `postFiles` 中添加同一 slug 到 MDX 文件名的映射。

这是有意采用的显式发布清单：仅创建 MDX 文件不会让文章进入列表或详情路由。完成后运行：

```bash
pnpm test -- src/content/posts.test.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build
pnpm test:e2e -- tests/e2e/blog.spec.ts tests/e2e/metadata.spec.ts
```

## 3D 性能与降级

场景根据能力选择三种模式：

- `full`：WebGL 可用、未启用减少动态效果且设备算力充足；显示完整轻量网络。
- `lite`：WebGL 可用但设备核心数较低或移动视口；降低场景复杂度和渲染成本。
- `static`：系统启用减少动态效果、WebGL 不可用、初始化报错或场景在 4 秒内未就绪；显示静态 SVG。

首屏文字和按钮始终独立于 Canvas。排查空白或卡顿时，先检查浏览器控制台中的 `[agent-network] fallback` 警告和元素上的 `data-scene-mode`，再检查 WebGL、系统减少动态效果设置及硬件并发数。不要为了强制显示 3D 而移除静态降级或降低正文可读性。

相关验证：

```bash
pnpm test -- src/lib/webgl.test.ts src/lib/scene-performance.test.ts src/components/scene/scene-loader.test.tsx
pnpm test:e2e -- tests/e2e/reduced-motion.spec.ts
```

## 测试与视觉基线

常用命令：

```bash
pnpm lint
pnpm typecheck
pnpm test
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm test:e2e
```

响应式与可访问性验收：

```bash
pnpm test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts
```

视觉测试覆盖桌面、平板和移动端。仅在确认设计有意变化后更新基线，并人工检查新截图与 Playwright 差异图：

```bash
pnpm test:e2e -- tests/e2e/visual.spec.ts
pnpm test:e2e -- tests/e2e/visual.spec.ts --update-snapshots
```

`playwright-report/`、`test-results/`、临时截图和 PDF 渲染图是本地证据，不得提交。

## Vercel Git 部署

本仓库保持原生 Next.js 结构，推荐使用 Vercel 的 Git 集成：

1. 把功能分支合并到准备作为 Production Branch 的 Git 分支，并推送远端。
2. 在 Vercel Dashboard 选择 **Add New → Project**，授权 Git 提供商并导入该仓库。
3. 确认 Framework Preset 为 **Next.js**、Root Directory 为仓库根目录。Install Command 和 Build Command 都保留自动检测，不填写手工 Install Command；Vercel 应从 `pnpm-lock.yaml` 和 `packageManager` 识别 pnpm，项目构建脚本为 `pnpm build`。
4. 在 **Settings → Build and Deployment** 选择 Node.js 24.x。当前锁定依赖要求 24.15.0+（或 22.22.2+、26+），因此部署日志必须显示满足 `^22.22.2 || ^24.15.0 || >=26.0.0` 的实际 Node 版本。
5. 在 **Settings → Environment Variables** 为 Preview 和 Production 都配置 `ENABLE_EXPERIMENTAL_COREPACK=1`；否则 `packageManager` 字段本身不保证 Vercel 使用精确 pnpm 版本。构建日志必须显示 `pnpm 10.34.5`，不一致时停止发布并检查 Corepack 变量和自动安装设置。
6. 同样为 Preview 和 Production 配置 `NEXT_PUBLIC_SITE_URL`。它是 canonical Origin，两个环境应先使用项目稳定的生产 Origin（如 Vercel 分配的 `https://project.vercel.app`），不要使用 `.env.example` 的占位域名，也不要使用带路径的 URL。
7. 推送非生产分支创建 Preview Deployment。检查构建日志，并在 Preview URL 完成下方验收；Preview URL 用于访问测试，页面 canonical 仍指向配置的稳定 Origin。
8. Preview 通过后合并到 Production Branch 触发 Production Deployment。发布前再次确认 Production 环境变量，并检查生产构建日志与公开 URL。

首次导入前应先在本地运行完整门禁。Vercel 环境变量的修改只影响后续部署，修改后要 Redeploy；不要把 `.env.local`、Vercel token 或 `.vercel/` 项目标识提交到仓库。

### Preview / Production 验收

在 1440×900 和 390×844 两个视口至少检查：

- 首页姓名、岗位、两行教育、邮箱/GitHub、实习 CTA 与简历入口；
- 展开每段实习，检查行动、结果、个人边界和外链；
- 系统设计案例、架构说明与 Semantica 公开 PR 链接；
- `/blog` 的筛选与搜索、文章详情、目录、代码块和上一篇/下一篇；
- 系统减少动态效果时为 `static`，移动/低性能设备能使用 `lite` 或静态回退；
- `/resume.pdf` 返回成功且内容正确；站内链接、邮箱、GitHub 和所有 `target="_blank"` 外链目标正确；
- 浏览器 Console 与 Network 中没有未解释的页面错误。

还要访问 `/robots.txt`、`/sitemap.xml` 和 `/rss.xml`，确认其中的 Origin 与 `NEXT_PUBLIC_SITE_URL` 一致。

### 绑定自定义域名

在 **Project → Settings → Domains** 添加域名，按 Vercel 提示完成 DNS 验证。域名可访问后：

1. 把 Preview 与 Production 的 `NEXT_PUBLIC_SITE_URL` 都更新为最终 HTTPS Origin；
2. 重新部署两个环境，因为公开变量在构建时固化；
3. 复查 canonical、Open Graph、robots、sitemap、RSS 和所有绝对链接；
4. 确认旧的 Vercel 域名跳转或 canonical 策略符合预期。

Vercel 操作参考：[Next.js 部署](https://vercel.com/docs/frameworks/nextjs)、[环境变量](https://vercel.com/docs/environment-variables)、[项目设置](https://vercel.com/docs/project-configuration/project-settings)、[自定义域名](https://vercel.com/docs/domains/working-with-domains/add-a-domain)。

## 发布状态

仓库只提供部署就绪配置与可复现步骤；在取得 Vercel 项目授权并获得成功的 Preview/Production 部署证据前，不应声称网站已经上线。
