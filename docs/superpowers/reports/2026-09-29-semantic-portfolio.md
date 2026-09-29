# 语义工程作品页：验收记录

日期：2026-09-29。旧版 `design/engineering-showcase@9c41dffe109947e726a0fc31ecb1366c1bf7727e` 已先推送保留；本轮工作全部位于隔离工作树 `.worktrees/ui-ux-homepage` 的 `design/semantic-portfolio`。

## 已实现

页面统一浅灰绿画布，教育资料带与联系区使用相近浅色，首屏深色回放变成独立面板。主标题“从业务语义，到可靠执行。”，京东实习与开源贡献是主要入口。导航和章节同步改为实习、开源、系统、博客、联系，京东实习标题突出。

回放以虚构供应商资质审核说明本体与规则平台的执行思路。保留播放、暂停、拖动、重播与阶段跳转；授权完成、只读停在75%、行数异常整批回滚三种结果。异常显示0条变更生效，终点与连线警示；场景切换重置，隐藏、离屏和卸载清理计时。虚构数据与无真实请求均在面板说明。

保留并放大原始 Semantica 品牌图。新增自包含的1440×820 SVG与2880×1640 PNG，三栏展示数据源、语义与上下文层、Agent与应用；独立贡献栏列出规则推理、真值维护、SPARQL与DAG并行。图文说明区分项目能力和个人工作，提供全尺寸入口和README来源。

真实经历、指标、PR数量和核验日期未修改。博客正文与阅读样式未修改；共享导航顺序同步变化。

## 验证

- Vitest：22个文件、214项通过。行数异常测试先出现预期失败（缺场景按钮），实现后11项回放测试通过，涵盖三个终点、重置、拖动暂停、隐藏/离屏/卸载清理与SSR。
- ESLint、TypeScript、内容校验（4个系统架构）、生产构建（9页）与diff空白检查通过。构建使用`NEXT_PUBLIC_SITE_URL=https://portfolio.example.test`。
- Chromium功能：初轮75通过、3失败、5项窄屏首页按用户要求暂缓。两个失败来自新按钮名的模糊匹配，另一个为200%字号下Agent标签超出2px。修复精确定位与阶段装饰间距后，3项失败及4项相关检查全部通过；共78个功能用例得到通过结果。
- 修复复测7项覆盖首屏主操作、reduced-motion、200%字号、整页键盘顺序、只读边界、事务回滚及对比度。
- 桌面视觉：人工检查后更新7张首页基线，复验9通过、1个非桌面快照按配置跳过。桌面博客2张原基线未变。
- 平板/手机博客4张原视觉基线全部通过。博客各尺寸阅读、WCAG A/AA和客户端路由往返的排版隔离在功能检查中通过。
- 三种桌面宽度1280/1440/1920没有横向溢出，主要操作在首屏。1440下200%字体无裁切。SVG在未滚动首页时已加载，图像固有宽高避免布局移动。
- 能力图独立审查：spec通过、quality Approved，无Critical/Important/Minor；来源、品牌、自包含资源与1184/1280显示宽度均检查。

初次Playwright日志含工具环境的NO_COLOR/FORCE_COLOR冲突警告，后续命令用`env -u NO_COLOR`消除。主工作区diff指纹保持`afd747c811249dc85d7bd15a19b0f092f4b404a26a0da7b96f28f0a22b5317a7`，未混入未完成的联系后端。

## 复验命令与证据

```sh
node node_modules/vitest/vitest.mjs run --reporter=dot
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/tsx/dist/cli.mjs scripts/validate-content.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test node node_modules/next/dist/bin/next build
env -u NO_COLOR PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test --project=chromium --grep-invert='visual|overflow regression' --workers=4
env -u NO_COLOR PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test --project=chromium --grep='homepage exposes the campus|reduced motion preference keeps|homepage reflows at 200% text size in a 1440|keyboard seeking|unexpected affected-row|desktop keyboard order|keeps readable contrast' --workers=3
env -u NO_COLOR PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test tests/e2e/visual.spec.ts --project=chromium --workers=2
env -u NO_COLOR PLAYWRIGHT_REUSE_EXISTING_SERVER=1 node node_modules/@playwright/test/cli.js test tests/e2e/visual.spec.ts --project=tablet --project=mobile --grep='blog index visual|article detail visual' --workers=2
```

本地日志：`/tmp/semantic-unit.log`、`/tmp/semantic-build-final.log`、`/tmp/semantic-e2e.log`、`/tmp/semantic-e2e-targeted.log`、`/tmp/semantic-visual-verify.log`、`/tmp/semantic-blog-visual.log`。视觉基线在`tests/e2e/visual.spec.ts-snapshots/chromium`；图像及来源在`public/diagrams`。

## 交付范围

保存并推送新分支，提供本地生产预览3103。正式域名不在本轮切换，手机首页适配按用户要求暂缓。最终整分支审查与推送结果在完成后补录。
