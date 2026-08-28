# 同济品牌精修实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec（`docs/superpowers/specs/2026-08-27-tongji-brand-refinement-design.md`）完成品牌精修：隐藏三处简历入口、教育信息改「同济大学」、侧栏同济校徽徽章区块 + Noto Serif SC 衬线字体、Vercel 子域改短为 `jiangjunjie.vercel.app`，并完成全量验收与生产发布。

**Architecture:** 数据改动集中在 `content/site-content.json`；UI 改动集中在 `src/components/home/` 四个组件与 `src/app/profile.css`；字体经 `@fontsource/noto-serif-sc` 本地加载（import 进 layout）；子域与生产环境变量在 Vercel 侧配置，仓库内无域名硬编码（`src/lib/site-url.ts` 读 `NEXT_PUBLIC_SITE_URL`）。

**Tech Stack:** Next.js（App Router）+ React + 自定义 CSS（profile.css/globals.css）+ Vitest + Testing Library + Playwright + pnpm@10.34.5

## Global Constraints

- 工作目录：所有命令在 `/Users/jiangjunjie.37/personal portal/.worktrees/personal-portal` 执行；node 命令须在登录 shell（`/bin/zsh -lc`）中运行。
- 单测：`pnpm exec vitest run <path>`；e2e：`pnpm exec playwright test tests/e2e/<file>`；全量校验：`pnpm verify`。
- 文本搜索用 `grep`，不可用 `rg`。
- Vercel CLI：`npx -y --registry=https://registry.npmmirror.com vercel@latest <command>`；**已知陷阱**：CLI link 会篡改 `.gitignore` 并创建 `.vercel/` 目录，涉及 Vercel 命令的任务收尾时必须还原 `.gitignore`、删除 `.vercel/`，保证 `git status` 干净。
- 禁止使用 Google Fonts CDN；中文字体只走 `@fontsource` npm 本地包。
- 同济校徽仅用于个人教育背景标识（非商业用途）；来源记录必须写入 `public/brands/SOURCES.md`。
- 生产环境变量 `NEXT_PUBLIC_SITE_URL` 在 Task 6 变更为 `https://jiangjunjie.vercel.app`。
- 每个任务以一次 git commit 结束。

---

### Task 1: 教育信息精简为「同济大学」

**Files:**
- Create: `src/content/site-content.test.ts`
- Modify: `content/site-content.json:10` 与 `content/site-content.json:20`

**Interfaces:**
- Consumes: `content/site-content.json` 的 `profile.education[].school` 字段（现有值「同济大学电子与信息工程学院」）。
- Produces: `school` 值统一为「同济大学」；下游 `profile-dock.tsx`、`profile-info.tsx`、JSON-LD `alumniOf` 随数据自动更新，后续任务无需再改学校文案。

- [x] **Step 1: 写失败测试**

创建 `src/content/site-content.test.ts`：

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const content = JSON.parse(
  readFileSync(path.join(process.cwd(), "content", "site-content.json"), "utf8"),
) as { profile: { education: Array<{ school: string }> } };

describe("site-content education copy", () => {
  it("keeps school names at the university level (no college suffix)", () => {
    for (const education of content.profile.education) {
      expect(education.school).toBe("同济大学");
    }
  });
});
```

- [x] **Step 2: 运行测试确认失败**

Run: `pnpm exec vitest run src/content/site-content.test.ts`
Expected: FAIL，实际值为「同济大学电子与信息工程学院」。

- [x] **Step 3: 修改数据**

`content/site-content.json` 第 10 行与第 20 行，将 `"school": "同济大学电子与信息工程学院"` 改为 `"school": "同济大学"`（两处，major/degree/graduationYear 等其余字段不动）。

- [x] **Step 4: 运行测试确认通过**

Run: `pnpm exec vitest run src/content/site-content.test.ts`
Expected: PASS（1 个测试）。

- [x] **Step 5: 回归真实内容加载的既有单测**

Run: `pnpm exec vitest run src/components/home`
Expected: PASS（fixtures 已用「同济大学」，不受影响）。

- [x] **Step 6: 提交**

```bash
git add content/site-content.json src/content/site-content.test.ts
git commit -m "content: simplify school names to 同济大学"
```

---

### Task 2: 隐藏三处简历入口（保留 PDF 直链与资产校验）

**Files:**
- Modify: `src/components/home/profile-hero.tsx:20-22`（删除「下载简历」次按钮）
- Modify: `src/components/home/contact-stage.tsx:16-20`（删除「下载简历 PDF」li）
- Modify: `src/components/shell/header.tsx:15` 与 `:27`（删除「简历」导航项及 prefetch 特例）
- Test: `src/components/home/profile-hero.test.tsx:19`、`src/components/home/contact-stage.test.tsx:22-35`、`src/components/home/page-motion-controller.test.tsx:454-456`、`tests/e2e/home.spec.ts:23,82-87`、`tests/e2e/accessibility.spec.ts:7,66,78`、`tests/e2e/responsive.spec.ts:111,146`、`tests/e2e/server-rendering.spec.ts:15`

**Interfaces:**
- Consumes: Task 1 后的内容数据（无学校文案耦合）。
- Produces: 页面 UI 不再渲染任何 `href="/resume.pdf"` 链接；`public/resume.pdf`、`src/lib/resume-asset.ts` 构建校验、`tests/e2e/metadata.spec.ts:40-44` 资产测试全部保留不动。

- [x] **Step 1: 先改单测断言为「不存在」**

`src/components/home/profile-hero.test.tsx` 第 19 行改为：

```ts
    expect(screen.queryByRole("link", { name: "下载简历" })).not.toBeInTheDocument();
```

`src/components/home/contact-stage.test.tsx`：把 it 描述改为 `"links the email and GitHub profile exactly once each"`，删除 resume 相关三行断言，并在测试末尾追加：

```ts
    expect(screen.queryByRole("link", { name: "下载简历 PDF" })).not.toBeInTheDocument();
```

`src/components/home/page-motion-controller.test.tsx`：整段删除第 454-456 行：

```ts
    expect(document.querySelector('a[href="/resume.pdf"]')).not.toHaveAttribute(
      "data-nav-section",
    );
```

- [x] **Step 2: 运行单测确认失败**

Run: `pnpm exec vitest run src/components/home/profile-hero.test.tsx src/components/home/contact-stage.test.tsx src/components/home/page-motion-controller.test.tsx`
Expected: FAIL（组件仍渲染简历链接）。

- [x] **Step 3: 实施组件改动**

`src/components/home/profile-hero.tsx`：删除第 20-22 行的 secondary CTA：

```tsx
          <a className="profile-cta profile-cta-secondary" href="/resume.pdf">
            下载简历
          </a>
```

`src/components/home/contact-stage.tsx`：删除第 16-20 行的 `<li>`：

```tsx
        <li>
          <a href="/resume.pdf" download>
            下载简历 PDF
          </a>
        </li>
```

`src/components/shell/header.tsx`：从 `navigation` 数组删除 `{ label: "简历", href: "/resume.pdf" }`（第 15 行），并删除 Link 上第 27 行的 prefetch 特例：

```tsx
            prefetch={item.href === "/resume.pdf" ? false : null}
```

- [x] **Step 4: 运行单测确认通过**

Run: `pnpm exec vitest run src/components/home`
Expected: PASS（全部）。

- [x] **Step 5: 改写 e2e 断言**

`tests/e2e/home.spec.ts`：
- 删除第 23 行 `await expect(hero.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");`
- 第 82-87 行附近：删除 `const resume = contact.getByRole("link", { name: "下载简历 PDF" });` 与 `await expect(resume).toHaveAttribute("href", "/resume.pdf");`，`for (const link of [email, github, resume])` 改为 `for (const link of [email, github])`。

`tests/e2e/accessibility.spec.ts`：
- 第 7 行 `primaryNavItems` 数组删除 `"简历"`。
- 第 66 行删除 `hero.getByRole("link", { name: "下载简历", exact: true }),`。
- 第 78 行删除 `contact.getByRole("link", { name: "下载简历 PDF", exact: true }),`。

`tests/e2e/responsive.spec.ts`：删除第 111 行 `await expectHorizontallyContained(hero.getByRole("link", { name: "下载简历", exact: true }));` 与第 146 行 `await expectHorizontallyContained(contact.getByRole("link", { name: "下载简历 PDF" }));`

`tests/e2e/server-rendering.spec.ts` 第 15 行改为：

```ts
  await expect(page.getByRole("link", { name: /简历/ })).toHaveCount(0);
```

- [x] **Step 6: 运行 e2e 确认通过**

Run: `pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts tests/e2e/server-rendering.spec.ts`
Expected: PASS（全部用例；metadata.spec 的 resume 资产直链测试不受影响，可在 Step 7 一并跑）。

- [x] **Step 7: 提交**

```bash
git add src/components/home/profile-hero.tsx src/components/home/contact-stage.tsx src/components/shell/header.tsx src/components/home/profile-hero.test.tsx src/components/home/contact-stage.test.tsx src/components/home/page-motion-controller.test.tsx tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts tests/e2e/server-rendering.spec.ts
git commit -m "feat: remove resume download links from UI while keeping the public PDF asset"
```

---

### Task 3: 侧栏同济徽章区块 + Noto Serif SC 衬线字体

**Files:**
- Create: `src/components/home/profile-dock.test.tsx`
- Create: `public/brands/tongji.png`（从 `/Users/jiangjunjie.37/personal portal/brand-assets/badge.png` 复制）
- Modify: `public/brands/SOURCES.md`（补录 tongji 来源条目）
- Modify: `src/components/home/profile-dock.tsx`（教育行改为徽章块）
- Modify: `src/app/layout.tsx`（import 衬线字体）
- Modify: `src/app/profile.css:161-235`（重写 education 行样式为徽章块；新增 `.profile-dock-serif`）

**Interfaces:**
- Consumes: Task 1 后的 `education[0]`（school=「同济大学」、major、degree、graduationYear）；`BrandAsset` schema 不涉及（徽章图不在 internships/openSource 配置内，`assertValidBrandAssets` 不校验它）。
- Produces: 侧栏教育区块渲染 36px 校徽图（next/image，`/brands/tongji.png`）+ 衬线「同济大学」+ 紧凑专业/学位/年份层级；页面不新增交互。

- [x] **Step 1: 添加字体依赖并验证镜像可装**

Run: `/bin/zsh -lc 'cd "/Users/jiangjunjie.37/personal portal/.worktrees/personal-portal" && pnpm add @fontsource/noto-serif-sc'`
Expected: 依赖装入 `package.json`（默认 400 字重；600 字重按 CSS import 按需引入）。

- [x] **Step 2: 写失败测试**

创建 `src/components/home/profile-dock.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileDock } from "./profile-dock";
import { loadSiteContent } from "@/content/loader";

const content = loadSiteContent();
const education = content.profile.education[0];

describe("ProfileDock education badge", () => {
  it("renders the Tongji badge image with descriptive alt text", () => {
    render(<ProfileDock />);
    const badge = screen.getByRole("img", { name: "同济大学校徽" });
    expect(badge).toHaveAttribute("src", expect.stringContaining("tongji.png"));
  });

  it("shows the university name and academic details as text", () => {
    render(<ProfileDock />);
    expect(screen.getByText(education.school)).toBeVisible();
    expect(screen.getByText(education.major)).toBeVisible();
    expect(screen.getByText(education.degree)).toBeVisible();
    expect(screen.getByText(String(education.graduationYear))).toBeVisible();
  });
});
```

注：若 `loadSiteContent` 的实际导出名或路径不同（侦查时为 `@/content/loader` 的约定），以现有 `profile-info.test.tsx` 等真实用法为准；测试中 import 路径须与项目实际一致。若 ProfileDock 接收 props（如 `education` 数组），按现有调用方式传参，而不是依赖 loader。

- [x] **Step 3: 运行测试确认失败**

Run: `pnpm exec vitest run src/components/home/profile-dock.test.tsx`
Expected: FAIL（找不到 img 角色 / 校徽）。

- [x] **Step 4: 复制校徽资产并补录来源**

```bash
cp "/Users/jiangjunjie.37/personal portal/brand-assets/badge.png" public/brands/tongji.png
```

`public/brands/SOURCES.md` 追加条目（沿用既有 jd/agibot 等格式）：

```md
## tongji.png

- File: public/brands/tongji.png
- Brand: 同济大学校徽（Tongji University seal）
- Source: https://www.tongji.edu.cn/xxgk1/xxbs1.htm （同济大学官网「学校标识」页）
- Extraction method: 下载官网公开提供的透明底 PNG 校徽，重命名为 tongji.png
- License/usage: 官网公开标识，仅用于本站「教育背景」个人标识，非商业用途
- Retrieved: 2026-08-28
```

- [x] **Step 5: 重构 ProfileDock 教育区块**

`src/components/home/profile-dock.tsx`：将 education 行的 `span(school)/"//"/span(major)/"//"/span(degree)/"//"/span(graduationYear)` 斜杠串联结构，重写为（保留现有 className 命名风格，标注无障碍）：

```tsx
          <div className="profile-dock-education">
            <div className="profile-dock-education-main">
              <Image
                src="/brands/tongji.png"
                alt="同济大学校徽"
                width={36}
                height={36}
                className="profile-dock-education-badge"
              />
              <span className="profile-dock-education-school profile-dock-serif">
                {education.school}
              </span>
            </div>
            <span className="profile-dock-education-detail">
              {education.major}
            </span>
            <span className="profile-dock-education-detail">
              {education.degree} · {education.graduationYear}
            </span>
          </div>
```

`import Image from "next/image";` 加到文件顶部 import 区。若组件当前从 `education` 数组按索引取值，保持取 `education[0]`（硕士条目）或两条 education 均渲染徽章块——以现有组件对 `profile.education` 的遍历方式为准，徽章块结构套用于每个条目外层，img 仅首条渲染一次（两条教育记录均为同济，校徽显示一次即可；实现时若组件本来就 map 全部条目，可仅在 `index === 0` 时渲染 Image，或拆出独立徽章行放 map 之上——以视觉合理为准并同步测试断言 `getAllByRole("img", ...)` 与实际数量一致）。

- [x] **Step 6: 字体 import**

`src/app/layout.tsx` 顶部 import 区追加：

```ts
import "@fontsource/noto-serif-sc/600.css";
```

（600 字重即可满足标题级衬线展示；如需 400 备用再加。）

- [x] **Step 7: CSS 重写**

`src/app/profile.css` 191-206 行附近：删除现有 `.profile-dock-education` 旧网格/斜杠 span 样式，重写为：

```css
.profile-dock-education {
  display: grid;
  gap: 0.25rem;
}

.profile-dock-education-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.profile-dock-education-badge {
  display: block;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.profile-dock-education-school {
  font-size: 1.125rem;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.profile-dock-serif {
  font-family: var(--font-serif-sc, "Noto Serif SC", "Songti SC", "SimSun", serif);
  font-weight: 600;
}

.profile-dock-education-detail {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  line-height: 1.5;
}
```

变量 `--font-serif-sc` 不必在 globals.css 定义（CSS 直接写字体栈回退即可，保持零额外全局改动）；颜色变量名以现有 profile.css 实际使用的变量为准（侦查为 `var(--muted-foreground)` 风格，若实际不同则替换成文件中已存在的等价变量）。

- [x] **Step 8: 运行单测确认通过**

Run: `pnpm exec vitest run src/components/home`
Expected: PASS（含新 profile-dock 测试与受牵连的其他组件测试）。

- [x] **Step 9: 视觉冒烟（e2e 回归）**

Run: `pnpm exec playwright test tests/e2e/responsive.spec.ts tests/e2e/server-rendering.spec.ts`
Expected: PASS（侧栏文本变化不停导致断言失败；若某用例断言了旧「//」串联文本，按新结构同步修正该断言）。

- [x] **Step 10: 提交**

```bash
git add package.json pnpm-lock.yaml public/brands/tongji.png public/brands/SOURCES.md src/app/layout.tsx src/app/profile.css src/components/home/profile-dock.tsx src/components/home/profile-dock.test.tsx
git commit -m "feat: add Tongji badge block with Noto Serif SC to profile dock"
```

---

### Task 4: 动效控制器回归（nav-section 覆盖校验）

**Files:**
- Test: `src/components/home/page-motion-controller.test.tsx`

**Interfaces:**
- Consumes: Task 2/3 后的 DOM 结构（简历链接已移除、侧栏新增 img/文本节点）。
- Produces: 动效「导航区段覆盖」单测与真实 DOM 保持一致，防止遗漏动态元素。

- [x] **Step 1: 全量运行动效单测**

Run: `pnpm exec vitest run src/components/home/page-motion-controller.test.tsx`
Expected: PASS（Task 2 已删 454-456 行简历特判）。若失败，按 spec 的意图修正断言（动态元素须带 data-nav-section 或被显式豁免），不改产品代码。

- [x] **Step 2: 提交（如无改动则跳过）**

无文件改动则本任务无 commit；有断言修正则单独 commit：`test: align motion controller coverage with post-refactor DOM`。

---

### Task 5: Vercel 子域改短（jiangjunjie.vercel.app）

**Files:**
- 无仓库内代码改动（本任务在 Vercel 侧完成）。
- 人工/授权操作：Vercel 控制台 Domains 设置。

**Interfaces:**
- Consumes: 已部署的生产项目 `jiangjunjie-personal-portal`（团队 `junjie1467-6343s-projects`）。
- Produces: 新生产 URL `https://jiangjunjie.vercel.app`；旧域 `jiangjunjie-personal-portal.vercel.app` 自动 301 重定向；`NEXT_PUBLIC_SITE_URL` 生产环境变量同步更新。

- [x] **Step 1: 改子域名（用户已授权 CLI 尝试，失败回退人工控制台）**

> **2026-08-28 事后修正**：CLI rename 虽报 Success，但团队账号实际不会分配纯短子域，`jiangjunjie.vercel.app` 从未生效（Task 6 部署后确认 404）；最终经用户决策 rename 回 `jiangjunjie-personal-portal`，本任务域名变更目标整体放弃，详见 Task 6 Step 4 偏差记录。

优先用本机已登录的 Vercel CLI 尝试（子域名与项目名绑定，评估 `vercel` CLI 的项目改名/domains 能力，如 `npx -y --registry=https://registry.npmmirror.com vercel@latest domains` 与项目相关子命令）；CLI 不支持改名时，回退人工：项目 Settings → Domains → Rename/Add domain 为 `jiangjunjie.vercel.app`，并请用户确认完成。
- 若提示 `jiangjunjie.vercel.app` 已被占用：回退第二选择 `jjjiang.vercel.app`（后续步骤与验收 URL 同步替换）。
- **完成 CLI/控制台操作后检查 `.gitignore` 是否被篡改、`.vercel/` 是否生成，有则还原/删除。**

- [x] **Step 2: 更新生产环境变量**

控制台：Settings → Environment Variables → 将 `NEXT_PUBLIC_SITE_URL` 的 Production 值改为 `https://jiangjunjie.vercel.app`（或回退域名值），保存后须重新部署才生效（Task 6 部署即触发）。

- [x] **Step 3: 验证仓库无域名硬编码**

Run: `grep -rn "jiangjunjie-personal-portal.vercel.app" src/ tests/ content/` 
Expected: 无输出（若有命中则按 site-url 体系改为读 `NEXT_PUBLIC_SITE_URL` 的值，不留硬编码）。

---

### Task 6: 全量验收与生产发布

**Files:**
- 无新增改动；本任务执行验证与部署。

**Interfaces:**
- Consumes: Task 1-5 全部完成后的代码库与 Vercel 项目。
- Produces: 生产站点在新子域上线，旧域 301，metadata/JSON-LD/sitemap/rss 指向新域。

- [x] **Step 1: 本地全量验证**

Run: `/bin/zsh -lc 'cd "/Users/jiangjunjie.37/personal portal/.worktrees/personal-portal" && pnpm verify'`
Expected: lint + typecheck + unit + e2e 全部 PASS。

- [x] **Step 2: 提交计划勾选与 push**

（执行者按完成情况更新计划 checkbox 后）
```bash
git push origin feature/personal-portal
```
（commit 656ea05，含 Task 1-5/Task 6 Step 1 勾选与过期视觉快照更新，已 push。）

- [x] **Step 3: 生产部署**

```bash
npx -y --registry=https://registry.npmmirror.com vercel@latest deploy --prod
```
**部署后必须：还原 `.gitignore` 被篡改的行、删除 `.vercel/` 目录，`git status` 干净。**

（实际部署 3 次：`jiangjunjie-67idhfzwc`、`jjjiang-lr95vap09`、最终 `jiangjunjie-personal-portal-2k4l1rx6m`，均 Ready。CLI 陷阱检查多次通过：无 `.vercel/`、`.gitignore` 无改动、status 干净。）

- [x] **Step 4: 新域验收**（域名方案偏差，见下）

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://jiangjunjie.vercel.app/
curl -s https://jiangjunjie.vercel.app/ | grep -o "https://jiangjunjie.vercel.app" | head -n 3
curl -s https://jiangjunjie.vercel.app/sitemap.xml | grep -c "jiangjunjie.vercel.app"
curl -s https://jiangjunjie.vercel.app/ | grep -c "tongji.png"
curl -s https://jiangjunjie.vercel.app/ | grep -c "同济大学"
curl -s https://jiangjunjie.vercel.app/ | grep -c "下载简历" || echo "0 resume links (expected)"
```
Expected: 首行 200；JSON-LD/sitemap 含新域；tongji.png 与「同济大学」≥1；「下载简历」0。

> **域偏差记录（2026-08-28）**：Vercel 团队账号不分配纯短子域（`[project].vercel.app`），项目只获得 `[project]-[team].vercel.app`（且受 SSO 保护不可公开访问）；`jiangjunjie.vercel.app` 与回退域 `jjjiang.vercel.app` 均为 404（vercel.app 为通配 DNS，404 非占用证据）。经用户决策回退旧域：项目名 rename 回 `jiangjunjie-personal-portal`，`NEXT_PUBLIC_SITE_URL` 改回旧域值，重新生产部署。验收在旧域 `https://jiangjunjie-personal-portal.vercel.app` 等效执行：HTTP 200；页面 18 处站点 URL 全部为旧域；sitemap 全部指向旧域；tongji.png=2、同济大学=5、下载简历=0，`/brands/tongji.png` 资产 200。**子域缩短目标（Task 5 Step 1/2 及本任务新域项）经用户决策放弃，旧域为唯一生产域。**

- [x] **Step 5: 旧域 301 验收**（域名方案偏差，见 Step 4 记录）

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://jiangjunjie-personal-portal.vercel.app/
```
Expected: `301` 且 redirect_url 为 `https://jiangjunjie.vercel.app/`（或回退域名）。

（实际：域变更已放弃，旧域 `200` 直接服务最新内容，非 301；此项按用户决策关闭。）

- [x] **Step 6: 更新记忆与收尾**

生产部署事实（新子域）更新到 `.joycode/memory/reference_production_deployment.md`；向用户报告新旧域验收结果。

（记忆文件已按实际状态更新：项目名 `jiangjunjie-personal-portal`、生产 URL 旧域、纯短域不可用结论。）

---

## 自审清单（写计划者已核）

- spec 五模块（A 子域/B 简历入口/C 教育信息/D 徽章衬线/E 验收）全部映射到 Task 1-6，无遗漏。
- 所有测试改动给出具体文件与断言新旧代码，无 `...`/占位符。
- B 任务的 `page-motion-controller.test.tsx:454-456` 特判删除与 D 任务后的回归（Task 4）闭环。
- D 任务的资产来源记录、非商业用途注释、字体本地化（@fontsource）符合 Global Constraints。
- A 任务含回退分支（jjjiang.vercel.app）与旧域 301 验收。
- spec 文件本身的未提交修正（B/D 两处）随计划一起 commit。

## 计划自查声明

- 本计划遵循 TDD：每个代码任务先写失败测试再实现。
- 命令均已按本机实际坑位修正（登录 shell、pnpm exec vitest、grep、Vercel CLI 陷阱）。
- 保存路径符合惯例：`docs/superpowers/plans/2026-08-27-tongji-brand-refinement-implementation.md`。