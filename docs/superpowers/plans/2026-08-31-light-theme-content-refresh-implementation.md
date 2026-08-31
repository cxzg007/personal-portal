# 2026-08-31 浅色主题与内容刷新实施计划

**Goal:** 落地 `docs/superpowers/specs/2026-08-31-light-theme-content-refresh-design.md` 的六项设计：A 全站浅黄暖底主题；B 教育经历双校徽；C 删除「荣誉与长期积累」section（Trending 徽章改为 shields.io 图片保留在开源卡片内）；D GitHub Stars 展示（快照 + 构建时 API 回退）；E 开源贡献排序（merged 在前、组内 PR 号倒序）；F 实习卡片忠实 resume 要点、压缩空白、高清 logo（64-72px 渲染）。

**Architecture:** 单页 Next.js App Router 站点。内容管线：`content/site-content.json` → `validateSiteContent()` → `loadSiteContent()` → 服务端组件。首页视觉由 `src/app/globals.css` + `src/app/profile.css`（profile-shell 深色系统，主要承载首页）两层 CSS 构成。测试三层：vitest + RTL 组件单测、Playwright e2e（`tests/e2e/home.spec.ts`）、Playwright 视觉快照（`tests/e2e/visual.spec.ts`）。

**Tech Stack:** Next.js（App Router）、React 服务端组件、TypeScript、Tailwind v4 + 全局 CSS、vitest + Testing Library、Playwright（含 @axe-core/playwright）、pnpm。

**Global Constraints:**

- 本机 shell 硬约束：所有 node/pnpm/npx 命令必须经登录 shell 执行，格式 `/bin/zsh -lc '<命令>'`；npx 调 CLI 必带 `-y`。
- 查看历史用 `git --no-pager log --oneline | cat` / `git --no-pager show <sha> | cat`（git 分页器会挂起）。
- 每个任务严格 TDD：先写失败测试 → 运行确认失败 → 最小实现 → 运行通过 → `git commit`。严禁占位符。
- 视觉基线策略：Task 1 末尾全量重生成所有快照并提交；Task 2/4/5/6/7/8 各自末尾只更新受影响基线。
- 品牌图文件名不变（jd.png / agibot.png / cssc.png / tongji.png / semantica.png），schema 的 `/brands/` 路径校验无需改动。
- 部署：`git push` + `npx -y vercel deploy --prod` 两步，**绝不执行 `vercel link`**；生产 URL `https://jiangjunjie-personal-portal.vercel.app`。
- 本计划面向 agentic workers：每个 Task 独立可验证、可提交；Task 之间有顺序依赖（1 → 2..8 → 9）。

---

## Task 1: 全站浅黄暖底主题（globals.css + profile.css）

**Files:** `src/app/globals.css`、`src/app/profile.css`、`tests/e2e/theme.spec.ts`（新建）

**Interfaces:**
- Consumes: 现有 CSS 变量体系（globals.css `:root` 行 3-24；profile.css `.profile-shell` 行 4-19）。
- Produces: 浅色 token 体系：底 `#faf3e3`、面板 `#fffbee`、正文 `#3d2f1e`、弱化 `#7a6a55`、amber 暗化 `#c47f17`、coral 暗化 `#c85a3c`、`--amber-rgb: 196 127 23`。

### Step 1.1 写失败测试 `tests/e2e/theme.spec.ts`

```ts
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage uses the light warm paper tokens", async ({ page }) => {
  await page.goto("/");
  const tokens = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>(".profile-shell");
    const styles = getComputedStyle(shell!);
    return {
      ink: styles.getPropertyValue("--profile-ink").trim(),
      bg: styles.getPropertyValue("--profile-bg").trim(),
      muted: styles.getPropertyValue("--profile-muted").trim(),
    };
  });
  expect(tokens.ink).toBe("#3d2f1e");
  expect(tokens.bg).toBe("#f7efdd");
  expect(tokens.muted).toBe("rgb(61 47 30 / 62%)");
});

test("homepage keeps readable contrast on the light theme", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).include("main").analyze();
  const contrast = results.violations.filter((v) => v.id === "color-contrast");
  expect(contrast).toEqual([]);
});

test("root document background is light, not dark", async ({ page }) => {
  await page.goto("/");
  const pageColor = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--page").trim(),
  );
  expect(pageColor).toBe("#faf3e3");
});
```

运行 `/bin/zsh -lc 'npx -y playwright test tests/e2e/theme.spec.ts'`，三个用例全部失败（当前 `--profile-ink: #fff3f0`、`--page: #0d0b09`）。

### Step 1.2 globals.css token 翻转（`:root` 行 3-24 整块替换）

```css
:root {
  --page: #faf3e3;
  --surface: #fffbee;
  --surface-strong: #f5ead4;
  --ink: #3d2f1e;
  --muted: #7a6a55;
  --amber: #c47f17;
  --coral: #c85a3c;
  --amber-rgb: 196 127 23;
  --color-bg: var(--page);
  --color-bg-deep: #f3e9d2;
  --color-panel: rgba(255, 251, 238, 0.82);
  --color-panel-strong: rgba(255, 250, 240, 0.95);
  --color-text: var(--ink);
  --color-muted: var(--muted);
  --color-primary: var(--amber);
  --color-accent: var(--coral);
  --color-border: rgba(var(--amber-rgb), 0.28);
  --radius-card: 1.25rem;
  --content-width: 72rem;
  --header-height: 4.75rem;
}
```

同时翻转 body 背景（行 41-45）与网格纹理（行 47-57）：

```css
body {
  min-width: 0;
  margin: 0;
  overflow-x: clip;
  background:
    radial-gradient(circle at 72% 5%, rgba(200, 90, 60, 0.12), transparent 31rem),
    radial-gradient(circle at 12% 28%, rgba(var(--amber-rgb), 0.1), transparent 24rem),
    linear-gradient(180deg, #f3e9d2, var(--color-bg) 34rem, #faf3e3);
}
```

网格纹理行内 `rgba(var(--amber-rgb), 0.035)` 改为 `rgba(var(--amber-rgb), 0.06)`（浅底上需要略高存在感）。

### Step 1.3 globals.css 硬编码深色/亮色清扫

用以下映射表逐个替换（用 `/bin/zsh -lc "grep -nE '#(fff|ffe|f5e|f4e|d8c|c8b|c9b|ac9|bf b|bfb|8a7|dbc|dcc)[0-9a-f]{3}' src/app/globals.css"` 与 `grep -n 'rgba(23, 18, 14' src/app/globals.css` 等命令枚举残留）：

| 旧值（深色主题） | 新值（浅色主题） |
|---|---|
| `rgba(23, 18, 14, X)`（面板底） | `rgba(255, 251, 238, X + 0.1)`（上限 0.95） |
| `rgba(13, 11, 9, X)`（header/深底） | `rgba(250, 243, 227, X)` |
| `#080605`、`#100c08`、`#0d0b09` | `#f3e9d2` |
| `#fff5e4`、`#fff2dd`、`#ffe9c8`（大标题亮字） | `#3d2f1e` |
| `#f5e9db`、`#f4e8df` | `#4f3f2a` |
| `#d8c8b4`、`#dbccbc`、`#c8b9a8` | `#5c4d39` |
| `#c9b9a7` | `var(--muted)` |
| `#ac9d8b`、`#bfb09f`、`#8a7b6b` | `#7a6a55` |
| `#1c1208`（button-primary 文字，amber 底上） | 保持不变（amber 底配深字对比仍达标） |
| `#ffc784`（button hover） | `#d8932f` |
| `rgba(0, 0, 0, 0.17)` 阴影 | `rgba(61, 47, 30, 0.12)` |

注意行 633-917 `@media (max-width: 920px)` 内有历史复制的大段重复样式（含同样的深色字面量），必须同步清扫；行 1008 附近与行 1697-1725 的动效块同样检查。清扫完成后运行 Step 1.6 的枚举命令确认无深色残留（动效 `html[data-brand-motion...]` 块内仅透明度/延迟可不动）。

### Step 1.4 profile.css token 翻转（`.profile-shell` 行 4-19 整块替换）

```css
.profile-shell {
  --profile-bg: #f7efdd;
  --profile-bg-deep: #f1e6cc;
  --profile-hero-top: #e8d5ae;
  --profile-hero-mid: #eddbb6;
  --profile-hero-low: #f1e6cc;
  --profile-ink: #3d2f1e;
  --profile-muted: rgb(61 47 30 / 62%);
  --profile-panel: #fffbee;
  --profile-panel-deep: #f5ead4;
  --profile-line: rgb(120 90 40 / 18%);
  --profile-accent: #b96a3a;
  --profile-width: 68.75rem;
  color: var(--profile-ink);
  background: linear-gradient(#f7efdd, #f1e6cc 42%, #f1e6cc);
}
```

hero 渐变（行 21-28）替换为暖浅色：

```css
.profile-hero {
  position: relative;
  min-height: 71.25rem;
  overflow: clip;
  background:
    radial-gradient(circle at 50% 0%, rgb(230 197 141 / 46%), transparent 46%),
    linear-gradient(#e8d5ae, #eddbb6 28%, #f1e6cc 54%, #f7efdd 78%, #faf3e3);
}
```

h1 文字渐变（行 30-38）改为深暖棕（`background: linear-gradient(#4a3620, #5c452b 62%, #6e5433);`，保留 `background-clip: text` 与行 47-49 的 `-webkit-text-fill-color: transparent`）。

### Step 1.5 profile.css 硬编码清扫

profile.css 共约 1000 行，用同一映射表清扫所有深色底/亮色字字面量。枚举命令：

- `/bin/zsh -lc "grep -n 'rgb(255' src/app/profile.css"`（亮色文字 rgba）
- `/bin/zsh -lc "grep -nE '#(0[0-9a-fA-F]|1[0-9a-fA-F])' src/app/profile.css"`（深色底 hex）
- `/bin/zsh -lc "grep -nE 'rgb\\([0-9]{1,2} ' src/app/profile.css"`（深色底 rgb）
- `/bin/zsh -lc "grep -nE 'rgb\\((1[0-9]{2}|2[0-9]{2})[ ,]' src/app/profile.css"`（深色 rgb/rgba）

典型替换：`rgb(6 9 9 / 72%)`（固定 header 底）→ `rgb(247 239 221 / 82%)`；`rgb(255 250 240 / 78%)` 等 hero 文字 → `rgb(61 47 30 / 78%)`；`#17171b`/`#0e1016` 面板 → `#fffbee`/`#f5ead4`；`#fffdfa`/`#f4e8df`/`#dccdc4`（h1 渐变）→ 上文深棕渐变；`#f7708e` 粉色 accent → `#b96a3a`。

清扫以 Step 1.1 的 e2e + Step 1.6 的快照为验收：不允许出现白字落在浅底上的组合。改完运行 `/bin/zsh -lc 'npx -y playwright test tests/e2e/theme.spec.ts'` 三个用例全绿。

### Step 1.6 全量重生成视觉基线并提交

```sh
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts --update-snapshots'
/bin/zsh -lc 'npx -y playwright test'
/bin/zsh -lc 'pnpm test'
git add -A && git commit -m "feat: flip the site to a light warm paper theme"
```

若某快照重生成后肉眼仍明显异常（白底白字），回到对应 CSS 位置修复后再次重生成。

---

## Task 2: 教育经历双校徽（profile-dock）

**Files:** `src/components/home/profile-dock.tsx`、`src/components/home/profile-dock.test.tsx`

**Interfaces:**
- Consumes: `SiteContent["profile"]["education"]`（2 条，同济硕士 + 同济本科）。
- Produces: 每条教育经历渲染一枚 36×36 的 `/brands/tongji.png` 校徽。

### Step 2.1 修改失败测试

`profile-dock.test.tsx` 的「renders the Tongji badge image exactly once」用例改为：

```tsx
it("renders the Tongji badge on every education entry", () => {
  render(<ProfileDock profile={profile} />);
  const badges = screen.getAllByRole("img", { name: "同济大学校徽" });
  expect(badges).toHaveLength(2);
  expect(badges[0]).toHaveAttribute("src", expect.stringContaining("tongji.png"));
  expect(badges[1]).toHaveAttribute("src", expect.stringContaining("tongji.png"));
});
```

并补充断言每条 li 内各含一枚校徽（在「badge block layout」用例中：`within(item).getAllByRole("img", { name: "同济大学校徽" })` 长度为 1）。运行 `/bin/zsh -lc 'pnpm test'` 确认失败（当前仅 1 枚）。

### Step 2.2 最小实现

`profile-dock.tsx` 行 24-33 去掉 `index === 0 ? ... : null` 条件包裹，直接渲染 `<Image alt="同济大学校徽" className="profile-dock-education-badge" height={36} src="/brands/tongji.png" width={36} />`。

### Step 2.3 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts -g "profile hero"'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts -g "profile hero" --update-snapshots'
git add -A && git commit -m "feat: show the Tongji badge on both education entries"
```

---

## Task 3: 删除「荣誉与长期积累」section（五层联动）

**Files:** `src/app/page.tsx`、`src/components/shell/header.tsx`、`src/components/home/honor-gallery.tsx`（删除）、`src/components/home/honor-gallery.test.tsx`（删除）、`src/content/schema.ts`、`src/content/schema.test.ts`、`content/site-content.json`、`src/test/fixtures.ts`、`tests/e2e/home.spec.ts`、`tests/e2e/visual.spec.ts`、`README.md`

**Interfaces:**
- Consumes: `site-content.json` 的 `academicHonors`（3 条）与 `openSource.honors`（2 条，**保留**，Task 4 使用）。
- Produces: `SiteContent` 类型不再含 `academicHonors`；首页 section 数量 8 → 7；导航不再含「荣誉」项。

### Step 3.1 修改失败测试（e2e）

`tests/e2e/home.spec.ts`：

1. 「reference-style section order」用例（行 132-142）：期望数组删掉 `"honors"`，`count` 断言改为 `7`。
2. 原「open source showcase …」用例尾部对 `section#honors` 的断言（#1 Repository of the Day / #3 Repository of the Week / 国家励志奖学金 / 大唐杯上海市二等奖 / 本科专业排名 12/62 / disclaimer）整体删除，替换为新用例：

```ts
test("honors section and its navigation entry are fully removed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("section#honors")).toHaveCount(0);
  await expect(page.getByText("荣誉与长期积累")).toHaveCount(0);
  await expect(page.getByText("国家励志奖学金")).toHaveCount(0);
  await expect(page.getByText("大唐杯上海市二等奖")).toHaveCount(0);
  await expect(page.locator('header a[href="#honors"]')).toHaveCount(0);
});
```

运行 `/bin/zsh -lc 'npx -y playwright test tests/e2e/home.spec.ts'` 确认新用例失败。

### Step 3.2 页面层删除

`src/app/page.tsx`：删除 `import { HonorGallery } from "@/components/home/honor-gallery";` 与整个 honors section（`<section id="honors" …>` 到对应 `</section>`，含 h2「荣誉与长期积累。」）。

### Step 3.3 导航层删除

`src/components/shell/header.tsx`：navigation 数组删除 `{ label: "荣誉", href: "#honors" }` 项。

### Step 3.4 组件层删除

删除文件 `src/components/home/honor-gallery.tsx` 与 `src/components/home/honor-gallery.test.tsx`：

```sh
/bin/zsh -lc 'rm src/components/home/honor-gallery.tsx src/components/home/honor-gallery.test.tsx'
```

同时删除死代码（未被任何页面引用，仅自身测试引用）：

```sh
/bin/zsh -lc 'rm src/components/home/open-source-spotlight.tsx src/components/home/open-source-spotlight.test.tsx'
```

并清扫 `globals.css` 中 `.open-source-spotlight*` 相关样式块（行 374 起至行 917 内含 `grid-template-areas` 带 "honors" 的块、行 1008 附近动效块；grep 命令：`/bin/zsh -lc "grep -n 'open-source-spotlight\\|open-source-honor' src/app/globals.css"` 逐块删除，同时删除 `.content-section` 系未被首页使用的规则无需处理，只删 spotlight 系）。

### Step 3.5 schema 层删除

`src/content/schema.ts`：

1. 删除 `AcademicHonor` interface 定义（行 59-64）。
2. `SiteContent` 接口删除 `academicHonors: AcademicHonor[];` 字段。
3. `validateSiteContent` 删除 academic-honors 校验块（行 410-420，含「恰好 3 条」与字段非空断言）。
4. `openSource.honors` 的校验块**保留不动**。

### Step 3.6 数据层删除

`content/site-content.json`：删除整个 `"academicHonors": [...]` 数组（行 441 起的 3 条目）。`src/test/fixtures.ts`：删除 fixtures 中 `academicHonors` 构造字段。

### Step 3.7 schema 测试更新

`src/content/schema.test.ts`：删除「rejects academic-honors counts that drift」用例（行 184-187）与 accept 基线里 `academicHonors` 的构造（行 194 附近）；grep 确认无 `academicHonors` 残留：`/bin/zsh -lc "grep -rn 'academicHonors\\|AcademicHonor\\|honor-gallery\\|HonorGallery' src content tests README.md | cat"`，输出须为空。

### Step 3.8 视觉快照更新

`tests/e2e/visual.spec.ts`：原「open source and honors…」用例改为只 clip open-source section（boundingBox 取 `section#open-source`），截图名改为 `open-source-1440.png`，并删除旧基线 `tests/e2e/home.spec.ts-snapshots/open-source-honors-1440.png`（执行时用 `find tests -name '*open-source-honors*'` 定位实际路径后删除）。

### Step 3.9 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test'
/bin/zsh -lc 'pnpm build'
/bin/zsh -lc 'npx -y playwright test'
git add -A && git commit -m "feat: remove the honors section end to end"
```

（`pnpm build` 内含 `validate-content.ts`，确认 schema 与数据同步删除成功。README 行 51-52 的 academicHonors 描述句一并删除。）

---

## Task 4: Trending 荣誉徽章迁入开源卡片（shields.io 图片）

**Files:** `src/components/home/open-source-showcase.tsx`、`src/components/home/open-source-showcase.test.tsx`、`next.config.ts`、`src/app/globals.css`、`tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `openSource.honors`（2 条，platform + rank，schema 校验已存在）。
- Produces: open-source 卡片 header 区渲染 2 枚 shields.io 图片徽章（next/image，28px 高）。

### Step 4.1 写失败单测

`open-source-showcase.test.tsx` 新增用例：

```tsx
it("renders trending honor badges as shields.io images", () => {
  render(<OpenSourceShowcase project={openSource} />);
  const badges = screen.getAllByRole("img", { name: /Trending|Trendshift/ });
  expect(badges).toHaveLength(2);
  expect(badges[0]).toHaveAttribute("alt", "GitHub Trending #1 Repository of the Day");
  expect(badges[1]).toHaveAttribute("alt", "Trendshift #3 Repository of the Week");
  for (const badge of badges) {
    expect(badge).toHaveAttribute("src", expect.stringContaining("img.shields.io/badge/"));
  }
});
```

运行 `/bin/zsh -lc 'pnpm test'` 确认失败（当前不渲染任何图片徽章）。

### Step 4.2 放行外域图片

`next.config.ts` 的 `images` 配置增加：

```ts
remotePatterns: [
  {
    protocol: "https",
    hostname: "img.shields.io",
    pathname: "/badge/**",
  },
],
```

### Step 4.3 组件实现

`open-source-showcase.tsx` 在 `background` 段之后（边界文案之前）插入：

```tsx
<ul aria-label="Semantica 项目荣誉" className="open-source-honor-badges">
  {project.honors.map((honor) => (
    <li key={honor.rank}>
      <Image
        alt={`${honor.platform} ${honor.rank}`}
        height={28}
        src={`https://img.shields.io/badge/${encodeURIComponent(honor.platform)}-${encodeURIComponent(honor.rank)}-c47f17?style=flat-square`}
        width={280}
      />
    </li>
  ))}
</ul>
```

顶部 import 增加 `Image`（`next/image`）。alt 文案须与 Step 4.1 断言一致（`GitHub Trending #1 Repository of the Day` 等，来自数据原文）。

### Step 4.4 样式

`globals.css` 追加（放浅色体系下）：

```css
.open-source-honor-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0 0 1.25rem;
  padding: 0;
  list-style: none;
}
```

### Step 4.5 e2e 断言 + 快照更新

`tests/e2e/home.spec.ts` 在 open-source 用例追加：

```ts
await expect(
  openSource.getByRole("img", { name: "GitHub Trending #1 Repository of the Day" }),
).toBeVisible();
await expect(
  openSource.getByRole("img", { name: "Trendshift #3 Repository of the Week" }),
).toBeVisible();
```

注意：既有「brand marks load eagerly and never shift page height」用例断言 `main .brand-mark img` 恰好 4 枚——新徽章不在 `.brand-mark` 内，计数不受影响；shields 图片带 width/height 属性，无 CLS。

### Step 4.6 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test'
/bin/zsh -lc 'npx -y playwright test tests/e2e/home.spec.ts'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts -g "open source" --update-snapshots'
git add -A && git commit -m "feat: keep trending honors as shields.io badges in the open source card"
```

（e2e 需访问 img.shields.io 外网；若本机网络受限导致图片不加载，`toBeVisible` 仍会通过但截图缺徽章，执行者须肉眼核对基线图。）

---

## Task 5: GitHub Stars 展示（快照 + 构建时 API 回退）

**Files:** `src/lib/github-stars.ts`（新建）、`src/lib/github-stars.test.ts`（新建）、`src/content/schema.ts`、`src/content/schema.test.ts`、`content/site-content.json`、`src/test/fixtures.ts`、`src/components/home/open-source-showcase.tsx`、`src/components/home/open-source-showcase.test.tsx`、`src/app/page.tsx`、`tests/e2e/home.spec.ts`、`.env.example`

**Interfaces:**
- Consumes: `openSource.repositoryUrl`（GitHub 仓库）、新增 `openSource.starsSnapshot: number`（快照值 11400）、可选环境变量 `GITHUB_TOKEN`。
- Produces: `formatStars(n: number): string`（如 11400 → "11.4k+"）；`fetchGitHubStars(snapshot: number): Promise<number>`（带超时的 API 拉取，任何失败回退 snapshot）；`OpenSourceShowcase` 新增必填 prop `stars: number`。

### Step 5.1 写失败单测 `src/lib/github-stars.test.ts`

文件顶部加 `// @vitest-environment node`。用例：

```ts
import { describe, expect, it, vi } from "vitest";
import { fetchGitHubStars, formatStars } from "./github-stars";

describe("formatStars", () => {
  it("formats compact star counts with a plus suffix", () => {
    expect(formatStars(11400)).toBe("11.4k+");
    expect(formatStars(1200)).toBe("1.2k+");
    expect(formatStars(999)).toBe("999+");
    expect(formatStars(1000)).toBe("1k+");
  });
});

describe("fetchGitHubStars", () => {
  it("returns the live count when the GitHub API responds", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stargazers_count: 12345 }),
    }));
    expect(await fetchGitHubStars(11400)).toBe(12345);
  });

  it("falls back to the snapshot when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchGitHubStars(11400)).toBe(11400);
  });

  it("falls back to the snapshot when the API rejects the request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    expect(await fetchGitHubStars(11400)).toBe(11400);
  });
});
```

运行 `/bin/zsh -lc 'pnpm test'` 确认失败（模块不存在）。

### Step 5.2 实现 `src/lib/github-stars.ts`

```ts
const GITHUB_API_TIMEOUT_MS = 3500;

export function formatStars(stars: number): string {
  if (stars < 1000) return `${stars}+`;
  const k = stars / 1000;
  const text = k >= 100 ? `${Math.round(k)}` : `${Number(k.toFixed(1))}`;
  return `${text}k+`;
}

export async function fetchGitHubStars(snapshot: number): Promise<number> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch("https://api.github.com/repos/semantica-agi/semantica", {
      headers,
      signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS),
    });
    if (!response.ok) return snapshot;
    const payload = (await response.json()) as { stargazers_count?: unknown };
    return typeof payload.stargazers_count === "number" ? payload.stargazers_count : snapshot;
  } catch {
    return snapshot;
  }
}
```

（仓库 URL 从 `repositoryUrl` 派生；若与硬编码不一致，以 `repositoryUrl` 实际值为准改写为参数化 fetch。）运行单测通过。

### Step 5.3 schema 扩展

`src/content/schema.ts`：`OpenSourceProject` interface 增加 `starsSnapshot: number;`；`validateSiteContent` 的 open-source 块追加：`assert(openSource.starsSnapshot >= 0 && Number.isInteger(openSource.starsSnapshot), "openSource.starsSnapshot must be a non-negative integer");`。`schema.test.ts` 新增拒绝用例：`starsSnapshot: 11400.5` 与 `starsSnapshot: -1` 均须抛错。

### Step 5.4 数据层

`content/site-content.json` openSource 对象新增 `"starsSnapshot": 11400`；`src/test/fixtures.ts` 的 openSource 构造同步新增 `starsSnapshot: 11400`。

### Step 5.5 组件与页面

`open-source-showcase.tsx`：props 增加 `stars: number;`；在 identity 行旁渲染：

```tsx
<p className="open-source-stars">{`${formatStars(stars)} GitHub Stars`}</p>
```

`src/app/page.tsx` 改为 async 服务端组件：

```tsx
export default async function HomePage() {
  const content = loadSiteContent();
  const stars = await fetchGitHubStars(content.openSource.starsSnapshot);
  // …原渲染逻辑不变，仅给 OpenSourceShowcase 传 stars={stars}
}
```

`open-source-showcase.test.tsx` 既有 5 处 render 调用补传 `stars={openSource.starsSnapshot}`（fixtures），并新增断言：`expect(screen.getByText("11.4k+ GitHub Stars")).toBeVisible();`（用 `stars: 11400`）。

### Step 5.6 e2e + env 文档

`home.spec.ts` open-source 用例追加 `await expect(openSource.getByText("11.4k+ GitHub Stars")).toBeVisible();`（本地构建走快照回退，值恒定 11400；若 API 成功返回不同值导致 flaky，则断言改为 `getByText(/GitHub Stars/)`）。`.env.example` 追加注释行：`# Optional: raise GitHub API rate limits during build (GITHUB_TOKEN=)`。

### Step 5.7 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test && pnpm build'
/bin/zsh -lc 'npx -y playwright test tests/e2e/home.spec.ts'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts -g "open source" --update-snapshots'
git add -A && git commit -m "feat: surface GitHub stars with snapshot fallback"
```

---

## Task 6: 开源贡献排序（merged 在前、组内 PR 号倒序）

**Files:** `src/components/home/open-source-showcase.tsx`、`src/components/home/open-source-showcase.test.tsx`、`tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `openSource.contributions`（13 条，含 `status` 与 `number`）。
- Produces: 渲染顺序 = merged 组（PR 号降序）在前，open 组在后。

### Step 6.1 写失败单测

`open-source-showcase.test.tsx` 新增：

```tsx
it("orders merged contributions first, newest PR number within each group", () => {
  render(<OpenSourceShowcase project={openSource} stars={openSource.starsSnapshot} />);
  const numbers = screen
    .getAllByRole("link", { name: /PR #/ })
    .map((link) => Number(link.textContent!.match(/#(\d+)/)![1]));
  const merged = openSource.contributions.filter((c) => c.status === "merged");
  const expected = [
    ...merged.toSorted((a, b) => b.number - a.number).map((c) => c.number),
    ...openSource.contributions.filter((c) => c.status !== "merged").map((c) => c.number),
  ];
  expect(numbers).toEqual(expected);
  expect(numbers[0]).toBe(Math.max(...merged.map((c) => c.number)));
});
```

运行确认失败：当前组件按数据原序渲染，merged 组为 PR 号升序。

### Step 6.2 组件实现

`open-source-showcase.tsx` 渲染前构造有序列表：

```tsx
const orderedContributions = [
  ...project.contributions.filter((c) => c.status === "merged").toSorted((a, b) => b.number - a.number),
  ...project.contributions.filter((c) => c.status !== "merged"),
];
```

将 `project.contributions.map(...)` 换成 `orderedContributions.map(...)`。合并计文案「9 个贡献已合并」等不受影响（按 status 统计，不依赖顺序）。

### Step 6.3 e2e 断言

`home.spec.ts`「thirteen PR links」用例追加首条即最大 merged PR 号的断言（执行时从 `content/site-content.json` 读出 merged 组最大 PR 号字面量，当前为 1226）：

```ts
const firstPr = openSource.getByRole("link", { name: /PR #/ }).first();
await expect(firstPr).toHaveTextContent(new RegExp(`PR #1226`));
```

### Step 6.4 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test'
/bin/zsh -lc 'npx -y playwright test tests/e2e/home.spec.ts'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts -g "open source" --update-snapshots'
git add -A && git commit -m "feat: sort contributions merged-first and newest-first"
```

---

## Task 7: 实习卡片忠实 resume 要点 + 压缩空白

**Files:** `content/site-content.json`、`src/test/fixtures.ts`、`src/components/home/internship-story-card.tsx`、`src/components/home/internship-story-card.test.tsx`、`src/app/profile.css`、`src/app/globals.css`、`tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: 各 internship 的 `actions` 字段（已含 resume 全量要点：京东 5 条、智元 6 条、722 所 3 条）。
- Produces: `highlights` = 各段 resume 要点全量（京东 5 / 智元 6 / 722 所 3），组件不再截断；页面 section 纵向空白压缩约 35%。

### Step 7.1 数据层（要点全量化）

`content/site-content.json`：把每段 internship 的 `highlights` 数组替换为同段 `actions` 数组的原文（京东 jd：5 条；智元 agibot：6 条，覆盖 clip-player 3 条 + agibot_retriever 3 条；722 所 cssc：3 条）。`projects` 子结构与 `results` 字段保持不变。`src/test/fixtures.ts` 的 internships 构造同步更新 highlights 长度（5/6/3）与内容。

### Step 7.2 写失败单测

`internship-story-card.test.tsx`「renders highlights as capability records」用例改为：

```tsx
const recordItems = card.getAllByRole("listitem");
expect(recordItems).toHaveLength(internship.highlights.length);
for (const [index, item] of recordItems.entries()) {
  expect(item).toHaveTextContent(internship.highlights[index]);
}
```

若原测试 fixture 的 internship 只有 3 条 highlights，改用 5 条的 fixture 数据。另加用例：智元卡片断言 6 条且同时包含 clip-player 与 agibot_retriever 相关要点原文。运行 `/bin/zsh -lc 'pnpm test'` 确认失败（组件仍 `slice(0, 3)` 截断）。

### Step 7.3 组件解除截断

`internship-story-card.tsx`：`const capabilityRecords = internship.highlights.slice(0, 3);` → `const capabilityRecords = internship.highlights;`。`results` 展示逻辑同查：若当前仅渲染 `results[0]`，改为渲染全部 results（用 `results.map`，样式沿用 capability-record 列表项）。运行单测通过。

### Step 7.4 空白压缩（浅色基线上的版式收紧）

- `profile.css` 行 70-82 `.profile-stage`：`padding: clamp(4rem, 9vw, 7rem) 1.5rem;` → `padding: clamp(2.5rem, 6vw, 4.5rem) 1.5rem;`
- `profile.css` 行 981 附近 920px 媒体查询内的 `.profile-stage` padding 同步减半（约 `clamp(2.5rem, 7vw, 4rem)` → `clamp(1.75rem, 6vw, 3rem)`）。
- `.profile-stage > h2`（定位：`grep -n 'profile-stage h2\\|profile-stage > h2' src/app/profile.css`）的 `margin: 2.5rem 0` → `margin: 1.75rem 0`。
- 实习卡内部（`.sticky-internship-card` 系、capability 列表 `gap`）允许把间距/内边距在原值基础上收紧 30-40%，但必须以 Step 7.5 的快照肉眼核验为准——条目从 3 涨到 5/6 条，卡内空白收紧后整卡高度应与旧版大致持平或更低。
- `globals.css` `.content-section`（未被首页 section 使用，但被博客/其他页引用）：`min-height: 34rem;` 删除该行；`padding: clamp(6rem, 12vw, 10rem) 1.5rem;` → `padding: clamp(3rem, 8vw, 5rem) 1.5rem;`（行 1038 附近媒体查询内同改）。

### Step 7.5 e2e + 快照

`home.spec.ts`「internships alternate layout」用例内追加：

```ts
const cards = internships.locator("article");
await expect(cards.nth(0).getByRole("listitem").filter({ hasText: "京东" }).or(cards.nth(0).getByRole("listitem").first())).toBeVisible();
```

更直接的做法：按卡片分别断言列表项数量——京东卡 5、智元卡 6、722 所卡 3（`await expect(cards.nth(i).getByLabel(/职责记录|capability/i)).toBeVisible()` 后数 listitem；具体 aria-label 以组件实际渲染为准，执行时读组件确定）。

```sh
/bin/zsh -lc 'pnpm test'
/bin/zsh -lc 'npx -y playwright test tests/e2e/home.spec.ts'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts --update-snapshots'
/bin/zsh -lc 'npx -y playwright test'
git add -A && git commit -m "feat: render full resume highlights and tighten section spacing"
```

---

## Task 8: 高清品牌 logo（官方渠道下载 + 渲染收紧 64-72px）

**Files:** `public/brands/jd.png`、`public/brands/agibot.png`、`public/brands/cssc.png`、`public/brands/tongji.png`、`public/brands/semantica.png`、`src/components/home/brand-mark.tsx`、`src/app/profile.css`、`src/components/home/brand-mark.test.tsx`

**Interfaces:**
- Consumes: 各品牌官方渠道公开 logo（京东 jd.com、智元 agibot.com、中国船舶/722 所官方站点、同济 tongji.edu.cn 校徽、Semantica GitHub 仓库/getsemantica.ai）。
- Produces: `public/brands/` 下同名 PNG（短边 ≥ 512px、PNG 或转 PNG）；`BrandMark` 渲染高度 64-72px。

### Step 8.1 下载高清 logo

对每个品牌：用 web 检索定位官方渠道的高清 logo 直链（官网页眉/官方 GitHub 仓库/学校视觉形象下载页/维基共享资源官方版本），下载到临时目录再统一转换：

```sh
/bin/zsh -lc 'curl -L -o /tmp/brands/jd.raw.png "<官方直链>"'
/bin/zsh -lc 'sips -s format png /tmp/brands/jd.raw.png --out public/brands/jd.png -Z 1024'
```

校验尺寸与体积（逐个执行）：

```sh
/bin/zsh -lc 'sips -g pixelWidth -g pixelHeight public/brands/*.png'
/bin/zsh -lc 'ls -l public/brands/'
```

约束：短边 ≥ 512px（tongji 圆徽两维均 ≥ 512）；`semantica.png` 压至 100KB 以下（`sips -Z 800` 后仍超则 `-Z 640`）；若官方源只有 SVG，则保留 SVG 文件名并同步更新 `site-content.json`/fixtures 中该品牌的 `src`（schema 的 BrandAsset 已允许 `.svg`），`brand-assets.ts` 校验按文件存在性通过，无需改代码。下载不到官方高清源时的降级顺序：维基共享资源官方版本 → 现有文件放大不可接受时保留原文件并在完成报告中说明。

### Step 8.2 渲染收紧

`brand-mark.tsx`：`<Image height={72} width={180} …/>` → `height={56} width={140}`（保持 eager 与既有 className；180×72 与 140×56 比例一致约 2.5:1，不破坏非正方形 logo 的宽高比假设；对 tongji 这类正方形 logo 的展示由 CSS 列宽控制，不在本组件内处理）。

`profile.css`：`.brand-mark`（grep 定位）内边距从 `0.75rem` 收到 `0.5rem`；`.internship-visual-column` / `.sticky-internship-card` 中 logo 容器宽度收窄使实际渲染高度落在 64-72px 区间（执行时以 `pnpm dev` 目测 + 快照校验，目标：logo 视觉高度 ≈ 64-72px，比旧版明显缩小但清晰）。

`brand-mark.test.tsx` 若有尺寸相关断言则同步（多数断言 src/alt/aria，尺寸非断言对象时不动）。

### Step 8.3 验证 + 提交

```sh
/bin/zsh -lc 'pnpm test && pnpm build'
/bin/zsh -lc 'npx -y playwright test'
/bin/zsh -lc 'npx -y playwright test tests/e2e/visual.spec.ts --update-snapshots'
git add -A && git commit -m "feat: upgrade brand logos to HD sources and tighten render size"
```

（「brand marks load eagerly」e2e 用例断言 4 枚 `.brand-mark img` 且 eager——数量不变，天然通过。）

---

## Task 9: 全量验证 + 生产发布

**Files:** 无新文件；产出验证证据与生产部署。

### Step 9.1 本地全链验证

```sh
/bin/zsh -lc 'pnpm lint && pnpm typecheck && pnpm test && pnpm build'
/bin/zsh -lc 'npx -y playwright test'
```

任何一步失败即停下修复，禁止带病推进。

### Step 9.2 视觉人工核验

`/bin/zsh -lc 'pnpm dev'` 起本地服务，浏览器逐区检查：hero / 信息区 / 实习区 / 系统区 / 开源区 / 写作区 / 联系区 —— 全部浅黄暖底、无深色残留块、无双校徽错位、shields 徽章与 stars 文字在位、logo 清晰且高度 64-72px。发现残留回对应 Task 修复后重跑 Step 9.1。

### Step 9.3 提交收尾并推送

```sh
/bin/zsh -lc 'git add -A && git commit -m "chore: refresh visual baselines after light theme rollout" --allow-empty'
/bin/zsh -lc 'git push'
```

### Step 9.4 生产部署

```sh
/bin/zsh -lc 'npx -y vercel deploy --prod'
```

**绝不执行 `vercel link`**（会重写 .vercel 项目绑定）。构建产物 URL 应为 `https://jiangjunjie-personal-portal.vercel.app`。

### Step 9.5 线上验收

```sh
/bin/zsh -lc 'curl -s https://jiangjunjie-personal-portal.vercel.app | grep -o "faf3e3\\|img.shields.io/badge\\|GitHub Stars\\|tongji.png" | sort | uniq -c'
```

预期输出同时包含 `faf3e3`（浅色 token 已进产物）、`img.shields.io/badge`（徽章）、`GitHub Stars`（stars 文案）、`tongji.png`（校徽 ≥ 2 次出现）。再浏览器打开生产 URL 做最终目测（对照 spec 验收标准逐条勾验）。

---

## 自审清单（执行者完成后逐条确认）

1. spec 六项（A-F）每项至少被一个 Task 覆盖，且终态与 spec 的 7 条验收标准一致。
2. `grep -rn 'academicHonors\|HonorGallery\|honor-gallery\|OpenSourceSpotlight\|open-source-spotlight' src content tests README.md` 输出为空。
3. `pnpm build` 通过（含 validate-content：品牌文件存在非空、schema 恰好 13 条贡献/9 merged、starsSnapshot 合法）。
4. 所有快照基于浅色基线提交；`git status` 干净。
5. 计划内无占位符（`TODO`/`...`/`<待定>` 均不允许出现在被提交代码中）。

## 执行选项

计划完成后二选一执行：
- **Subagent-Driven**（推荐）：逐 Task 分派实施者 + 独立审查者，按 Global Constraints 的 shell 约令执行。
- **Inline**：使用 executing-plans 技能在本会话按 Task 顺序执行。


