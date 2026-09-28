# 博客内容与阅读版式调整

用户要求：文章分点过碎、内容论证有问题，版式需要与已上线的主页统一。

## 已确定的方向

- 继续使用 `design/ui-ux-homepage` 工作树；保留两篇 slug、标题与发布日期。
- 每篇以一个假设案例串起六个主章节，参考资料独立列出。段落负责解释原因、推导与边界，只保留有必要的代码。
- 图工程篇区分类型层次、数据约束、运行时调度，移除无法核实的综述与绝对化结论。
- Palantir 篇基于 Foundry 官方文档，区分对象索引、Action、外部 webhook 和权限配置，明确案例是设计推演。
- 蓝白配色沿用主页；正文最大 45rem，桌面 18px、移动 17px、行高 1.85。标题使用衬线体，正文使用系统无衬线体。
- 桌面轻量侧栏目录；窄屏原生 details 折叠目录，无 JavaScript 仍可阅读、展开、跳转。
- 博客索引使用单列文章条目，保留搜索、标签、空态恢复与相邻文章导航。

## 实施顺序

1. 核实技术来源并重写 MDX，更新摘要、SEO 摘要和更新时间。
2. 移出 globals.css 的旧博客规则，添加独立作用域样式，调整目录、元信息和代码标签。
3. 更新已有断言与截图，检查正文、长代码、目录跳转、键盘、窄屏和 200% 字号。
4. lint / typecheck / unit / production build / Playwright；实际查看两篇文章和主页联动区域。
5. 审查最终差异，提交、部署到已有 Vercel 项目并验证正式地址。

## 已核实的依据（2026-09-28）

- Next.js 安装包 `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`：全局样式导航后不卸载，因此所有博客样式需要明确作用域。
- Next.js 安装包 `01-app/02-guides/mdx.md`：保留本地 MDX 与 Server Component 渲染。
- W3C OWL 2 Primer：https://www.w3.org/TR/owl2-primer/ — 开放世界、无唯一名称假设；本体推理不等于数据库约束检查。
- W3C SHACL：https://www.w3.org/TR/shacl/ — 使用 minCount/maxCount 对数据图检查显式属性数量。
- Palantir Ontology：https://www.palantir.com/docs/foundry/ontology/overview/ — 对象、关系、动作、函数与权限的操作层。
- Ontology architecture：https://www.palantir.com/docs/foundry/object-backend/overview/ — 对象数据索引、存储、查询及更新管道。
- Action types：https://www.palantir.com/docs/foundry/action-types/overview/ — 定义与提交对象修改、参数、规则与副作用。
- Webhooks：https://www.palantir.com/docs/foundry/action-types/webhooks/ — writeback 在对象修改前；side effect 在对象修改后；外部成功不保证内部成功。
- Permissions：https://www.palantir.com/docs/foundry/action-types/permissions/ — 对象访问、submission criteria 与读写授权共同参与控制，读权限不会自动成为写入控制。

外部材料只作能力与语义边界的依据；补货和代码审查案例、成本判断、实施建议均为文章的工程推演。
