# Brand Narrative Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the live recruiting portfolio into a warm, branded engineering narrative led by `cxzg007`, with company-branded internships and a dedicated Semantica open-source spotlight.

**Architecture:** Keep all factual public copy in the existing validated local JSON boundary and render semantic server HTML first. Add small reusable brand and journey primitives, keep internship disclosure state isolated in its current client component, keep WebGL behind the existing dynamic scene loader, and extend the single homepage scroll-enhancement boundary for optional motion. No runtime GitHub requests, CMS, or new state-management dependency are introduced.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, CSS, React Three Fiber / Three.js, Vitest + Testing Library, Playwright, axe-core, pnpm 10.34.5, Vercel.

## Global Constraints

- Read `AGENTS.md` and the relevant local Next.js 16 documentation under `node_modules/next/dist/docs/` before changing Next.js or image behavior.
- Use Node.js `^22.22.2 || ^24.15.0 || ^26.0.0` and pnpm `10.34.5`; do not change package manager or add a UI dependency.
- Treat the untracked workspace source resume `../../resume(2).pdf` and confirmed public sources as factual boundaries; do not invent metrics, business scale, launch impact, ownership, or maintainer status.
- Make `cxzg007` the largest hero identity and keep `江俊杰 / Jiang Junjie`, target role, two education rows, recruiting status, and all primary actions visible.
- Use deep charcoal, amber, coral, and warm off-white globally; company/project brand colors stay scoped to their cards.
- Use local static brand assets with accurate alt text; do not redraw, stretch, recolor, or hotlink logos.
- Optimize 1440x900 and 1920x1080 desktop layouts; retain complete, usable, overflow-free 390px output without new complex mobile motion.
- Respect `prefers-reduced-motion`; reduced-motion output contains no Canvas and no scroll-linked state listeners.
- Preserve keyboard order, visible focus, WCAG 2.1 A/AA, semantic lists, disclosure state, blog bundle isolation, static generation, canonical metadata, RSS, sitemap, robots, and the sanitized public PDF.
- Keep `NEXT_PUBLIC_SITE_URL` / `VERCEL_PROJECT_PRODUCTION_URL` production behavior unchanged.
- Every task follows RED -> GREEN -> refactor, runs its focused gate, and ends in a focused commit.

---

## File Structure Map

**Create**

- `public/brands/jd.png` — exact official JD mark extracted from the user-provided resume asset.
- `public/brands/agibot.png` — exact official AGIBOT mark extracted from the user-provided resume asset.
- `public/brands/cssc.png` — exact official CSSC mark extracted from the user-provided resume asset.
- `public/brands/semantica.png` — upstream Semantica logo copied from the public repository.
- `public/brands/SOURCES.md` — human-readable source and retrieval record for the four marks.
- `src/lib/brand-assets.ts` — build-time local brand asset integrity assertion.
- `src/lib/brand-assets.test.ts` — brand path and missing-file regression tests.
- `src/components/home/brand-mark.tsx` — reusable accessible `next/image` brand renderer.
- `src/components/home/engineering-journey.tsx` — semantic three-node engineering journey.
- `src/components/home/brand-primitives.test.tsx` — unit coverage for brand mark and journey semantics.
- `src/components/home/open-source-spotlight.tsx` — server-rendered Semantica project, honors, contribution boundary, graph and links.
- `src/components/home/open-source-spotlight.test.tsx` — Semantica content, honor, attribution and link tests.

**Modify**

- `content/site-content.json` — add brand narrative fields, polished internship copy and dedicated open-source content.
- `src/content/schema.ts` — define and validate `BrandAsset`, `JourneyNode`, `InternshipProject`, branded internship fields and `OpenSourceProject`.
- `src/content/schema.test.ts` — reject malformed brand paths, empty alt text, wrong journey lengths, empty highlights and incomplete honors.
- `src/test/fixtures/site-content.ts` — provide valid branded fixture data.
- `scripts/validate-content.ts` — assert all configured local brand files exist and are non-empty.
- `src/components/home/hero.tsx` and `hero.test.tsx` — technical-name-first identity hierarchy.
- `src/components/scene/agent-network-scene.tsx`, `static-network.tsx` and existing scene tests — warm upward network palette and unchanged fallback/performance contract.
- `src/components/home/internship-timeline.tsx` and `internship-timeline.test.tsx` — branded cards, core headline, journey, highlights and AGIBOT subprojects.
- `src/components/home/case-studies.test.tsx` — expect only the remaining system cases after Semantica moves out.
- `src/components/home/impact-metrics.tsx` — add deterministic metric reveal hooks without hiding SSR content.
- `src/components/home/scroll-enhancements.tsx` and `.test.tsx` — staged brand-story motion and complete reduced/mobile teardown.
- `src/app/page.tsx` — insert dedicated open-source section and keep JSON-LD identity data correct.
- `src/app/globals.css` — warm design tokens, hero identity, brand cards, journeys, open-source graph, desktop layouts and static mobile/reduced-motion rules.
- `tests/e2e/home.spec.ts`, `responsive.spec.ts`, `reduced-motion.spec.ts`, `accessibility.spec.ts`, `visual.spec.ts` — public behavior, overflow, keyboard, motion, and desktop visual regression coverage.
- `tests/e2e/visual.spec.ts-snapshots/**` — reviewed deterministic snapshots for changed surfaces.

---

### Task 1: Validated Brand Narrative Content and Local Assets

**Files:**
- Create: `public/brands/jd.png`
- Create: `public/brands/agibot.png`
- Create: `public/brands/cssc.png`
- Create: `public/brands/semantica.png`
- Create: `public/brands/SOURCES.md`
- Create: `src/lib/brand-assets.ts`
- Create: `src/lib/brand-assets.test.ts`
- Modify: `content/site-content.json`
- Modify: `src/content/schema.ts`
- Modify: `src/content/schema.test.ts`
- Modify: `src/test/fixtures/site-content.ts`
- Modify: `scripts/validate-content.ts`

**Interfaces:**
- Consumes: `validateSiteContent(input: unknown): ValidationResult`; source resume; public Semantica repository.
- Produces: `BrandAsset`, `JourneyNode`, `InternshipProject`, `OpenSourceProject`, extended `Internship`, `SiteContent.openSource`, and `assertValidBrandAssets(content: SiteContent): void`.

- [ ] **Step 1: Read framework and asset constraints**

Run:

```bash
sed -n '1,240p' AGENTS.md
find node_modules/next/dist/docs -iname '*image*' -o -iname '*static*' | sort | head -20
```

Read the matching local Next.js image/static asset guide before selecting `next/image` dimensions or public paths. Expected: local `/brands/...` paths are deployable from `public/` without a remote image host.

- [ ] **Step 2: Write schema and asset-integrity RED tests**

Add mutations like the following to `src/content/schema.test.ts`:

```ts
it.each([
  ["empty logo alt", (copy: typeof validSiteContent) => { copy.internships[0].logo.alt = ""; }],
  ["non-local logo", (copy: typeof validSiteContent) => { copy.internships[0].logo.src = "https://cdn.example/logo.png"; }],
  ["two-node journey", (copy: typeof validSiteContent) => { copy.internships[0].journey.pop(); }],
  ["empty highlights", (copy: typeof validSiteContent) => { copy.internships[0].highlights = []; }],
  ["incomplete honor", (copy: typeof validSiteContent) => { copy.openSource.honors[0].rank = ""; }],
])("rejects %s", (_label, mutate) => {
  const copy = structuredClone(validSiteContent);
  mutate(copy);
  expect(validateSiteContent(copy)).toEqual(expect.objectContaining({ ok: false }));
});
```

Create `src/lib/brand-assets.test.ts` with a temporary missing path and a known non-empty fixture path:

```ts
it("fails when a configured local brand file is missing", () => {
  const content = structuredClone(validSiteContent);
  content.internships[0].logo.src = "/brands/not-present.png";
  expect(() => assertValidBrandAssets(content)).toThrow(/not-present\.png.*missing/i);
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm test -- src/content/schema.test.ts src/lib/brand-assets.test.ts
```

Expected: FAIL because the branded fields, `openSource`, and `assertValidBrandAssets` do not exist.

- [ ] **Step 4: Define exact content interfaces and validation**

Add these public shapes to `src/content/schema.ts`:

```ts
export type BrandAsset = {
  src: `/brands/${string}.${"png" | "svg" | "webp"}`;
  alt: string;
  theme: "jd" | "agibot" | "cssc" | "semantica";
};

export type JourneyNode = { label: string; detail: string };

export type InternshipProject = {
  id: string;
  name: string;
  summary: string;
  highlights: string[];
};

export type OpenSourceProject = {
  name: string;
  logo: BrandAsset;
  identity: string;
  background: string;
  snapshotDate: string;
  honors: Array<{ platform: string; rank: string; period: string; evidence: string }>;
  contributionCount: number;
  mergedCount: number;
  mergedHighlights: string[];
  otherContributions: string[];
  graphNodes: [string, string, string, string, string];
  repositoryUrl: string;
  articlePath: `/blog/${string}`;
};
```

Extend `Internship` with:

```ts
logo: BrandAsset;
valueHeadline: string;
journey: [JourneyNode, JourneyNode, JourneyNode];
highlights: string[];
projects?: InternshipProject[];
```

Add strict runtime checks: local brand path regex, non-empty alt/theme, journey length exactly 3, non-empty labels/details/highlights, optional projects with non-empty highlights, open-source ISO date `YYYY-MM-DD`, non-negative integer counts with `mergedCount <= contributionCount`, two or more honors with complete fields, exactly five graph nodes, HTTPS repository URL, and a `/blog/` article path.

- [ ] **Step 5: Acquire and record exact brand assets**

Use the exact JD, AGIBOT and CSSC marks already embedded in the factual source resume; extract original image streams without redrawing:

```bash
brand_tmp_dir=$(mktemp -d /tmp/portfolio-brands.XXXXXX)
pdfimages -list '../../resume(2).pdf'
pdfimages -png '../../resume(2).pdf' "$brand_tmp_dir/resume"
```

Visually inspect the extracted candidates, select the unchanged logo streams, and copy them to their exact `public/brands/*.png` destinations. Download the unchanged upstream `Semantica Logo.png` from the public `semantica-agi/semantica` repository and save it as `public/brands/semantica.png`. Record source document/repository URL, retrieval date `2026-08-21`, and “unaltered except file extraction/format preservation” in `public/brands/SOURCES.md`. Do not include the resume portrait or private resume text in public assets.

- [ ] **Step 6: Implement build-time file assertions**

Create `src/lib/brand-assets.ts`:

```ts
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { BrandAsset, SiteContent } from "@/content/schema";

function configuredAssets(content: SiteContent): BrandAsset[] {
  return [...content.internships.map(({ logo }) => logo), content.openSource.logo];
}

export function assertValidBrandAssets(content: SiteContent): void {
  for (const asset of configuredAssets(content)) {
    const absolute = path.join(process.cwd(), "public", asset.src.slice(1));
    if (!existsSync(absolute) || statSync(absolute).size === 0) {
      throw new Error(`Brand asset ${asset.src} is missing or empty`);
    }
  }
}
```

Call it from `scripts/validate-content.ts` after `loadSiteContent()`:

```ts
const content = loadSiteContent();
assertValidBrandAssets(content);
assertValidResumePdf();
```

- [ ] **Step 7: Add the approved factual content**

Update `content/site-content.json` with the exact approved identity, three internship value headlines and journeys, JD/AGIBOT/CSSC highlights, two AGIBOT project modules, and `openSource` data. Use these exact honor strings:

```json
[
  {
    "platform": "GitHub Trending",
    "rank": "#1 Repository of the Day",
    "period": "Daily",
    "evidence": "User-provided public ranking screenshot"
  },
  {
    "platform": "Trendshift · Python",
    "rank": "#3 Repository of the Week",
    "period": "Weekly",
    "evidence": "User-provided public ranking screenshot"
  }
]
```

Keep `caseStudies` unchanged in this task so the existing page remains complete; Task 4 moves Semantica out only when the dedicated component is ready.

- [ ] **Step 8: Run GREEN gates**

Run:

```bash
pnpm test -- src/content/schema.test.ts src/lib/brand-assets.test.ts
pnpm exec tsx scripts/validate-content.ts
pnpm typecheck
```

Expected: schema and asset tests PASS; content validation prints `Content validation passed`; typecheck exits 0.

- [ ] **Step 9: Commit**

```bash
git add content/site-content.json public/brands scripts/validate-content.ts src/content/schema.ts src/content/schema.test.ts src/test/fixtures/site-content.ts src/lib/brand-assets.ts src/lib/brand-assets.test.ts
git commit -m "feat: add validated brand narrative content"
```

---

### Task 2: Technical-Name-First Hero and Warm Agent Network

**Files:**
- Modify: `src/components/home/hero.tsx`
- Modify: `src/components/home/hero.test.tsx`
- Modify: `src/components/scene/agent-network-scene.tsx`
- Modify: `src/components/scene/static-network.tsx`
- Modify: `src/components/scene/agent-network-scene.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts`

**Interfaces:**
- Consumes: `SiteContent["profile"]`, existing `SceneLoader`, unchanged performance budget callbacks.
- Produces: H1 `cxzg007`, visible `.hero-real-name`, warm scene palette, unchanged hero region name `江俊杰`, and unchanged primary link contract.

- [ ] **Step 1: Write identity and warm-palette RED tests**

Change the hero unit test to assert:

```ts
expect(screen.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
expect(screen.getByRole("region", { name: "江俊杰" })).toBeVisible();
```

In the scene test, assert that rendered materials receive `#ffb457`, `#ff7a59`, and `#fff2dd`, while the performance monitor still degrades once. Update E2E hero and reduced-motion H1 assertions to `cxzg007` and also assert real-name visibility.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test -- src/components/home/hero.test.tsx src/components/scene/agent-network-scene.test.tsx
```

Expected: FAIL because H1 is still `江俊杰` and scene materials still use cyan/purple.

- [ ] **Step 3: Implement the approved identity hierarchy**

Keep the region labelled by the real identity, but render the technical ID as H1:

```tsx
<section aria-label={profile.name} className="hero">
  <div className="hero-copy">
    <p className="hero-kicker">BUILDING RELIABLE AGENT SYSTEMS</p>
    <h1>{profile.technicalId ?? profile.name}</h1>
    <p className="hero-real-name">{profile.name} / Jiang Junjie</p>
    <p className="hero-role">{profile.targetRole}</p>
    {/* positioning, two education rows, actions and contacts stay semantic */}
  </div>
  <div className="hero-visual"><SceneLoader /></div>
</section>
```

Do not hard-code any private resume phone, political status, origin, or portrait.

- [ ] **Step 4: Introduce warm tokens and hero typography**

At the top token block in `globals.css`, replace the cold primary palette with named warm tokens:

```css
:root {
  --page: #0d0b09;
  --surface: #17120e;
  --surface-strong: #21170f;
  --ink: #fff2dd;
  --muted: #c9b9a7;
  --amber: #ffb457;
  --coral: #ff7a59;
  --amber-rgb: 255 180 87;
}

.hero h1 {
  color: var(--ink);
  font-size: clamp(4.75rem, 11vw, 10.5rem);
  letter-spacing: -0.075em;
}

.hero-real-name {
  color: var(--amber);
  font-size: clamp(1rem, 1.5vw, 1.35rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Use a `@media (max-width: 760px)` override to keep the H1 within the 390px viewport without adding mobile-specific motion.

- [ ] **Step 5: Recolor both scene implementations**

Use exact scene colors:

- amber node/line: `#ffb457`
- coral accent: `#ff7a59`
- warm particle/center: `#fff2dd`
- low emissive brown: `#4b2d1b`

Apply them to point lights, line material, node material and particles in `agent-network-scene.tsx`, and to gradients, rings, nodes and glow in `static-network.tsx`. Preserve geometry counts, render budgets, pointer behavior, performance fallback, ARIA hiding and `data-testid="static-network"`.

- [ ] **Step 6: Run GREEN and page-focused E2E**

Run:

```bash
pnpm test -- src/components/home/hero.test.tsx src/components/scene/agent-network-scene.test.tsx src/components/scene/scene-loader.test.tsx
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/reduced-motion.spec.ts --project=chromium
```

Expected: unit tests PASS; desktop H1 is `cxzg007`; real name and education remain visible; reduced motion has zero Canvas.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/hero.tsx src/components/home/hero.test.tsx src/components/scene/agent-network-scene.tsx src/components/scene/static-network.tsx src/components/scene/agent-network-scene.test.tsx src/app/globals.css tests/e2e/home.spec.ts tests/e2e/reduced-motion.spec.ts
git commit -m "feat: lead hero with warm technical identity"
```

---

### Task 3: Branded Internship Engineering Stories

**Files:**
- Create: `src/components/home/brand-mark.tsx`
- Create: `src/components/home/engineering-journey.tsx`
- Create: `src/components/home/brand-primitives.test.tsx`
- Modify: `src/components/home/internship-timeline.tsx`
- Modify: `src/components/home/internship-timeline.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `BrandAsset`, `JourneyNode`, extended `Internship[]` from Task 1.
- Produces: `BrandMark({ asset, className? })`, `EngineeringJourney({ label, nodes })`, three branded `.internship-card[data-brand]` articles, unchanged disclosure button names and IDs.

- [ ] **Step 1: Write primitive and card RED tests**

Create `brand-primitives.test.tsx`:

```tsx
render(<BrandMark asset={{ src: "/brands/jd.png", alt: "京东官方 Logo", theme: "jd" }} />);
expect(screen.getByRole("img", { name: "京东官方 Logo" })).toHaveAttribute("src", expect.stringContaining("jd.png"));

render(<EngineeringJourney label="京东工程链路" nodes={internships[0].journey} />);
expect(within(screen.getByRole("list", { name: "京东工程链路" })).getAllByRole("listitem")).toHaveLength(3);
```

Extend `internship-timeline.test.tsx` to assert, for every collapsed card:

```ts
expect(within(article).getByRole("img", { name: internship.logo.alt })).toBeVisible();
expect(within(article).getByRole("heading", { name: internship.valueHeadline })).toBeVisible();
expect(within(article).getByRole("list", { name: `${internship.company} 工程链路` })).toBeVisible();
internship.highlights.forEach((text) => expect(within(article).getByText(text)).toBeVisible());
```

For AGIBOT expanded details, assert both `clip-player` and `agibot_retriever` project headings and every project summary/highlight.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test -- src/components/home/brand-primitives.test.tsx src/components/home/internship-timeline.test.tsx
```

Expected: FAIL because the primitives and branded card structure do not exist.

- [ ] **Step 3: Implement reusable semantic primitives**

`brand-mark.tsx` uses `next/image` with a fixed containing box and intrinsic dimensions, not a remote URL:

```tsx
export function BrandMark({ asset, className = "" }: BrandMarkProps) {
  return (
    <div className={`brand-mark brand-${asset.theme} ${className}`.trim()}>
      <Image alt={asset.alt} height={72} src={asset.src} width={180} />
    </div>
  );
}
```

`engineering-journey.tsx` renders one named `<ol>` and exactly three semantic `<li>` nodes; connector SVGs or lines are CSS decoration and `aria-hidden`:

```tsx
export function EngineeringJourney({ label, nodes }: EngineeringJourneyProps) {
  return (
    <ol aria-label={label} className="engineering-journey">
      {nodes.map((node, index) => (
        <li data-journey-step={index + 1} key={node.label}>
          <span>{node.label}</span>
          <p>{node.detail}</p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Refactor each internship card around recruiter-first content**

Keep the current client disclosure state and button semantics. Replace the collapsed body with this order:

```tsx
<header className="internship-brand-header">
  <BrandMark asset={internship.logo} />
  <div>{/* company, team, role, period and status */}</div>
</header>
<h3 id={headingId} className="internship-value-headline">{internship.valueHeadline}</h3>
<EngineeringJourney label={`${internship.company} 工程链路`} nodes={internship.journey} />
<ul aria-label={`${internship.company} 核心贡献`} className="internship-highlights">
  {internship.highlights.slice(0, 3).map((highlight) => <li key={highlight}>{highlight}</li>)}
</ul>
```

Inside expanded details, render `internship.projects` only when present, with each project in its own labelled `<section>`. Preserve business context, actions, ownership, results, stack, button focus after close, and all verified copy.

- [ ] **Step 5: Add scoped company themes and desktop layout**

Use `.internship-card[data-brand="jd"|"agibot"|"cssc"]` custom properties for logo-panel accent only. Apply the global amber border/glow to all cards. At 1440px, use a two-column header and three-column journey; below 920px stack the header and journey; below 760px disable card hover transforms and staged transitions.

Do not recolor logo pixels. Use `object-fit: contain`, stable logo boxes and warm neutral backgrounds that maintain brand contrast.

- [ ] **Step 6: Run GREEN and E2E behavior**

Run:

```bash
pnpm test -- src/components/home/brand-primitives.test.tsx src/components/home/internship-timeline.test.tsx
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts --project=chromium
```

Expected: three branded articles, three logos, three journeys, recruiter-first highlights, both AGIBOT project modules after expansion, and unchanged keyboard disclosure behavior.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/brand-mark.tsx src/components/home/engineering-journey.tsx src/components/home/brand-primitives.test.tsx src/components/home/internship-timeline.tsx src/components/home/internship-timeline.test.tsx src/app/globals.css tests/e2e/home.spec.ts
git commit -m "feat: brand internship engineering stories"
```

---

### Task 4: Dedicated Semantica Open-Source Spotlight

**Files:**
- Create: `src/components/home/open-source-spotlight.tsx`
- Create: `src/components/home/open-source-spotlight.test.tsx`
- Modify: `content/site-content.json`
- Modify: `src/app/page.tsx`
- Modify: `src/components/home/case-studies.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`

**Interfaces:**
- Consumes: `OpenSourceProject`, `BrandMark`, local Semantica logo, existing internal article route.
- Produces: `OpenSourceSpotlight({ project })`, section `#open-source`, repository link name `查看 Semantica GitHub 项目`, article link name `阅读 Semantica 贡献复盘`, native “更多贡献” disclosure, and no Semantica duplicate in `caseStudies`.

- [ ] **Step 1: Write Semantica spotlight RED tests**

Create `open-source-spotlight.test.tsx`:

```tsx
render(<OpenSourceSpotlight project={openSource} />);
expect(screen.getByRole("img", { name: openSource.logo.alt })).toBeVisible();
expect(screen.getByText("Open-source Contributor · cxzg007")).toBeVisible();
expect(screen.getByText("#1 Repository of the Day")).toBeVisible();
expect(screen.getByText("#3 Repository of the Week")).toBeVisible();
expect(screen.getByText("7")).toBeVisible();
expect(screen.getByText("2")).toBeVisible();
expect(screen.getByRole("list", { name: "Semantica 图原生能力链路" })).toHaveTextContent("cxzg007 contributions");
expect(screen.getByRole("link", { name: "查看 Semantica GitHub 项目" })).toHaveAttribute("href", openSource.repositoryUrl);
expect(screen.getByRole("link", { name: "阅读 Semantica 贡献复盘" })).toHaveAttribute("href", openSource.articlePath);
```

Add an assertion that the attribution contains the dated snapshot and `#1081 / #1094` merged boundary. Update case-study test expected count from 3 to 2 only in the eventual GREEN implementation.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test -- src/components/home/open-source-spotlight.test.tsx src/components/home/case-studies.test.tsx
```

Expected: FAIL because `OpenSourceSpotlight` does not exist and Semantica is still a regular case study.

- [ ] **Step 3: Implement server-rendered spotlight**

Implement a server component with this semantic outline:

```tsx
<article aria-labelledby="semantica-heading" className="open-source-spotlight">
  <header><BrandMark asset={project.logo} />{/* identity and heading */}</header>
  <p className="open-source-background">{project.background}</p>
  <ul aria-label="Semantica 项目荣誉" className="honor-list">{/* two honors */}</ul>
  <dl className="contribution-metrics">{/* 7 public PRs; 2 merged */}</dl>
  <ol aria-label="Semantica 图原生能力链路" className="open-source-graph">{/* five nodes */}</ol>
  <section aria-labelledby="merged-contributions-heading">{/* merged highlights */}</section>
  <details><summary>更多贡献</summary>{/* other contributions */}</details>
  <nav aria-label="Semantica 公开资料">{/* external repository + internal article */}</nav>
</article>
```

Use native `<details>` so additional PR coverage remains available without a new client bundle. Honor cards must display platform, exact rank and period. Include visible text `截至 2026-08-21：#1081 与 #1094 已合并，其余贡献处于开放或审阅状态。`

- [ ] **Step 4: Move Semantica out of ordinary system cases**

Remove the `semantica-open-source` object from `caseStudies` only after the spotlight renders from `openSource`. In `page.tsx`, use this order and section numbering:

```tsx
<Section eyebrow="01 / EXPERIENCE" id="internships" title="实习经历">...</Section>
<Section eyebrow="02 / OPEN SOURCE" id="open-source" title="开源贡献">
  <OpenSourceSpotlight project={content.openSource} />
</Section>
<Section eyebrow="03 / SYSTEM DESIGN" id="case-studies" title="后端工程与系统设计">...</Section>
```

Update the writing/about eyebrow numbers to follow this order. Keep Person/ProfilePage JSON-LD `name`, `alternateName`, `sameAs`, and education unchanged.

- [ ] **Step 5: Add warm-purple project styling and graph layout**

Use Semantica purple only through local scoped variables such as `--brand-accent: #6246c7`, combined with amber outer borders. At desktop, place project context and honor/metrics in a balanced grid; graph nodes run horizontally with the final `cxzg007 contributions` node highlighted in amber. At <=920px stack the graph; at <=760px show the complete graph statically with no transform or progressive opacity.

- [ ] **Step 6: Update keyboard sequence and run GREEN**

Insert the repository link, internal article link and native details summary into the desktop keyboard expectations before system-case/writing links. Run:

```bash
pnpm test -- src/components/home/open-source-spotlight.test.tsx src/components/home/case-studies.test.tsx
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: spotlight tests PASS; exactly two system case articles remain; repository and internal article destinations are exact; axe and keyboard sequence pass.

- [ ] **Step 7: Commit**

```bash
git add content/site-content.json src/app/page.tsx src/components/home/open-source-spotlight.tsx src/components/home/open-source-spotlight.test.tsx src/components/home/case-studies.test.tsx src/app/globals.css tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts
git commit -m "feat: spotlight semantica open source impact"
```

---

### Task 5: Staged Warm Scroll Narrative with Static Mobile and Reduced Motion

**Files:**
- Modify: `src/components/home/impact-metrics.tsx`
- Modify: `src/components/home/scroll-enhancements.tsx`
- Modify: `src/components/home/scroll-enhancements.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `tests/e2e/reduced-motion.spec.ts`

**Interfaces:**
- Consumes: `.metric-card`, `.internship-card`, `.engineering-journey`, `.open-source-spotlight`, `.open-source-graph`, existing `.agent-network` and `.architecture-flow`.
- Produces: pure `getNarrativeStage(bounds, viewportHeight): 0 | 1 | 2 | 3`, `data-story-stage`, `data-metric-visible`, `data-open-source-stage`, and root `data-brand-motion="enhanced" | "static"`.

- [ ] **Step 1: Write deterministic motion RED tests**

Add pure-function expectations:

```ts
expect(getNarrativeStage({ bottom: 1_400, top: 900 }, 800)).toBe(0);
expect(getNarrativeStage({ bottom: 900, top: 620 }, 800)).toBe(1);
expect(getNarrativeStage({ bottom: 720, top: 380 }, 800)).toBe(2);
expect(getNarrativeStage({ bottom: 520, top: 120 }, 800)).toBe(3);
```

Add DOM fixtures for a metric, internship card and open-source spotlight. Assert normal desktop mode writes stages once per RAF. Add separate reduced-motion and `(max-width: 760px)` tests asserting `data-brand-motion="static"`, no story attributes, no scroll listener, and cleanup of every enhancement attribute.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
pnpm test -- src/components/home/scroll-enhancements.test.tsx
```

Expected: FAIL because narrative stages and mobile static policy are missing.

- [ ] **Step 3: Extend the single enhancement boundary**

Add a second media query for `(max-width: 760px)`. Enable listeners only when neither media query matches. Within the existing RAF update:

```ts
document.querySelectorAll<HTMLElement>(".metric-card").forEach((card) => {
  if (getNarrativeStage(card.getBoundingClientRect(), viewportHeight) > 0) {
    card.dataset.metricVisible = "true";
  }
});

document.querySelectorAll<HTMLElement>(".internship-card").forEach((card) => {
  card.dataset.storyStage = String(getNarrativeStage(card.getBoundingClientRect(), viewportHeight));
});

const openSource = document.querySelector<HTMLElement>(".open-source-spotlight");
if (openSource) {
  openSource.dataset.openSourceStage = String(
    getNarrativeStage(openSource.getBoundingClientRect(), viewportHeight),
  );
}
```

Update `clearEnhancementStates()` to remove all new attributes. Subscribe/unsubscribe to both media-query change events and remove scroll/resize listeners on reduced motion, narrow viewport and unmount.

- [ ] **Step 4: Add CSS-only stage transitions**

Default SSR and static modes show complete content. Apply opacity/translate and connector-lighting transitions only under:

```css
html[data-brand-motion="enhanced"] .internship-card[data-story-stage="0"] .internship-brand-header,
html[data-brand-motion="enhanced"] .internship-card[data-story-stage="0"] .engineering-journey,
html[data-brand-motion="enhanced"] .internship-card[data-story-stage="0"] .internship-highlights {
  opacity: 0.72;
  transform: translateY(12px);
}
```

Stages 1/2/3 reveal logo/header, journey and highlights respectively. Metrics count appearance is a one-time CSS transition; do not animate the numeric text to a false interim value. The Semantica graph lights nodes in order, ending on `cxzg007 contributions`. Reduced motion and <=760px override all opacity/transform/transition properties to fully visible static values.

- [ ] **Step 5: Run GREEN and motion E2E**

Run:

```bash
pnpm test -- src/components/home/scroll-enhancements.test.tsx
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/reduced-motion.spec.ts --project=chromium
```

Expected: normal desktop exposes deterministic stage attributes; reduced motion has zero Canvas and no enhancement attributes; 390px uses lite/static scene policy and no new brand animation attributes.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/impact-metrics.tsx src/components/home/scroll-enhancements.tsx src/components/home/scroll-enhancements.test.tsx src/app/globals.css tests/e2e/reduced-motion.spec.ts
git commit -m "feat: add progressive warm brand narrative motion"
```

---

### Task 6: Desktop Visual, Responsive, Accessibility and Bundle Acceptance

**Files:**
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`
- Modify: `tests/e2e/visual.spec.ts-snapshots/**`
- Modify: `src/app/globals.css` only for defects reproduced by the new acceptance tests.

**Interfaces:**
- Consumes: completed homepage DOM and all stable public names from Tasks 2-5.
- Produces: deterministic 1440x900 and 1920x1080 reviewed snapshots, 390px baseline usability, axe/keyboard evidence, and preserved blog bundle isolation.

- [ ] **Step 1: Strengthen desktop and baseline responsive RED tests**

In `responsive.spec.ts`, keep mobile/tablet/desktop loops and add exact containment checks for:

```ts
await expectHorizontallyContained(firstInternship.getByRole("img", { name: /官方 Logo/ }));
await expectHorizontallyContained(firstInternship.getByRole("list", { name: /工程链路/ }));
await expectHorizontallyContained(page.locator("#open-source .open-source-spotlight"));
await expectHorizontallyContained(page.getByRole("list", { name: "Semantica 图原生能力链路" }));
```

Add a dedicated chromium-only 1920x1080 test asserting the hero H1, three internship brand cards and open-source card all have non-zero visible geometry and no page overflow.

In `visual.spec.ts`, add reduced-motion snapshots for `#internships` and `#open-source`, and a chromium-only 1920x1080 full homepage narrative snapshot.

- [ ] **Step 2: Run acceptance tests and capture genuine RED**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts --project=chromium
```

Expected: new snapshots are missing and/or geometry, focus order, contrast or overflow assertions reveal concrete remaining defects.

- [ ] **Step 3: Fix only reproduced CSS/DOM defects**

For each failure, record the exact selector and viewport before editing. Typical allowed fixes are grid min-width (`minmax(0, 1fr)`), logo `max-width`, warm text contrast, focus outline, connector wrapping, or 1920px max-width. Do not weaken containment, contrast, focus, or visible-content assertions and do not whitelist new overflow outside decorative `.hero-visual` descendants.

- [ ] **Step 4: Update and inspect deterministic snapshots**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/visual.spec.ts --project=chromium --update-snapshots
```

Inspect every changed PNG at original resolution. Require: no clipped logo, distorted mark, unreadable warm-on-dark text, overlapping journey nodes, hidden identity, broken 1920px spacing, or stale cold-blue primary surfaces. Re-run without `--update-snapshots` and require PASS.

- [ ] **Step 5: Run complete focused acceptance matrix**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/visual.spec.ts tests/e2e/blog.spec.ts
```

Expected: all chromium/tablet/mobile projects PASS; blog routes have zero Canvas and loaded script bodies contain no Three.js or React Three Fiber signatures.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/e2e/home.spec.ts tests/e2e/responsive.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots
git commit -m "test: lock branded portfolio visual acceptance"
```

---

### Task 7: Full Verification, Live Browser Review and Production Release

**Files:**
- Modify: `README.md` only if the public section order or content-authoring schema instructions are now inaccurate.
- No production code changes unless a failure is first reproduced and fixed through the relevant earlier task's focused test.

**Interfaces:**
- Consumes: all completed tasks and existing Vercel project `jiangjunjie-personal-portal`.
- Produces: clean verified commit on GitHub `main`, READY Vercel production deployment, live URL `https://jiangjunjie-personal-portal.vercel.app`, and runtime-error audit.

- [ ] **Step 1: Run the exact local production gate**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify
pnpm audit --prod
git diff --check
git status --short
```

Expected: lint, TypeScript, all Vitest tests, content/asset validation, static Next.js build and all Playwright projects PASS; production audit reports no known vulnerabilities; diff check is clean; worktree contains only intentional tracked changes or is clean after prior commits.

- [ ] **Step 2: Perform live-like browser review before release**

Run the production server and inspect 1440x900, 1920x1080, 390x844 and reduced-motion homepage states in a real browser. Verify:

- `cxzg007` is visually dominant while `江俊杰 / Jiang Junjie`, role and two education rows remain visible.
- All three official company logos are sharp and undistorted.
- Each internship headline, journey and three recruiter-first highlights are readable before expansion.
- AGIBOT expansion contains both named projects.
- Semantica contains background, exact two honors, contributor identity, 7/2 metrics, dated PR boundary, graph and exact links.
- Normal desktop motion is restrained and upward; mobile/reduced motion is fully readable and static.
- Console has no unexplained errors; no horizontal overflow exists.

- [ ] **Step 3: Commit any accurate documentation delta**

If README content authoring or acceptance instructions are stale, update them with the new required brand fields and asset validation command, then run `git diff --check` and commit:

```bash
git add README.md
git commit -m "docs: document branded portfolio content"
```

If README is already accurate, do not create an empty commit.

- [ ] **Step 4: Push the verified branch to GitHub main**

Run:

```bash
git status --short
git push origin HEAD:main
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

Expected: remote `refs/heads/main` hash exactly equals local HEAD and the worktree is clean.

- [ ] **Step 5: Deploy the exact verified source to Vercel production**

Use the connected Vercel project `jiangjunjie-personal-portal`, team `junjie1467-6343s-projects`, target `production`. Upload tracked build source only; exclude tests and local artifacts. Poll the created deployment until `READY`; if it reaches `ERROR`, retrieve build logs and return to the relevant failing task rather than retrying blindly.

Expected cloud log evidence:

- pnpm lockfile v9 detected.
- `pnpm 10.34.5` used.
- content and local brand asset validation passed.
- Next.js 16 production build and static routes completed.
- stable alias includes `jiangjunjie-personal-portal.vercel.app`.

- [ ] **Step 6: Verify the public production site**

Fetch `/`, `/blog`, `/blog/first-agent-system`, `/resume.pdf`, `/robots.txt`, `/sitemap.xml`, and `/rss.xml`; require HTTP 200 and canonical origin `https://jiangjunjie-personal-portal.vercel.app`. Open the stable homepage in a real browser and repeat the desktop identity/logo/Semantica spot checks. Query Vercel runtime errors for the last hour and require no errors after the page visits.

- [ ] **Step 7: Record final release evidence**

Report the final Git commit, live URL, Vercel deployment ID, full local gate counts, cloud build status, public endpoint status, browser viewports inspected, and any explicitly accepted non-blocking warning. Do not claim custom-domain, Git auto-deploy, live PR synchronization or official GitHub award status unless independently configured and verified.
