# 2026-08-31 浅色主题与内容精修设计（light-theme-content-refresh）

## 背景与目标

用户提出六项改版需求（视觉参考 https://getsemantica.ai/ 的米黄暖底风格）：

1. 背景色改为浅黄/米色暖底（全站翻转，彻底告别深色主题）
2. 教育经历：本科也显示同济校徽（现仅硕士有）
3. 删除「荣誉与长期积累」整个 section
4. 开源项目 star 数要体现（Semantica 11.4k+ stars）
5. 开源贡献按重要程度排序：merged 在前、open 在后，组内按 PR 号倒序
6. 实习经历重设计：忠于 resume、减少空白、公司 logo 高清化

## 分项设计

### A. 全站浅黄暖底主题

- 参照 getsemantica.ai 米黄纸感配色：
  - 页面底 `--page: #faf3e3`，深底 `--color-bg-deep: #f3ead6`
  - 主文字 `#3d2f1e`（深棕），次要文字 `#7a6a52`
  - amber 主色调整为 `#c47f17`（暗化保证浅底对比度，需通过 accessibility e2e 校验）
  - 面板/卡片底色改为浅米白 + 暖棕描边
- 涉及文件：`src/app/globals.css`（:root 变量与全部硬编码亮色值）、`src/app/profile.css`（亮色文字如 `#fff5e4` 等换深棕）、网格纹理与径向光晕透明度调低
- 视觉快照基线全量重新生成

### B. 教育经历双校徽

- `src/components/home/profile-dock.tsx`：移除 `index === 0` 条件，硕士与本科条目均渲染 36px 同济校徽（`/brands/tongji.png`）
- 同步更新 `profile-dock.test.tsx` 断言（badges 数量 1 → 2）

### C. 删除「荣誉与长期积累」section

- 删除 `src/components/home/honor-gallery.tsx` 及其测试、`src/app/page.tsx` 引用
- 删除 `content/site-content.json` 中对应数据、`src/content/schema.ts` 校验、`src/test/fixtures/site-content.ts` fixtures、e2e 断言（五层联动）
- 首页 metrics 数字条（3 段实习 / 13 PR / 排名 12/62 / 90%）保留不动
- **保留**：开源卡片内的 GitHub Trending #1 / Trendshift #3 徽章，但渲染方式改为 **shields.io 徽章图片**（GitHub README 风格），替代现有自制文字卡片

### D. Stars 展示（文字数字形式）

- `openSource` 数据结构新增 stars 快照字段（`stars: 11400`，快照日期 2026-08-31 叙事一致）
- 构建时请求 GitHub API（`repos/semantica-agi/semantica`）拉取实时 star 数，失败时回退快照值
- 展示形式：文字数字徽章（与现有 contribution-metrics 风格一致，非图片），「11.4k+ GitHub Stars」置于开源卡片头部区域

### E. 开源贡献排序

- 组件层实现排序：merged 组在前、open 组在后；组内按 PR 号倒序（如 #1226 并行化最靠前）
- 数据文件 `site-content.json` 保持原序不改动

### F. 实习经历重设计

- **忠实度**：卡片不再 `highlights.slice(0, 3)` 截断，每段展示 4–5 条要点：
  - 京东 5 条全量上屏（本体绑定生命周期 / 多跳 JOIN / 语义 SQL / 规则链路 / 性能治理）
  - 智元两项目各 3 条（clip-player、agibot_retriever）
  - 722 所 3 条
  - 极小细节可合并压缩
- **空白治理**：
  - `.content-section` 移除 `min-height: 34rem`，`padding-block` 从 `clamp(6rem, 12vw, 10rem)` 缩至约 `clamp(3rem, 8vw, 5rem)`
  - sticky 卡片堆叠间距同步缩小；卡片内部 padding 收紧
- **logo 高清化**：现有素材均为 72dpi 低清（jd.png 139×139、cssc.png 178×75、agibot.png 280×139、tongji.png 140×140），需替换高清源图；semantica.png 1905×617、788KB 需压缩至 <100KB
  - 渲染尺寸收紧至约 64–72px，避免「大而糊」
- 涉及文件：`src/components/home/internship-story-card.tsx`、`sticky-internship-stack.tsx`、`src/app/profile.css`、`public/brands/*.png`

## 风险与联动

- C 项删荣誉触发五层联动（数据 → schema → fixtures → 组件 → 测试），参照此前 contributions 7→13 联动经验
- A 项主题翻转影响全部视觉快照基线（需全量重新生成）与 accessibility e2e 对比度断言
- D 项构建时 GitHub API 需处理超时/限流回退，不阻塞构建
- `scripts/validate-content.ts` 若涉及 honors 字段需同步

## 验收标准

1. 全站呈现米黄暖底浅色主题，文字对比度满足可访问性要求（e2e 通过）
2. 教育经历两条目均有同济校徽
3. 首页不再出现「荣誉与长期积累」section；开源卡片内 shields.io 徽章图片正常显示
4. 开源卡片显示 stars 数（优先实时 API，回退快照 11.4k+）
5. 开源贡献列表 merged 前、open 后、组内 PR 号倒序
6. 实习卡片要点 4–5 条且忠于 resume；无明显大片空白；logo 清晰不 oversized
7. 单测 + e2e + 视觉快照全部通过；生产部署验证