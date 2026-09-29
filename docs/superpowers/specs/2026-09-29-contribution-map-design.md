# Semantica 贡献落点图

用户已批准将贡献落点图加入开源贡献区。沿用线上浅色设计、官方图标、现有贡献主题与 PR 明细；不调整其他主页区块。

图以 Semantica 为根，分为执行与查询、规则与证据、Agent 上下文三个方向，每组两个代表性模块。连线表示贡献归类，不表达运行调用关系或整个项目的归属。原生链接分别进入对应源码和 PR，所有说明默认可见，键盘与无 JavaScript 环境均可访问。

2026-09-29 使用 GitHub PR 元数据的 author、files、mergeCommit/headRefOid 核对六个落点，作者均为 cxzg007。源码固定到核验的提交，开放 PR 使用 head 提交。页面状态复用 `content/site-content.json` 的 2026-09-28 快照，不创建第二套贡献状态。

| 方向 | 模块 | 代表 PR | 变更文件（semantica/ 下） | 源码提交 |
| --- | --- | --- | --- | --- |
| 执行与查询 | Pipeline 执行 | #1226 | pipeline/execution_engine.py | cce5ea177cbac29a526effa546219c48f8ec36f4 |
| 执行与查询 | SPARQL 查询 | #1243 | reasoning/sparql_reasoner.py | 7996d1ab4bd0c96ea7e3d91a4ce70fe5881d224b |
| 规则与证据 | RETE 规则推理 | #1077 | reasoning/rete_engine.py | 0384a8de306477332fabbd2de82d7de157a2c5f0 |
| 规则与证据 | 时态真值维护 | #1675 | reasoning/temporal_truth_maintenance.py | b14a2b8d2f989c8c3deca107a21d1da93ee2a506 |
| Agent 上下文 | 检索证据校验 | #1556 | context/truth_maintenance_filter.py | d46529adb316829bdc75b8467278f3f0ccb310f7 |
| Agent 上下文 | RAG 上下文组装 | #1731（开放） | context/grounded_context.py | 340eb0c31cca25029cbf8bb5fbbec6703645b06b |

架构阅读入口为 https://gitdiagram.com/semantica-agi/semantica ，仅作为外部参考。本站图根据 PR 文件归属整理，不声称由 GitDiagram 生成或是完整架构。

实现使用 Server Component、CSS Module 和语义化嵌套列表，无新增依赖。已合并与进行中同时用文字、图形及边框区分。桌面三列；窄屏顺序排列并隐藏跨列连线，不产生横向溢出。

验证覆盖源码与 PR 链接、缺失贡献过滤、状态切换、键盘顺序、无 JS、颜色对比、响应式溢出、视觉截图以及现有内容校验和生产构建。
