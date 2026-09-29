# Semantic Portfolio Implementation Plan

> **For agentic workers:** Use subagent-driven-development for the independent infographic and review; parent integrates the tightly coupled homepage/replay changes. User explicitly authorized starting after saving the old version.

**Goal:** Align the portfolio with JD ontology/rule engineering and Semantica maintenance, unify color continuity, and supply a readable ecosystem image.

**Architecture:** Scoped homepage CSS and existing server components; extend only the existing local replay reducer. One independent static infographic module with standalone SVG/PNG assets. Keep content facts and blog code unchanged.

**Tech Stack:** Installed Next16.3.1 React19 TypeScript, SVG/CSS, Vitest, Playwright.

## Global Constraints

- Worktree `/Users/jiangjunjie.37/personal portal/.worktrees/ui-ux-homepage`, branch `design/semantic-portfolio`, old remote `design/engineering-showcase@9c41dff` preserved.
- Desktop 1280/1440/1920; mobile homepage adaptation deferred by user. Blog isolation remains mandatory.
- Palette #f4f7f6 / #20383f / #5b6c70 / #126b70 / #e9f0ef. Local dark replay #15232d with blue paths. Existing Space Grotesk and system Chinese type.
- New schema demo is explicitly synthetic, no real external actions; existing metrics and PR snapshot dates unchanged.
- Read installed Next docs before component edits. Preserve original Semantica image/icon rather than substituting generic initials.

### Task 1: Original Semantica ecosystem image

**Files:** create `public/diagrams/semantica-context-layer.svg`, `.png`, `README.md`; create `src/components/home/semantica-ecosystem.tsx`, `.module.css`. Touch only these files. No parent integration, no other edits or commits outside owned paths.

**Interface:** `export function SemanticaEcosystem({ repositoryUrl }: { repositoryUrl: string }): React.JSX.Element`. Parent inserts below project overview and above personal contributions. Static server component, no new JS interactivity. Render the SVG in a real image with intrinsic1440x820 dimensions (may tune ratio with parent notification); image is full container width and capped only by container1280. Figure accessible name `Semantica 语义与上下文能力图`; concise alt/figcaption distinguishes general capabilities from personal work; one link `查看完整能力图` opens local standalone SVG in a new tab; optional PNG asset available but no extra UI link. Source link can point to provided repositoryUrl and must be labelled `能力图来源：项目 README`.

- [ ] Create a polished original three-column SVG, optionally scripted generation, no added runtime dependency. User reference `/Users/jiangjunjie.37/.joycode/attachments/01a0d180-f1b3-7f82-ab30-2f44b76b962e/4214c972f9b67b75859d531ec806fd21856c58353fe25c915db435916b0198cd.png`. Read it visually. Style pale ivory/teal within shared tokens, rounded fine borders, gentle deterministic curves, real Semantica central wordmark (`public/brands/semantica.png`, embed base64 for self-contained image). Important image text should be >=18–22px at SVG1440 width, no tiny dense captions.
- [ ] Source evidence: parent fetched upstream README to `/tmp/semantica-readme-20260929.md`; it verifies ingestion files/db/Databricks/Snowflake/SAP/streams, ontology OWL SHACL SKOS, context graph, Rete/Datalog/SPARQL, provenance, REST/MCP/CLI and agent integrations. Use representative groups rather than logos of every vendor. Do not use Salesforce unless separately verified. Left4 nodes `文档与文件`,`关系数据库`,`企业数据平台`,`事件与 API`; center4 or5layers combining `接入与抽取`,`上下文图`,`本体与语义`,`规则推理`,`溯源与决策`; right3 nodes `Agent 上下文`,`检索与问答`,`可审计决策` with context/MCP, RAG/query, provenance text. Add access strip MCP / REST / SDK / CLI. No claim all platform modules are my work.
- [ ] Personal contribution footer visually distinct labelled `我的贡献重点` and four exact themes `规则推理`,`真值维护`,`SPARQL 查询`,`DAG 并行` from content/site-content.json. Avoid percentage or unverified new metrics.
- [ ] Export SVG and PNG for actual image asset. Use system browser screenshot or available conversion tools; do not install dependencies without need. Self-contained SVG must work directly in a new tab. Review at displayed width1184/1280, verify text not clipped, no external network requests from SVG.
- [ ] Implement static figure with intrinsic dimensions, one full-size link and source link, no page styling leakage. Native image via Next Image unoptimized with alt and fixed intrinsic dimensions is acceptable; read Next image docs. No tests mirroring fixed text: image is reversible visual work; validate visual/XML plus lint/tsc for component.
- [ ] Commit only owned files and report exact SVG dimensions, path, source evidence, screenshot, checks and any concerns.

### Task 2: Page emphasis, theme and semantic execution demo

**Files:** `src/app/page.tsx`, `src/app/showcase.css`, `src/components/home/{profile-hero,open-source-showcase}.tsx`, `src/components/shell/header.tsx`, `src/components/home/agent-replay/*`, affected unit/E2E tests.

- [ ] Extend replay tests first: select `行数异常`, seek100, assert `整批写回已回滚` and no success; switching back normal resets0. Use real reducer/component state, existing fake timers for cleanup.
- [ ] Extend `ReplayScenario` with `conflict`; end remains100, readonly75. Projection `rolledBack = state.scenario === 'conflict' && progress ===100`; outcome text and event `TRANSACTION_ROLLED_BACK`; scene final node warning. Existing scenarios keep stop/reset logic.
- [ ] Replace generic review copy with 5 semantic stages (Agent任务、本体映射、规则编译、执行校验、事务写回). Synthetic task资质审核; result normal `风险标记已写回（示例）`; readonly no write; conflict mismatch updates0 in atomic transaction. No external calls.
- [ ] Implement light continuous hero/contact and contrasting inset panel; scope colors. Main h1 `从业务语义，到可靠执行。`, primary anchors JD/#open-source, maintain GitHub. Highlight real JD/Semantica work. OpenSource follows internships; nav and keyboard tests match.
- [ ] Integrate Task1 figure; show existing logo at readable size, preserve alt. Update affected assertions for semantic names and landmarks. Avoid long test mirror of visual rules; use browser acceptance.

### Task 3: Verify and deliver

**Files:** affected `tests/e2e`, desktop visual baselines, design-system page, report.

- [ ] Unit/lint/tsc/content/build pass. Test three scenario endpoints, seeking reset/cleanup, full keyboard order, WCAG A/AA, noJS, 200% desktop type.
- [ ] Desktop screenshots1280/1440/1920 inspect before refreshing seven homepage snapshots. All blog snapshots remain unchanged. Verify SVG/PNG in browser and logo visible, new section order.
- [ ] Independent review for spec/quality; resolve actual defects and rerun affected checks.
- [ ] Save commits and push new branch, preserve previous remote checkpoint; local production preview3103. Record tests/preview/limitations. No production promotion.
