# Brand Asset Sources

Retrieval date: 2026-08-21

## jd.png

- Source: 京东集团官网（corporate.jd.com）页眉 logo，官方 CDN 直链
  https://storage.360buyimg.com/jdw-asserts/galaxy/jdei/fin-inv-joygen-app-1778478020444/0d59b61c-096a-447b-b441-9d211b478531/dist/assets/main-logo-new-ad105c5c.jpg
- Extraction method: 下载原图（8000x4500 JPG，白底横版），用 PIL 检测内容边界并裁剪掉白边（内容区约 4555x592），等比缩放至短边 512，输出 3905x512 PNG（调色板优化，172KB）。
- Retrieved: 2026-08-31（替换原简历 PDF 提取的 139x139 低清版本）

## agibot.png

- Source: 智元机器人官网（agibot.com）首页静态资源
  https://www.agibot.com/public/static/index/en/images/indexOne-logo.png
- Extraction method: 下载原图（3000x1077 PNG，白底），用 PIL 检测内容边界并裁剪白边（内容区约 1368x255，加少量留白），输出 1476x275 PNG（86KB）。注：短边 275 低于 512px 目标，因官方源内容区即为超横版 logo，上采样只会引入模糊，且对 64-72px 渲染高度分辨率充足（约 4x）。
- Retrieved: 2026-08-31（替换原简历 PDF 提取的 280x139 版本）

## cssc.png

- Source: Wikimedia Commons `File:CSSC logo.svg`（中国船舶集团官方字标，矢量版）
  https://commons.wikimedia.org/wiki/File:CSSC_logo.svg
  原始 SVG 直链：https://upload.wikimedia.org/wikipedia/commons/3/3c/CSSC_logo.svg
- License: 公有领域（PD-textlogo，简单文字/字形标志，低于独创性门槛）。
- Extraction method: 下载官方 SVG（viewBox 3109.86x811.27，单 path，fill #034388），用 sharp（内置 librsvg）按 viewBox 原尺寸光栅化为 3110x811 RGBA 透明底 PNG（134KB），再经 sips 保持格式写出。短边 811 ≥ 512px 达标。经与旧图（pdfimages 从简历 PDF 提取的 178x75）做墨色直方图（同为 #034388 系）与字形结构（ASCII art 内容盒）对比，确认为同一标志设计，属升级而非更换。
- Retrieved: 2026-09-01（替换原简历 PDF 提取的 178x75 低清版本）

## semantica.png

- Source repository: https://github.com/semantica-agi/semantica (`Semantica Logo.png` at repository root).
- Extraction method: 重新下载原图（1905x617，白底），用 PIL 裁剪白边（内容区约 1709x382），等比缩放至宽 640，调色板优化输出 640x143 PNG（52KB，满足 ≤100KB 约束）。短边 143 低于 512px 目标：为满足体积约束按简报降级链 `-Z 800` → `-Z 640` 执行，对 64-72px 渲染高度分辨率仍约 2x 充足。
- Retrieved: 2026-08-31（替换原 788KB 超大版本）

## tongji.png

- File: public/brands/tongji.png
- Brand: 同济大学校徽（Tongji University seal）
- Source: https://www.tongji.edu.cn/xxgk1/xxbs1.htm （同济大学官网「学校标识」页）
- Extraction method: 下载官网公开提供的透明底 PNG 校徽（140x140），重命名为 tongji.png
- License/usage: 官网公开标识，仅用于本站「教育背景」个人标识，非商业用途
- Retrieved: 2026-08-28
- HD upgrade attempt (2026-09-01, fix round): 按简报降级链尝试获取 ≥512x512 方徽，全部渠道均未找到更高清的官方版本，按降级链保留原 140x140 文件。已尝试并排除的来源：
  1. 同济官网「学校标识」页（xxbs1.htm）badge.png —— 即当前文件本身（140x140，13430 字节）。
  2. 同济精神文明网（tjwm.tongji.edu.cn/tjbs.htm）`images/badge.png` —— 与当前文件完全同源（同为 13430 字节 140x140）。
  3. 「印象同济·同济LOGO与校园地图」专题页（photo.tongji.edu.cn/zt/tjLOGOyxydt.htm）—— 页面图片懒加载，HTML 源码中无校徽独立下载资源，站头仅 394x62 横版 logo。
  4. 同济英文官网（en.tongji.edu.cn）—— 未发现任何 png/svg 校徽资产。
  5. Wikimedia Commons —— `Tongji University logo/seal` 常见命名 4 个候选文件均 missing；全站搜索（srnamespace=6）579 条结果均为校园照片，无标志文件。
  6. 英文维基百科 API 附件命名空间 —— `File:Tongji University Logo.png` / `File:Tongji University logo.svg` / `File:Tongji University seal.svg` 三候选均 missing。
  7. 搜索引擎（官方源过滤）—— 无官方高清命中，仅有图库/素材站的付费 CDR/AI 素材（非官方、许可不明，不可用）。
  结论：140x140 官方原版是可获得的最佳来源，对 64-72px 渲染高度分辨率约 2x，仍属可用，故按降级链保留并在此文档化。

The resume portrait and private resume text are intentionally excluded from these public assets.