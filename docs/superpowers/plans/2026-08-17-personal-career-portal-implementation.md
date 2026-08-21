# AI Agent / 后端开发个人求职门户 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向 AI Agent / 后端开发校招的沉浸式个人门户，以实习成果为核心证据，并提供系统设计案例、MDX 技术博客、PDF 简历和完整的性能降级能力。

**Architecture:** 使用 Next.js App Router 和 TypeScript 生成可搜索、可静态渲染的内容页面；个人资料与经历由类型化内容层提供，MDX 文章通过显式注册表进入博客路由。首页 3D 场景是独立延迟加载的客户端增强层，核心文字、导航和简历入口始终由服务端 HTML 提供，并在 WebGL、低性能设备或减少动态效果模式下切换为静态 SVG。

**Tech Stack:** Next.js、React、TypeScript、Tailwind CSS、Motion for React、Three.js、React Three Fiber、MDX、Vitest、Testing Library、Playwright、axe-core、pnpm。

## Global Constraints

- 求职方向固定为 `AI Agent / 后端开发`，主要场景为校招。
- 首页内容优先级固定为：实习经历 > 后端工程与系统设计 > 技术博客。
- 完整教育信息显示在首屏，不创建独立教育板块或教育导航项。
- 主导航固定为：`首页 / 实习 / 系统设计 / 博客 / 关于 / 简历`。
- 首期博客使用 Markdown/MDX + Git，不实现管理后台、评论、点赞、账户或多人审核。
- 核心身份、实习摘要、联系方式和简历入口必须存在于服务端生成的 HTML 中，Canvas 不承载唯一信息。
- 3D 场景延迟加载；WebGL 不可用、减少动态效果、低性能设备或加载失败时使用静态 SVG。
- 博客页面不得加载 Three.js 或 React Three Fiber。
- 不臆造姓名、学校、实习公司、成果数字或内部技术细节；Task 2 开始前需取得用户提供并确认的真实内容包。
- 实习材料必须脱敏，不包含内部地址、密钥、客户信息、未公开数据或违反协议的架构细节。
- 使用 `pnpm` 管理依赖；基于当前锁定依赖收紧后的 Node.js 支持合同为 `^22.22.2 || ^24.15.0 || ^26.0.0`（最低 22.22.2，且不支持奇数主版本），当前环境 Node.js 26.5.0 满足要求。
- 所有任务在提交前必须通过其列出的测试命令；提交保持单一意图。

## File Structure

```text
.
├── content/
│   ├── site-content.json                # 经用户确认的身份、教育、实习、案例和联系信息
│   └── posts/
│       └── first-agent-system.mdx       # 首篇真实或经用户确认的示例技术文章
├── public/
│   ├── resume.pdf                       # 用户提供的脱敏 PDF 简历
│   └── social-card.svg                  # 默认分享图
├── scripts/
│   └── validate-content.ts              # 构建前内容完整性检查
├── src/
│   ├── app/
│   │   ├── blog/[slug]/page.tsx         # 文章详情和静态参数
│   │   ├── blog/page.tsx                # 博客列表与筛选
│   │   ├── rss.xml/route.ts             # RSS 输出
│   │   ├── globals.css                  # 设计令牌、全局样式和降级样式
│   │   ├── layout.tsx                   # 全局 metadata、字体和页面骨架
│   │   ├── not-found.tsx                # 静态 404
│   │   ├── page.tsx                     # 首页服务端组合
│   │   ├── robots.ts                    # robots metadata route
│   │   └── sitemap.ts                   # sitemap metadata route
│   ├── components/
│   │   ├── blog/
│   │   │   ├── blog-card.tsx            # 文章卡片
│   │   │   ├── blog-filter.tsx          # 客户端标签与搜索过滤
│   │   │   ├── mdx-components.tsx       # 文章内容组件映射
│   │   │   └── reading-progress.tsx     # 阅读进度
│   │   ├── home/
│   │   │   ├── case-studies.tsx         # 系统设计案例
│   │   │   ├── contact.tsx              # 关于与联系 CTA
│   │   │   ├── featured-writing.tsx     # 首页精选文章
│   │   │   ├── hero.tsx                 # 首屏静态身份信息
│   │   │   ├── impact-metrics.tsx       # 成果指标
│   │   │   └── internship-timeline.tsx  # 实习时间线与展开详情
│   │   ├── scene/
│   │   │   ├── agent-network-canvas.tsx # Canvas、错误边界和动态质量设置
│   │   │   ├── agent-network-scene.tsx  # 节点、连线和数据流
│   │   │   ├── scene-loader.tsx         # 延迟加载与能力判断
│   │   │   └── static-network.tsx       # SVG 降级背景
│   │   └── shell/
│   │       ├── header.tsx                # 桌面与移动导航
│   │       └── section.tsx               # 页面区块语义容器
│   ├── content/
│   │   ├── load-site-content.ts          # JSON 加载和运行时校验入口
│   │   ├── posts.ts                      # MDX/frontmatter 读取与排序
│   │   └── schema.ts                     # 内容类型、校验结果和校验器
│   ├── lib/
│   │   ├── motion.ts                     # 动效时长和减少动态效果策略
│   │   ├── site-url.ts                   # 规范站点 URL
│   │   ├── site-url.test.ts              # 站点 URL 校验测试
│   │   └── webgl.ts                      # WebGL/设备能力判断
│   └── test/
│       └── fixtures/site-content.ts      # 单元测试内容夹具
├── tests/
│   └── e2e/
│       ├── accessibility.spec.ts         # axe 与键盘可访问性
│       ├── blog.spec.ts                  # 博客路径
│       ├── home.spec.ts                  # 校招关键路径
│       └── reduced-motion.spec.ts        # 动效降级
├── mdx-components.tsx                    # Next.js MDX 全局入口
├── next.config.ts                        # MDX 与 Next.js 配置
├── package.json                          # 脚本和依赖
├── playwright.config.ts                  # E2E 配置
├── tsconfig.json                         # 严格 TypeScript
└── vitest.config.ts                      # 单元测试配置
```

---

### Task 1: 工程基础与测试门禁

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/test/setup.ts`
- Create: `tests/e2e/home.spec.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: 已确认设计文档 `docs/superpowers/specs/2026-08-17-personal-career-portal-design.md`。
- Produces: `pnpm dev`、`pnpm test`、`pnpm test:e2e`、`pnpm lint`、`pnpm typecheck` 和 `pnpm build`；后续任务共享的 App Router、Tailwind 和测试环境。

- [ ] **Step 1: 创建工程清单和基础脚本**

在 `package.json` 中定义以下脚本和依赖边界：

```json
{
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "tsx scripts/validate-content.ts && next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e"
  }
}
```

安装运行依赖 `next react react-dom motion three @react-three/fiber @next/mdx @mdx-js/loader @mdx-js/react gray-matter remark-gfm rehype-slug`，安装开发依赖 `typescript eslint eslint-config-next tailwindcss @tailwindcss/postcss @tailwindcss/typography @types/node @types/react @types/react-dom @types/three @types/mdx tsx vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitejs/plugin-react @playwright/test @axe-core/playwright`。提交安装产生的 `pnpm-lock.yaml`。

- [ ] **Step 2: 写首页基础 E2E 失败测试**

创建 `tests/e2e/home.spec.ts`：

```ts
import { expect, test } from "@playwright/test";

test("homepage exposes the campus recruiting identity and primary actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("AI Agent / 后端开发")).toBeVisible();
  await expect(page.getByRole("link", { name: "查看实习经历" })).toHaveAttribute("href", "#internships");
  await expect(page.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `pnpm exec playwright install chromium && pnpm test:e2e -- tests/e2e/home.spec.ts`

Expected: FAIL，因为首页尚未提供目标岗位和两个主操作。

- [ ] **Step 4: 创建最小 App Router 页面和设计令牌**

`src/app/layout.tsx` 输出 `lang="zh-CN"`、全局字体类和 `{children}`；`src/app/page.tsx` 暂时渲染一个 `h1`、岗位文本和两个链接。`src/app/globals.css` 至少定义以下令牌：

```css
:root {
  --color-bg: #050914;
  --color-panel: rgba(11, 20, 38, 0.72);
  --color-text: #f4f8ff;
  --color-muted: #9aacbf;
  --color-primary: #68d8ff;
  --color-accent: #9c7cff;
  --color-border: rgba(137, 201, 255, 0.18);
  --radius-card: 1.25rem;
  --content-width: 72rem;
}
```

- [ ] **Step 5: 配置严格类型检查、Vitest 和 Playwright**

`vitest.config.ts` 使用 `jsdom` 和 `src/test/setup.ts`；`playwright.config.ts` 使用 `http://127.0.0.1:3000`，在测试前运行 `pnpm dev`，桌面项目使用 Chromium，移动项目使用 `devices["iPhone 13"]`。

- [ ] **Step 6: 运行基础门禁**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e -- tests/e2e/home.spec.ts`

Expected: 全部 PASS。

- [ ] **Step 7: 提交**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs vitest.config.ts playwright.config.ts src/app src/test tests/e2e/home.spec.ts .gitignore
git commit -m "chore: scaffold portfolio application"
```

---

### Task 2: 类型化内容模型与真实内容校验

**Files:**
- Create: `src/content/schema.ts`
- Create: `src/content/load-site-content.ts`
- Create: `src/test/fixtures/site-content.ts`
- Create: `scripts/validate-content.ts`
- Create: `content/site-content.json`
- Create: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: 用户提供并确认的身份、教育、实习、指标、案例、联系信息；不得使用虚构值。
- Produces: `SiteContent`、`validateSiteContent(input: unknown): ValidationResult`、`loadSiteContent(): SiteContent`。

- [ ] **Step 1: 接收并核对真实内容包**

要求内容包包含：姓名或技术 ID、目标岗位、学校、专业、学历、毕业年份、校招状态、邮箱、GitHub、至少一段实习、2–4 个成果指标、至少一个系统案例和一句个人定位。逐项确认可公开范围，并把已确认内容写入 `content/site-content.json`。此步骤不得用示例姓名、示例公司或未经确认的成果数字代替。

- [ ] **Step 2: 写内容校验失败测试**

创建 `src/content/schema.test.ts`，覆盖：完整夹具通过、教育字段缺失失败、没有实习失败、指标不是数字失败、无效外链失败、内部 URL 或密钥样式文本失败。

```ts
import { describe, expect, it } from "vitest";
import { validSiteContent } from "@/test/fixtures/site-content";
import { validateSiteContent } from "./schema";

describe("validateSiteContent", () => {
  it("rejects content without an internship", () => {
    const input = { ...validSiteContent, internships: [] };
    expect(validateSiteContent(input)).toEqual({
      ok: false,
      errors: expect.arrayContaining(["internships must contain at least one entry"]),
    });
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `pnpm test -- src/content/schema.test.ts`

Expected: FAIL，因为 `validateSiteContent` 尚未定义。

- [ ] **Step 4: 实现内容类型和校验器**

在 `src/content/schema.ts` 定义明确类型：

```ts
export type Education = {
  school: string;
  major: string;
  degree: string;
  graduationYear: number;
  highlights: string[];
};

export type Internship = {
  id: string;
  company: string;
  team: string;
  role: string;
  period: string;
  context: string;
  actions: string[];
  results: string[];
  ownership: string;
  stack: string[];
  status: "Shipped" | "Optimized" | "Deployed";
};

export type SiteContent = {
  profile: {
    name: string;
    technicalId?: string;
    targetRole: "AI Agent / 后端开发";
    positioning: string;
    recruitingStatus: string;
    education: Education[];
    email: string;
    github: string;
  };
  metrics: Array<{ label: string; value: number; suffix: string; evidence: string }>;
  internships: Internship[];
  caseStudies: Array<{
    id: string;
    title: string;
    problem: string;
    constraints: string[];
    decisions: string[];
    tradeoffs: string[];
    contribution: string;
    result: string;
    stack: string[];
  }>;
  about: string[];
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };
export function validateSiteContent(input: unknown): ValidationResult;
```

校验器必须拒绝空字符串、空实习数组、不在允许集合内的岗位和状态、非 `https:` GitHub 链接、非正整数毕业年份，以及包含 `localhost`、内网 IPv4、`BEGIN PRIVATE KEY` 或常见令牌前缀的文本。

- [ ] **Step 5: 实现加载器与构建前检查**

`loadSiteContent()` 从 `content/site-content.json` 读取、校验并在失败时抛出包含全部字段错误的异常。`scripts/validate-content.ts` 调用该函数，成功时输出 `Content validation passed`，失败时退出非零状态。

- [ ] **Step 6: 运行测试和内容检查**

Run: `pnpm test -- src/content/schema.test.ts && pnpm exec tsx scripts/validate-content.ts`

Expected: 全部 PASS，终端包含 `Content validation passed`。

- [ ] **Step 7: 提交**

```bash
git add content/site-content.json scripts/validate-content.ts src/content src/test/fixtures/site-content.ts
git commit -m "feat: add validated portfolio content model"
```

---

### Task 3: 页面骨架、导航与首屏身份摘要

**Files:**
- Create: `src/components/shell/header.tsx`
- Create: `src/components/shell/section.tsx`
- Create: `src/components/home/hero.tsx`
- Create: `src/components/home/impact-metrics.tsx`
- Create: `src/components/home/hero.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `SiteContent`, `loadSiteContent()`。
- Produces: `<Header />`、`<Section id title eyebrow>`、`<Hero profile>`、`<ImpactMetrics metrics>`。

- [ ] **Step 1: 写首屏组件失败测试**

测试必须断言姓名、目标岗位、每段教育经历的学校/专业/学历/毕业年份、校招状态、邮箱、GitHub 和两个主操作均存在，并断言首屏没有“教育”导航链接。

```tsx
render(<Hero profile={validSiteContent.profile} />);
expect(screen.getByRole("heading", { level: 1, name: validSiteContent.profile.name })).toBeVisible();
expect(screen.getByText(/AI Agent \/ 后端开发/)).toBeVisible();
expect(screen.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/components/home/hero.test.tsx`

Expected: FAIL，因为 `Hero` 尚未存在。

- [ ] **Step 3: 实现语义化 Header、Section、Hero 和指标卡**

`Header` 导航项固定映射到 `/#top`、`/#internships`、`/#case-studies`、`/blog`、`/#about`、`/resume.pdf`。移动导航使用真实按钮、`aria-expanded` 和可关闭菜单。`Hero` 在服务端渲染文字和链接；教育信息按最多两行输出。`ImpactMetrics` 只渲染通过内容校验的数字和证据标签。

- [ ] **Step 4: 完成视觉骨架**

在 `globals.css` 建立 72rem 内容宽度、响应式排版、半透明面板、可见焦点、跳过导航链接和 `prefers-reduced-motion` 基线。首屏在 390px 宽度下不得横向滚动。

- [ ] **Step 5: 运行单元和 E2E 测试**

Run: `pnpm test -- src/components/home/hero.test.tsx && pnpm test:e2e -- tests/e2e/home.spec.ts`

Expected: 全部 PASS，桌面和 iPhone 13 项目均能看到身份与主操作。

- [ ] **Step 6: 提交**

```bash
git add src/app src/components/shell src/components/home/hero.tsx src/components/home/hero.test.tsx src/components/home/impact-metrics.tsx tests/e2e/home.spec.ts
git commit -m "feat: build recruiting hero and navigation"
```

---

### Task 4: 实习时间线、系统案例与联系闭环

**Files:**
- Create: `src/components/home/internship-timeline.tsx`
- Create: `src/components/home/internship-timeline.test.tsx`
- Create: `src/components/home/case-studies.tsx`
- Create: `src/components/home/case-studies.test.tsx`
- Create: `src/components/home/contact.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `Internship[]`、`SiteContent["caseStudies"]`、`SiteContent["about"]`、profile 联系方式。
- Produces: `<InternshipTimeline internships>`、`<CaseStudies caseStudies>`、`<Contact profile about>`。

- [ ] **Step 1: 写实习与案例失败测试**

测试默认摘要中必须出现公司、岗位、时间、首个结果和技术栈；点击“查看技术细节”后必须出现业务背景、行动、贡献边界和全部结果。案例测试必须断言问题、决策、权衡、贡献和结果都有独立语义标签。

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/components/home/internship-timeline.test.tsx src/components/home/case-studies.test.tsx`

Expected: FAIL，因为两个组件尚未定义。

- [ ] **Step 3: 实现实习渐进披露**

每段实习使用 `<article>`；展开按钮具有 `aria-expanded` 和 `aria-controls`。折叠状态仍显示至少一个量化结果。状态标签只允许 `Shipped`、`Optimized`、`Deployed`，不得替代中文结果说明。

- [ ] **Step 4: 实现系统案例和静态架构链路**

案例采用可读的 HTML/SVG 节点链路，连接线带 `aria-hidden="true"`，架构说明以列表存在。Motion 只增强节点点亮，不改变内容显示条件。

- [ ] **Step 5: 实现关于与联系 CTA**

输出简短自述、校招状态、`mailto:`、GitHub 和稳定的 `/resume.pdf` 下载链接。链接文字应说明目标，不使用“点击这里”。

- [ ] **Step 6: 运行单元、E2E 和键盘测试**

Run: `pnpm test -- src/components/home && pnpm test:e2e -- tests/e2e/home.spec.ts`

Expected: 全部 PASS；Tab 键可到达每个展开按钮和联系链接，展开内容与 `aria-expanded` 同步。

- [ ] **Step 7: 提交**

```bash
git add src/app/page.tsx src/app/globals.css src/components/home tests/e2e/home.spec.ts
git commit -m "feat: add internship and system design narrative"
```

---

### Task 5: 3D Agent 网络与完整降级

**Files:**
- Create: `src/lib/webgl.ts`
- Create: `src/lib/webgl.test.ts`
- Create: `src/lib/motion.ts`
- Create: `src/components/scene/static-network.tsx`
- Create: `src/components/scene/scene-loader.tsx`
- Create: `src/components/scene/agent-network-canvas.tsx`
- Create: `src/components/scene/agent-network-scene.tsx`
- Modify: `src/components/home/hero.tsx`
- Modify: `src/app/globals.css`
- Create: `tests/e2e/reduced-motion.spec.ts`

**Interfaces:**
- Consumes: 浏览器 `matchMedia`、WebGL 上下文和 `navigator.hardwareConcurrency`。
- Produces: `getSceneMode(capabilities): "full" | "lite" | "static"`、`<SceneLoader />`、`<StaticNetwork />`。

- [ ] **Step 1: 写能力判断失败测试**

```ts
expect(getSceneMode({ webgl: false, reducedMotion: false, cores: 8 })).toBe("static");
expect(getSceneMode({ webgl: true, reducedMotion: true, cores: 8 })).toBe("static");
expect(getSceneMode({ webgl: true, reducedMotion: false, cores: 2 })).toBe("lite");
expect(getSceneMode({ webgl: true, reducedMotion: false, cores: 8 })).toBe("full");
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/lib/webgl.test.ts`

Expected: FAIL，因为 `getSceneMode` 尚未定义。

- [ ] **Step 3: 实现纯函数能力策略和 SVG 降级**

`getSceneMode` 不直接读取全局对象，便于测试；`SceneLoader` 负责收集能力并调用。`StaticNetwork` 使用装饰性 SVG，设置 `aria-hidden="true"` 和 `focusable="false"`。

- [ ] **Step 4: 写减少动态效果 E2E 失败测试**

```ts
test.use({ reducedMotion: "reduce" });
test("uses the static scene without hiding content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("static-network")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

- [ ] **Step 5: 运行 E2E 确认失败**

Run: `pnpm test:e2e -- tests/e2e/reduced-motion.spec.ts`

Expected: FAIL，因为静态降级标记尚未存在。

- [ ] **Step 6: 实现延迟加载 Canvas 和场景**

`SceneLoader` 使用 `next/dynamic` 且 `ssr: false` 加载 `AgentNetworkCanvas`。Canvas 使用 React Three Fiber 的 `fallback`、DPR 上限和性能回退；场景仅使用程序生成的节点、线段和小型粒子，不加载外部 3D 模型或纹理。`full` 模式节点上限 48，`lite` 模式节点上限 18；指针只产生轻微视差。

- [ ] **Step 7: 增加运行时错误降级**

Canvas 初始化错误或 4 秒内未报告 ready 时显示 `StaticNetwork`。错误只记录非敏感摘要，首屏文字和链接始终处于 Canvas 之上且可交互。

- [ ] **Step 8: 运行单元、E2E 和生产构建**

Run: `pnpm test -- src/lib/webgl.test.ts && pnpm test:e2e -- tests/e2e/reduced-motion.spec.ts tests/e2e/home.spec.ts && pnpm build`

Expected: 全部 PASS；减少动态效果项目无 Canvas；构建成功。

- [ ] **Step 9: 提交**

```bash
git add src/lib src/components/scene src/components/home/hero.tsx src/app/globals.css tests/e2e/reduced-motion.spec.ts
git commit -m "feat: add adaptive agent network scene"
```

---

### Task 6: MDX 博客、筛选和文章阅读体验

**Files:**
- Create: `content/posts/first-agent-system.mdx`
- Create: `src/content/posts.ts`
- Create: `src/content/posts.test.ts`
- Create: `src/components/blog/mdx-components.tsx`
- Create: `src/components/blog/blog-card.tsx`
- Create: `src/components/blog/blog-filter.tsx`
- Create: `src/components/blog/reading-progress.tsx`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Create: `src/app/blog/loading.tsx`
- Create: `src/app/not-found.tsx`
- Create: `mdx-components.tsx`
- Modify: `next.config.ts`
- Create: `tests/e2e/blog.spec.ts`

**Interfaces:**
- Consumes: `content/posts/*.mdx` frontmatter。
- Produces: `PostMeta`、`Post`、`getAllPosts(): PostMeta[]`、`getPost(slug): Promise<Post | null>`、博客列表和静态文章详情。

- [ ] **Step 1: 写文章索引失败测试**

测试 frontmatter 必须包含 `title`、`description`、`publishedAt`、`updatedAt`、`tags`、`featured` 和 `seoDescription`；文章按发布日期倒序；草稿不进入生产列表；重复 slug 和无效日期必须报错。

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/content/posts.test.ts`

Expected: FAIL，因为文章索引函数尚未定义。

- [ ] **Step 3: 实现 MDX 配置和文章读取**

`next.config.ts` 通过 `@next/mdx` 接受 `.mdx`，并配置 `remark-gfm` 与 `rehype-slug`；根目录 `mdx-components.tsx` 转发到博客组件映射。`posts.ts` 使用 `gray-matter` 从仓库内 `content/posts` 读取 frontmatter，并维护显式静态加载器映射，避免不可分析的任意动态导入：

```ts
const postLoaders = {
  "first-agent-system": () => import("../../content/posts/first-agent-system.mdx"),
} satisfies Record<string, () => Promise<{ default: React.ComponentType }>>;

export type Post = PostMeta & {
  Content: React.ComponentType;
};
```

每新增一篇文章必须同时加入加载器映射；`getPost(slug)` 只调用映射中已知的 loader，不把用户输入拼接为文件路径。

- [ ] **Step 4: 加入首篇经用户确认的文章**

文章内容必须来自用户提供的真实文章或经用户确认的公开技术主题。若用户只提供主题而无正文，先完成文章结构和提纲审阅，再写入正文；不得虚构生产事故、性能数据或公司内部案例。

- [ ] **Step 5: 实现博客列表和客户端筛选**

服务端先输出完整文章卡片；`BlogFilter` 只增强标签与标题/摘要搜索，不依赖后端。无匹配结果时显示明确空状态和“清除筛选”按钮。

- [ ] **Step 6: 实现文章详情**

`generateStaticParams()` 返回全部公开 slug；`generateMetadata()` 输出文章标题、摘要和规范链接；详情页包含目录、代码块、阅读进度、上一篇/下一篇和返回博客链接。不存在的 slug 调用 `notFound()`。

- [ ] **Step 7: 写并运行博客 E2E**

测试从 `/blog` 搜索首篇文章、按标签过滤、进入详情、查看目录和返回列表；同时断言博客页面 `script[src*="three"]` 和 `canvas` 数量为 0。

Run: `pnpm test -- src/content/posts.test.ts && pnpm test:e2e -- tests/e2e/blog.spec.ts`

Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add content/posts src/content/posts.ts src/content/posts.test.ts src/components/blog src/app/blog src/app/not-found.tsx mdx-components.tsx next.config.ts tests/e2e/blog.spec.ts
git commit -m "feat: add mdx technical blog"
```

---

### Task 7: 精选文章、SEO、RSS、站点地图与简历

**Files:**
- Create: `src/components/home/featured-writing.tsx`
- Create: `src/lib/site-url.ts`
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/rss.xml/route.ts`
- Create: `public/social-card.svg`
- Create: `public/resume.pdf`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `scripts/validate-content.ts`
- Create: `tests/e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: `getAllPosts()`、`SiteContent`、环境变量 `NEXT_PUBLIC_SITE_URL`。
- Produces: `getSiteUrl(): URL`、JSON-LD、`/sitemap.xml`、`/robots.txt`、`/rss.xml`、稳定的 `/resume.pdf`。

- [ ] **Step 1: 写 URL 与简历校验失败测试**

测试 `getSiteUrl()` 在合法 HTTPS URL 下返回无尾斜杠基础 URL，在缺失或非 HTTPS 的生产配置下抛出明确错误。扩展内容脚本测试：`public/resume.pdf` 缺失、空文件或文件头不是 `%PDF-` 时失败。

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test -- src/lib/site-url.test.ts && pnpm exec tsx scripts/validate-content.ts`

Expected: FAIL，因为 URL 工具或真实 PDF 简历尚未就绪。

- [ ] **Step 3: 接收并加入真实 PDF 简历**

将用户提供的脱敏简历保存为 `public/resume.pdf`，确认教育、实习时间和成果数字与站点内容一致。简历下载路径保持固定，文件更新不改变 URL。

- [ ] **Step 4: 实现全局 metadata 和结构化数据**

首页输出 Person/ProfilePage 风格 JSON-LD，文章输出 BlogPosting JSON-LD；所有可见字段来自已校验内容。默认分享图使用仓库内 `social-card.svg`，不把邮箱直接绘制到分享图。

- [ ] **Step 5: 实现 sitemap、robots 和 RSS**

`sitemap.ts` 包含首页、博客列表和每篇公开文章；`robots.ts` 允许公开内容并指向 sitemap；RSS 包含标题、摘要、链接、发布日期和标签，XML 特殊字符必须转义。

- [ ] **Step 6: 实现首页精选文章**

从 `getAllPosts().filter(post => post.featured).slice(0, 4)` 获取内容；没有精选文章时整个区块不渲染，而不是显示空卡片。

- [ ] **Step 7: 运行 metadata E2E 和构建**

测试首页 canonical、JSON-LD、分享图、简历响应、sitemap、robots 和 RSS；文章页测试独立 title 与 description。

Run: `pnpm test && pnpm build && pnpm test:e2e -- tests/e2e/metadata.spec.ts`

Expected: 全部 PASS；`/resume.pdf` 返回 PDF，所有元数据端点返回 200。

- [ ] **Step 8: 提交**

```bash
git add public src/app src/components/home/featured-writing.tsx src/lib scripts/validate-content.ts tests/e2e/metadata.spec.ts
git commit -m "feat: add portfolio discovery and resume assets"
```

---

### Task 8: 可访问性、响应式与视觉回归质量门禁

**Files:**
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Modify: `src/app/globals.css`
- Modify: relevant components reported by tests
- Modify: `playwright.config.ts`

**Interfaces:**
- Consumes: 完整首页、博客和降级行为。
- Produces: WCAG A/AA 自动扫描、关键视口检查、稳定的非 Canvas UI 截图基线。

- [ ] **Step 1: 写 axe 与键盘失败测试**

使用 `@axe-core/playwright` 在首页、博客列表和文章详情运行 `wcag2a`、`wcag2aa`、`wcag21a`、`wcag21aa`；测试跳过导航、移动菜单、实习展开按钮和主要链接的键盘顺序。不排除核心组件或禁用 axe 规则。

- [ ] **Step 2: 写响应式失败测试**

在 390×844、768×1024、1440×900 三个视口断言 `document.documentElement.scrollWidth === window.innerWidth`，首屏主操作可见，导航可用，实习和案例内容没有裁切。

- [ ] **Step 3: 运行测试并记录真实失败**

Run: `pnpm test:e2e -- tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts`

Expected: 首次运行至少有一个失败；逐项记录具体规则、元素或视口，不使用通配跳过。

- [ ] **Step 4: 修复语义、焦点、对比度和布局**

只针对测试暴露的问题修改组件与令牌；Canvas 从视觉截图中屏蔽，截图基线只覆盖确定性的文字和面板层。动画测试统一启用减少动态效果，避免不稳定帧。

- [ ] **Step 5: 建立关键页面截图基线**

桌面与移动端分别覆盖首页首屏、实习展开状态、博客列表和文章详情。最大像素差阈值设为 0.01，任何基线更新必须人工查看差异图。

- [ ] **Step 6: 运行完整质量门禁**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`

Expected: 全部 PASS；axe violations 为 0；所有项目无横向滚动。

- [ ] **Step 7: 提交**

```bash
git add src playwright.config.ts tests/e2e
git commit -m "test: enforce accessibility and responsive quality"
```

---

### Task 9: Vercel 部署准备、审计与交付

**Files:**
- Create: `README.md`
- Create: `.env.example`
- Modify: `package.json`

**Interfaces:**
- Consumes: 完整应用、用户确认的域名或临时托管 URL。
- Produces: 可复现本地运行文档、环境变量合同、Vercel 部署配置和部署前审计记录。

- [ ] **Step 1: 检查 Vercel 部署前提**

保持原生 Next.js 项目结构，不创建 `.openai/hosting.json`，不引入 vinext 或 Cloudflare Workers 适配层。确认 `pnpm build` 使用标准 Next.js 构建，生产环境提供真实的 `NEXT_PUBLIC_SITE_URL`。部署时优先连接 Git 仓库与 Vercel 项目；如尚未取得 Vercel 授权，交付可复现的导入步骤而不伪造上线结果。

- [ ] **Step 2: 编写 README 和环境变量合同**

README 明确记录 `pnpm install`、`pnpm dev`、`pnpm verify`、内容更新、博客发布、简历替换、3D 降级和部署步骤。`.env.example` 只包含：

```dotenv
NEXT_PUBLIC_SITE_URL=https://portfolio.example.com
```

示例域名只用于说明变量格式，不进入生产构建；生产值由实际托管 URL 或用户域名提供。

- [ ] **Step 3: 运行依赖和敏感信息审计**

Run: `pnpm audit --prod && rg -n --hidden -g '!node_modules' -g '!.git' '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})' .`

Expected: 生产依赖无已知高危漏洞；敏感信息扫描无匹配。

- [ ] **Step 4: 运行最终验证**

Run: `pnpm verify`

Expected: lint、typecheck、单元测试、生产构建和全部 E2E 通过，命令退出码为 0。

- [ ] **Step 5: 进行浏览器视觉验收**

在桌面 1440×900 和移动 390×844 检查首屏、实习展开、案例、博客、减少动态效果和静态降级；确认 3D 不遮挡文字、PDF 可下载、链接目标正确。保留最终截图作为审阅证据，不将临时截图提交到仓库。

- [ ] **Step 6: 提交托管与文档**

```bash
git add README.md .env.example package.json pnpm-lock.yaml
git commit -m "docs: add portfolio operations and vercel deployment"
```

- [ ] **Step 7: 交付摘要**

报告最终提交、验证命令输出、尚未发布时的本地启动方式，以及已发布时的公开 URL。不得在未实际运行 `pnpm verify` 或未得到托管成功证据时声称完成或上线。

## Plan Self-Review Checklist

- 每项设计要求均映射到 Task 2–9 中的实现或验收步骤。
- 托管决策固定为 Next.js + Vercel，不创建 Sites/vinext/Cloudflare 专属配置。
- 个人真实信息和简历是明确的外部输入，不以虚构内容代替。
- 首页核心内容和博客内容保持服务端可读，3D 是可移除的增强层。
- 博客、RSS、SEO、可访问性、移动端、减少动态效果和 WebGL 失败均有自动测试。
- `SiteContent`、`validateSiteContent`、`getAllPosts`、`getPost`、`getSceneMode` 和 `getSiteUrl` 的命名在任务间保持一致。
- 每个任务都有失败测试、最小实现、通过验证和独立提交。
