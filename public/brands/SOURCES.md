# Brand Asset Sources

Retrieval date: 2026-08-21

## jd.png

- Source document: user-provided resume PDF (`resume(2).pdf`, page 1).
- Extraction method: the JD mark in the source PDF is a vector graphic (no embedded image stream). The page was rendered with `pdftoppm -r 600` and the mark's red bounding box (x 330-462, y 3547-3679 on the 600 dpi render) was cropped with 3 px padding and re-encoded as PNG (`139x139`, RGB).
- Unaltered except file extraction/format preservation.

## agibot.png

- Source document: user-provided resume PDF (`resume(2).pdf`, page 1).
- Extraction method: original image stream extracted unchanged with `pdfimages -png` (output `resume-003.png`, `280x139`).
- Unaltered except file extraction/format preservation.

## cssc.png

- Source document: user-provided resume PDF (`resume(2).pdf`, page 1).
- Extraction method: original image stream extracted unchanged with `pdfimages -png` (output `resume-005.png`, `178x75`).
- Unaltered except file extraction/format preservation.

## semantica.png

- Source repository: https://github.com/semantica-agi/semantica (`Semantica Logo.png` at repository root).
- Unaltered except file extraction/format preservation.

## tongji.png

- File: public/brands/tongji.png
- Brand: 同济大学校徽（Tongji University seal）
- Source: https://www.tongji.edu.cn/xxgk1/xxbs1.htm （同济大学官网「学校标识」页）
- Extraction method: 下载官网公开提供的透明底 PNG 校徽（140x140），重命名为 tongji.png
- License/usage: 官网公开标识，仅用于本站「教育背景」个人标识，非商业用途
- Retrieved: 2026-08-28

The resume portrait and private resume text are intentionally excluded from these public assets.