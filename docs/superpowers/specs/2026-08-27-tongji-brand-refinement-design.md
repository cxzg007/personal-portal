# 同济大学品牌精修设计

## 1. 目标与边界

在现有生产站点基础上完成五项品牌精修：绑定个人域名、隐藏简历入口、教育信息精简为「同济大学」、侧栏新增同济校徽徽章区块并引入衬线中文字体、以及完整验收闭环。

本轮不改动页面整体骨架、导航结构与其他既有内容模块；不新增页面路由。

**合规边界**：同济大学校徽与校名受商标保护。本轮使用仅限个人教育背景标识（非商业用途），素材直接取自同济大学官网「学校标识」页（https://www.tongji.edu.cn/xxgk1/xxbs1.htm）。spec 与实现注释中均注明来源与用途。

## 2. A 模块：域名绑定（依赖用户完成购买）

- 用户购买主域 `jiangjunjie.com`。`www.jiangjunjie.com` 为主域免费子域，无需单独购买，DNS 记录免费配置。
- Vercel 控制台添加两个域名：`jiangjunjie.com`（A 记录 / apex）与 `www.jiangjunjie.com`（CNAME），配置 `www` 301 重定向到主域。
- 生产环境变量 `NEXT_PUBLIC_SITE_URL` 由 `https://jiangjunjie-personal-portal.vercel.app` 更新为 `https://jiangjunjie.com`，驱动 metadata、canonical、JSON-LD 与 OG URL。
- 部署沿用现有手动两步流程（push + `vercel deploy --prod`），部署后以新域 curl 验收。
- **外部依赖**：域名购买由用户完成；未购买前该模块不可实施，其余模块不受阻塞。

## 3. B 模块：简历入口隐藏

- 移除页面 UI 中的简历下载链接（侧栏与导航中的简历入口）。
- 保留 `public/resume.pdf` 文件本体、`resume-asset` 构建期校验与 metadata 相关测试，文件仍可经直链访问。
- `tests/e2e/server-rendering.spec.ts` 中针对简历链接可见性的断言同步改写为「UI 不渲染简历链接」；`metadata.spec.ts` 与简历资产校验保持通过。

## 4. C 模块：教育信息精简

- `content/site-content.json` 中 `profile.education[0/1].school` 由「同济大学电子与信息工程学院」改为「同济大学」，major/degree/graduationYear 字段保留不变。
- 侧栏 `profile-dock.tsx` 与个人介绍区 `profile-info.tsx` 的学校展示随数据自动更新为「同济大学」。
- `src/app/page.tsx` 的 JSON-LD `alumniOf` 随 `education.school` 自动更新，无需单独修改。

## 5. D 模块：侧栏徽章区块与衬线字体

### 5.1 校徽素材

- 素材：同济大学官网官方校徽 `badge.png`（140×140 PNG，透明底，三人划龙舟图案），已暂存于主工作区 `brand-assets/`，实施时复制入 worktree `public/`。
- 来源：`https://www.tongji.edu.cn/images/badge.png`（官网「学校标识」页）。
- 显示尺寸约 32–36px，140px 源图提供 4 倍以上分辨率余量，视网膜屏清晰度足够。
- 备选：`logo.png`（258×86，校徽+校名组合）、`name.png`（226×78，校名手写体）同样已暂存，如组合方案需要可选用。

### 5.2 徽章区块设计

- 侧栏教育行重排为徽章区块：左侧校徽图（约 32–36px，圆角处理与现有卡片体系协调）+ 右侧「同济大学」衬线大字（Noto Serif SC，字重约 600）。
- 其下为紧凑层级：专业、学位、毕业年份按现有信息降级排列，字段间距统一收紧，消除当前「斜杠串联」的拥挤感。
- 个人介绍区 `profile-info.tsx` 的学校值同步使用衬线字体渲染，保持两处一致。

### 5.3 字体加载

- 引入 `@fontsource/noto-serif-sc`（思源宋体），本地 npm 包加载，不走 Google Fonts CDN。
- 依赖 `@fontsource` 的 `unicode-range` 中文子集按需加载机制，仅实际用到的字形子集会被下载。
- 字体应用范围仅限「同济大学」等学校相关展示文字，全站正文继续沿用现有 Inter + 系统中文无衬线字体栈，不改变整体版式调性。

### 5.4 色彩

- 同济蓝标准色（C100 M60 Y0 K0，约 `#001F5B`）仅作为徽章区块文字或描边的可选点缀色参考，具体取值在实现时与站点现有深色极简调性协调后确定，不改动全站基础主题。

## 6. E 模块：验收

- 单元/组件测试全量通过（`pnpm exec vitest run`）。
- 生产构建成功（`pnpm build`）。
- e2e 冒烟通过（`pnpm exec playwright test tests/e2e/server-rendering.spec.ts` 及相关套件）。
- 部署后生产验收：新域 `https://jiangjunjie.com` curl 检查 HTML 标题、metadata、JSON-LD `alumniOf` 为「同济大学」；`www` 子域 301 跳转到主域；校徽静态资源可访问（HTTP 200）；简历直链 `public/resume.pdf` 仍可访问且 UI 无入口。