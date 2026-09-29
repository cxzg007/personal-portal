# 工程作品展：桌面验收

日期：2026-09-29。旧版 `53cc65140ddae67bcc338574edbc9578302422ea` 已推送到 `design/ui-ux-homepage`；新版分支 `design/engineering-showcase`。

## 完成交付

石墨黑首屏、双栏个人介绍与 Agent 回放、横向经历索引、教育资料带、三张工程示意图、浅色阅读章节和深色联系页尾。保留原实习事实、指标适用条件、维护者身份、PR 快照和来源。博客内容与阅读样式文件没有改动。

唯一新增的主要交互是 Agent 回放示例：播放/暂停/重播、原生 range、阶段跳转、两种权限场景。只读在 75% 阻断，授权到 100%；切换场景重置，拖动暂停，离屏/隐藏页面/卸载清理计时。默认静止，无 JS 时完整呈现并禁用控件。空间场景为 SVG，未增加动画依赖。

## 自动验证

- `node node_modules/vitest/vitest.mjs run`：22 文件、212 测试通过。新增回放单测涵盖场景边界、播放终止、卸载/页面隐藏/离屏、SSR；英雄区测试先失败再实现通过。
- ESLint、`tsc --noEmit`、`git diff --check` 均通过。
- 内容校验通过（4 个系统架构），生产构建通过（9 个静态页面）。测试构建使用 `NEXT_PUBLIC_SITE_URL=https://portfolio.example.test`。
- Chromium 功能验收：77 通过，5 个窄屏首页布局测试按用户要求明确暂缓。包含键盘顺序、权限和进度、禁用 JS、200% 字号、锚点/详情/Tabs/PR、WCAG A/AA、博客导航和样式隔离。
- Chromium 视觉复验：9 通过，1 个仅平板/手机首页快照按项目条件跳过。人工查看后更新 7 张桌面首页基线；2 张桌面博客基线未变。
- 平板和手机博客视觉：4 项通过，基线未改。博客各尺寸阅读检查亦在 Chromium 功能集内通过。

本轮不声明手机首页完成，不更新手机/平板首页快照。验收命令：

```sh
PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test --project=chromium --grep-invert 'visual|homepage overflow regression' --workers=4
PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test tests/e2e/visual.spec.ts --project=chromium --workers=2
PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test tests/e2e/visual.spec.ts --project=tablet --project=mobile --grep 'blog index visual|article detail visual' --workers=2
```

## 人工检查与独立审查

查看 1280×800、1440×900、1920×1080 首屏与全页、只读阻断状态；1280 首屏姓名和主操作可见。200% 字号曾暴露回放阶段的 nowrap/min-content 溢出；改为可收缩网格与标签换行后通过。无 JS 说明由真实浏览器可见性确认，测试使用 `noscript p`，因为 Playwright 文本选择器忽略 noscript。

独立只读审查结论：可进入 Preview，无新增 Critical/Important。实测三个桌面尺寸及 200% 字号无溢出、离屏暂停、路由往返重置、博客字体/颜色/行高一致、reduced-motion 没有活动动画，浏览器无异常。既有 Minor：技术博客内外 region 同名造成全规则 Axe landmark-unique；基线已有，未在本轮扩展范围处理。

截图与完整日志位于忽略入库的 `.superpowers/showcase-review/`。主目录的未完成联系后端未混入；tracked diff SHA256保持 `afd747c811249dc85d7bd15a19b0f092f4b404a26a0da7b96f28f0a22b5317a7`。

## 发布边界

保存新分支并发布独立 Preview。正式域名继续指向旧版，等用户查看后再决定切换。首页规范见 `design-system/personal-portal/pages/homepage.md`。

## 保存与预览结果

- 实现提交：`a0a680e9b6e2ed8c850f5d5582a16edaa0df2326`，远程 `design/engineering-showcase` 已确认。此前还包含回放组件提交 `d95b8d3`、`6bead07`。
- 旧分支远程仍为 `design/ui-ux-homepage@53cc65140ddae67bcc338574edbc9578302422ea`。
- Vercel 独立 Preview：`dpl_8RLeUXaJSx9veF4y5XiyonsXjTYR`，READY，构建成功。地址：`https://jiangjunjie-personal-portal-o8vt5ojeb-junjie1467-6343s-projects.vercel.app`。
- 此项目的 Preview 启用了 Vercel 登录保护；未登录请求跳到登录页，CLI curl 同样收到 302。未改动保护配置，因此云端页面交互未做未经登录的验证；上述浏览器功能与视觉验收均基于本地生产构建。
- 本地生产预览：`http://127.0.0.1:3103`。主页、博客列表、两篇正文生产浏览器检查均无 console error/pageerror。
- 正式域名 `https://jiangjunjie-personal-portal.vercel.app` 实测 200，h1 仍为 `cxzg007`、没有新回放组件，证实未切换正式站。
- 截图辅助逻辑已等待回放控件完成水合后再截图，避免 Playwright 注入 caret 样式时与水合竞争；9 项桌面视觉再次通过，基线无需再改。
