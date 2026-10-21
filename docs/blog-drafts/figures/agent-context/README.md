# Agent 上下文工程配图

四张图使用本地 `excalidraw-diagram` Skill 绘制，采用手绘线条、白底与语义配色。技术关系依据文章及李博杰《深入理解 AI Agent：设计原理与工程实践》v2.0 第二章；图中的代码修复事件、路径和状态值为教学示例。

| 文件 | 文章位置 | 重点 |
| --- | --- | --- |
| `context-cycle.excalidraw` | 第 1 节 | 稳定规则、执行历史与模型调用循环 |
| `prefix-cache.excalidraw` | 第 2 节 | 变化点前后的缓存复用范围 |
| `state-projection.excalidraw` | 第 4 节 | 事件统计、事实与假设分离、证据回查 |
| `context-compaction.excalidraw` | 第 5 节 | 任务摘要、外部证据与噪声清理 |

`.excalidraw` 为可编辑源文件，同名 `.svg` 为渲染导出。文章使用 `public/blog/agent-context/` 下的 PNG，并支持点击打开大图。PNG 宽度为 2300 像素，正文通过 Next.js Image 输出适配尺寸。

渲染后应检查文字边界、箭头连接及来源关系。修改 SVG 导出前，优先修改对应 Excalidraw 源文件以保持一致。
