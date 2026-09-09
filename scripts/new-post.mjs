#!/usr/bin/env node
/**
 * 创建新博客文章脚手架：pnpm new:post <slug>
 *
 * 1. 校验 slug（小写字母/数字/连字符，与 src/content/posts.ts 的规则一致）。
 * 2. 在 content/posts/<slug>.mdx 生成合法 frontmatter 模板。
 * 3. 打印需要在 src/content/posts.ts 的 postLoaders 中登记的一行动态 import。
 */

import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];

if (!slug) {
  console.error("用法：pnpm new:post <slug>  （例如 pnpm new:post agent-memory-design）");
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`无效 slug "${slug}"：只允许小写字母、数字和连字符，且不能以连字符开头/结尾。`);
  process.exit(1);
}

const postsDir = path.join(process.cwd(), "content", "posts");
const target = path.join(postsDir, `${slug}.mdx`);

if (fs.existsSync(target)) {
  console.error(`已存在：${path.relative(process.cwd(), target)}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

const template = `---
title: "文章标题"
description: "一句话摘要，用于博客列表与首页写作区。"
seoDescription: "面向搜索引擎的描述，控制在 120 字以内。"
publishedAt: ${today}
updatedAt: ${today}
tags:
  - Agent 工程
featured: false
draft: true
---

## 第一个小节

在这里开始写作。二级/三级标题会自动进入文章目录（TOC）。

## 第二个小节

完成后把 frontmatter 的 \`draft: true\` 改为 \`false\`（或删除该字段）即可发布。
`;

fs.mkdirSync(postsDir, { recursive: true });
fs.writeFileSync(target, template, "utf8");

console.log(`已创建：${path.relative(process.cwd(), target)}`);
console.log();
console.log("下一步：在 src/content/posts.ts 的 postLoaders 中登记加载器：");
console.log();
console.log(`  "${slug}": () => import("../../content/posts/${slug}.mdx"),`);
console.log();
console.log("登记后运行 pnpm test -- src/content/posts.test.ts 校验目录与注册表一致。");