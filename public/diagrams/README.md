# Semantica 语义与上下文能力图

本目录中的图像是为个人主页重新绘制的中文能力示意图。三栏分别说明数据来源、Semantica 项目语义与上下文能力，以及 Agent 和应用场景。连接线表达能力之间的关系，不代表连接器必须经过某个固定模块的执行顺序。

## 文件与使用

- `semantica-context-layer.svg`：1440 × 820，完整中文文本与矢量图形，可直接在浏览器中打开。
- `semantica-context-layer.png`：2880 × 1640，以 2 倍像素密度导出，适合下载或放入文档。
- 页面组件：`src/components/home/semantica-ecosystem.tsx`，用 `next/image` 的 `unoptimized` 模式渲染 SVG，并声明 1440 × 820 固有尺寸。图像随容器等比缩放。

SVG 只内嵌项目既有的 `public/brands/semantica.png` 品牌图片；没有远程图片、字体、样式、脚本或其他网络依赖。字体使用系统中文无衬线字体回退，因此不同系统的字形可能略有差异。PNG 固定保留导出时的排版。

## 内容依据与归属

项目能力根据 2026-09-29 获取的 [Semantica 上游 README](https://github.com/semantica-agi/semantica/blob/main/README.md) 概括。制作时使用的本地快照为 `/tmp/semantica-readme-20260929.md`。上游后续可能更新；本图不是全部模块、后端或供应商的穷举。

该快照 SHA-256：`b612dae0ded8621c24def853b00ae30de12f465a36a1ce51597c479420c3bf1d`。

| 图中内容 | README 依据 |
| --- | --- |
| 文档与文件、关系数据库、企业数据平台、事件与 API | `Architecture` 的 Ingest（约第 179 行）列出 files、web、databases、Databricks、Snowflake、SAP、streams 等；`What Semantica Gives You` 描述企业连接器。 |
| 接入与抽取、上下文图 | `Architecture`（约第 174–185 行）说明解析、归一化、实体关系抽取、去重和知识图构建；开篇 Context Graph 描述说明业务上下文。 |
| 本体与语义 | 项目定位（约第 69 行）与能力说明（约第 93 行）列出 OWL、SHACL 和 SKOS。 |
| 规则推理 | 确定性推理说明（约第 95 行）及 `Architecture` 列出 Rete、Datalog、SPARQL。 |
| 溯源与决策、可审计决策 | 项目定位与 `Architecture` 说明来源证据、W3C PROV-O、决策记录和执行轨迹。图中“决策解释”指系统级决策证据，不指解释模型内部思维过程。 |
| Agent 上下文、检索与问答 | `Integrations`、`MCP Server` 与 Context Graph / GraphRAG 相关说明；图中保留通用应用类别。 |
| MCP、REST、SDK、CLI | `Integrations`、`MCP Server`、`REST API`、`CLI` 及 Python 包使用示例。SDK 指 Python 包的编程调用方式。 |

Semantica 品牌图标和字标沿用仓库中的真实品牌资产，原始来源及处理说明见 `public/brands/SOURCES.md`。本图其他节点图标、布局与连接曲线为原创绘制。

“我的贡献重点”以独立底栏与项目能力区分，四项为：**规则推理、真值维护、SPARQL 查询、DAG 并行**。它们概括主页 `content/site-content.json` 中已有的个人工作，不表示所有平台模块、数据连接器或集成均由个人完成，也不新增未经核实的指标。

## 验证

- XML 解析通过；SVG 的 `<title>` 和 `<desc>` 提供图名与关系描述。
- 在 Chrome 中以 1184px、1280px 展示宽度检查；节点文本边界均在卡片内，SVG 内最小字号 18px。
- 直接打开独立 SVG 时，外部 HTTP/HTTPS 请求数为 0。
- PNG 由同一 SVG 在 Chrome 中以 2 倍像素密度生成；修改 SVG 后应重新导出 PNG。
