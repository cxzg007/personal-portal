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

- Source document: user-provided resume PDF (`resume(2).pdf`, page 1).
- Extraction method: original image stream extracted unchanged with `pdfimages -png` (output `resume-005.png`, `178x75`).
- Unaltered except file extraction/format preservation.

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

The resume portrait and private resume text are intentionally excluded from these public assets.