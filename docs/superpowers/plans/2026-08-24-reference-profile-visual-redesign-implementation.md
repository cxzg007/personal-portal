# Reference Profile Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the recruiting homepage as a high-fidelity, warm graphite single-page profile led by `cxzg007 Profile`, with sticky internship stories, accessible system tabs, a structured Semantica showcase, honors, writing, and contact stages.

**Architecture:** Keep Next.js App Router and the existing local JSON/MDX content pipeline. Render all core recruiting content on the server, isolate tabs and page motion in small client boundaries, use native sticky positioning plus CSS transitions, and remove the Three.js/WebGL path entirely. Preserve the existing blog, SEO, resume, RSS, sitemap, accessibility, and Vercel contracts.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, CSS, Next Image, Vitest, Testing Library, Playwright, axe-core, pnpm 10.34.5, Vercel.

## Global Constraints

- The visual structure may closely follow `xianchaoqian.com`, but no reference-site source code, copy, portrait, photography, or private asset may be copied.
- Desktop visual acceptance targets are exactly `1280×800`, `1440×900`, and `1920×1080`.
- Mobile receives no new complex animation; existing content completeness, keyboard operation, and zero horizontal overflow must remain.
- The largest homepage heading is exactly `cxzg007 Profile`; `江俊杰 / Jiang Junjie` remains visible as the secondary signature.
- Homepage section order is Profile, Information, Internships, Systems, Open Source, Honors, Writing, Contact.
- Core content must remain server-rendered and readable without JavaScript.
- Use one homepage motion controller; do not add independent unbounded scroll listeners to individual sections.
- Use CSS transitions, IntersectionObserver, requestAnimationFrame, and native sticky positioning; add no animation library.
- Remove Three.js, React Three Fiber, `motion`, WebGL scene code, and homepage canvas output.
- `prefers-reduced-motion: reduce` disables parallax, sticky scaling, staged reveals, and sequential node lighting while preserving all content.
- Company and project logos use local files, Next.js `Image`, correct alternative text, and original proportions.
- Semantica identity remains `Open-source Contributor · cxzg007`; honors must not be described as official GitHub awards.
- Semantica PR status is a dated public snapshot, represented by structured fields rather than parsed display text.
- Do not add a CMS, database, authentication, admin UI, or online editor.
- Preserve Node `^22.22.2 || ^24.15.0 || ^26.0.0`, pnpm `10.34.5`, Next.js + Vercel, and the current `NEXT_PUBLIC_SITE_URL` production contract.
- Before implementation, read the repository `AGENTS.md` plus local Next 16 docs `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `11-css.md`, `12-images.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md`.

---

## File Structure

### New files

- `src/components/home/profile-hero.tsx` — server-rendered title, positioning, CTAs, and `ProfileDock` composition.
- `src/components/home/profile-dock.tsx` — server-rendered real identity, education, contact, and growth path.
- `src/components/home/profile-info.tsx` — server-rendered information copy and structured facts.
- `src/components/home/sticky-internship-stack.tsx` — server-rendered three-card sticky experience stack.
- `src/components/home/internship-story-card.tsx` — one branded experience story and its visible capability records.
- `src/components/home/system-project-tabs.tsx` — accessible client tab controller.
- `src/components/home/architecture-stage.tsx` — server-compatible architecture chain visual.
- `src/components/home/open-source-showcase.tsx` — server-rendered Semantica brand, contribution, and link stage.
- `src/components/home/honor-gallery.tsx` — server-rendered open-source and academic honors.
- `src/components/home/writing-stage.tsx` — server boundary that renders zero, one, or multiple featured articles appropriately.
- `src/components/home/writing-carousel.tsx` — accessible client article switcher used only when at least two articles exist.
- `src/components/home/contact-stage.tsx` — final recruiting CTA.
- `src/components/home/page-motion-controller.tsx` — the only homepage observer/scroll enhancement boundary.
- `src/app/profile.css` — all new homepage-only layout, color, sticky, and motion rules.
- Unit tests beside every new component using the existing `*.test.tsx` convention.

### Modified files

- `content/site-content.json` — exact profile copy, four system cases, structured PR contributions, and academic honors.
- `src/content/schema.ts` — required technical ID, PR and academic honor types, and exact system-case validation.
- `src/content/schema.test.ts` — adversarial content-contract tests.
- `src/test/fixtures/site-content.ts` — fixture data matching the new contract.
- `src/app/page.tsx` — new single-page section order and component composition.
- `src/app/layout.tsx` — import `profile.css` after `globals.css`.
- `src/components/shell/header.tsx` — reference-style labels, section destinations, and active-section hooks.
- `src/app/globals.css` — retain shared/blog styles; remove obsolete homepage and scene selectors.
- `tests/e2e/home.spec.ts` — new homepage content and interaction acceptance.
- `tests/e2e/server-rendering.spec.ts` — JavaScript-disabled core-content acceptance.
- `src/lib/dependency-boundary.test.ts` — package-level proof that removed WebGL/animation dependencies cannot return unnoticed.
- `tests/e2e/accessibility.spec.ts` — updated keyboard order and tab semantics.
- `tests/e2e/responsive.spec.ts` — sticky/card geometry and fallback assertions.
- `tests/e2e/reduced-motion.spec.ts` — static mode without scene assumptions.
- `tests/e2e/blog.spec.ts` — assert Three.js and homepage motion are absent from blog bundles.
- `tests/e2e/visual.spec.ts` — new homepage baselines at desktop targets.
- `README.md` — document the new content fields and homepage verification commands.
- `package.json`, `pnpm-lock.yaml` — remove unused animation/WebGL packages.

### Deleted files after replacement

- `src/components/home/hero.tsx`
- `src/components/home/hero.test.tsx`
- `src/components/home/impact-metrics.tsx`
- `src/components/home/internship-timeline.tsx`
- `src/components/home/internship-timeline.test.tsx`
- `src/components/home/case-studies.tsx`
- `src/components/home/case-studies.test.tsx`
- `src/components/home/featured-writing.tsx`
- `src/components/home/featured-writing.test.tsx`
- `src/components/home/contact.tsx`
- `src/components/home/scroll-enhancements.tsx`
- `src/components/home/scroll-enhancements.test.tsx`
- `src/components/scene/agent-network-canvas.tsx`
- `src/components/scene/agent-network-scene.tsx`
- `src/components/scene/agent-network-scene.test.tsx`
- `src/components/scene/scene-loader.tsx`
- `src/components/scene/scene-loader.test.tsx`
- `src/components/scene/static-network.tsx`
- `src/lib/webgl.ts`
- `src/lib/webgl.test.ts`
- `src/lib/scene-performance.ts`
- `src/lib/scene-performance.test.ts`
- `src/lib/motion.ts`

---

### Task 1: Strengthen the homepage content contract

**Files:**
- Modify: `src/content/schema.ts`
- Modify: `src/content/schema.test.ts`
- Modify: `src/test/fixtures/site-content.ts`
- Modify: `content/site-content.json`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Produces: `OpenSourceContribution`, `AcademicHonor`, and the expanded `CaseStudy` fields.
- Produces: required `SiteContent["profile"]["technicalId"]: string`.
- Produces: `SiteContent["openSource"]["contributions"]: OpenSourceContribution[]`.
- Produces: `SiteContent["academicHonors"]: AcademicHonor[]`.
- Produces: exactly four `caseStudies` with `tabLabel` and `visualKind`.

- [ ] **Step 1: Write failing adversarial schema tests**

Add tests that delete `profile.technicalId`, provide a malformed contribution URL/status, provide zero merged contributions, remove an academic honor field, and reduce system cases to three:

```ts
it("rejects content without the required technical identity", () => {
  const input = structuredClone(validSiteContent) as Record<string, unknown>;
  delete (input.profile as Record<string, unknown>).technicalId;
  expect(validateSiteContent(input)).toEqual({
    ok: false,
    errors: expect.arrayContaining(["profile.technicalId must be a non-empty string"]),
  });
});

it("rejects an invalid structured open-source contribution", () => {
  const input = structuredClone(validSiteContent);
  input.openSource.contributions[0].status = "done" as "merged";
  input.openSource.contributions[0].url = "http://github.com/example/pr/1";
  expect(validateSiteContent(input)).toEqual(expect.objectContaining({ ok: false }));
});

it("requires exactly four system projects", () => {
  const input = structuredClone(validSiteContent);
  input.caseStudies.pop();
  expect(validateSiteContent(input)).toEqual({
    ok: false,
    errors: expect.arrayContaining(["caseStudies must contain exactly 4 entries"]),
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `pnpm test -- src/content/schema.test.ts`

Expected: FAIL because `technicalId` is optional and the new contribution/honor fields are not validated.

- [ ] **Step 3: Define the exact new types**

Use these signatures in `src/content/schema.ts`:

```ts
export type OpenSourceContribution = {
  number: number;
  status: "merged" | "open" | "review";
  summary: string;
  url: string;
};

export type AcademicHonor = {
  title: string;
  source: string;
  period: string;
  note: string;
};

export type CaseStudy = {
  id: string;
  tabLabel: "Ontology Agent" | "Streaming Backend" | "Knowledge Memory" | "Semantica";
  visualKind: "ontology" | "streaming" | "memory" | "graph";
  title: string;
  problem: string;
  constraints: string[];
  decisions: string[];
  tradeoffs: string[];
  contribution: string;
  result: string;
  stack: string[];
  links: Array<{ label: string; url: string }>;
};
```

Remove `contributionCount`, `mergedCount`, `mergedHighlights`, and `otherContributions` from `OpenSourceProject`. Add `contributions`. Make `technicalId` required and add `academicHonors` to `SiteContent`.

- [ ] **Step 4: Implement validation for the new contract**

Require:

- `profile.technicalId` with `checkText` unconditionally.
- Exactly four `caseStudies`, with unique IDs, unique tab labels, supported `visualKind`, and all existing non-empty narrative arrays.
- Exactly seven contributions for the dated snapshot, each with a positive integer number, supported status, non-empty summary, and HTTPS GitHub PR URL.
- Exactly two merged contributions and no duplicate PR numbers.
- Exactly three academic honors with non-empty title, source, period, and note.

Do not validate a manually entered merged total; compute it where rendered.

- [ ] **Step 5: Migrate fixture and production content**

Set the four system cases to:

1. `ontology-agent-platform` / `Ontology Agent` / `ontology`.
2. `streaming-backend` / `Streaming Backend` / `streaming`.
3. `knowledge-memory` / `Knowledge Memory` / `memory`.
4. `semantica-contributions` / `Semantica` / `graph`.

Represent PRs `#1077`, `#1081`, `#1094`, `#1096`, `#1113`, `#1143`, and `#1153` as individual objects. Preserve the dated `2026-08-21` snapshot and mark only `#1081` and `#1094` as merged.

Add academic honors for `国家励志奖学金`, `大唐杯上海市二等奖`, and `本科专业排名 12/62`. Replace internal audit prose in metric evidence with concise public-facing copy.

- [ ] **Step 6: Run focused validation and tests**

Run:

```bash
pnpm test -- src/content/schema.test.ts src/lib/brand-assets.test.ts
pnpm exec tsx scripts/validate-content.ts
pnpm typecheck
```

Expected: all commands PASS; content validation reports `Content validation passed`.

- [ ] **Step 7: Commit**

```bash
git add content/site-content.json src/content/schema.ts src/content/schema.test.ts src/test/fixtures/site-content.ts
git commit -m "feat: strengthen profile content contract"
```

---

### Task 2: Build the profile hero, dock, and information stage

**Files:**
- Create: `src/components/home/profile-hero.tsx`
- Create: `src/components/home/profile-hero.test.tsx`
- Create: `src/components/home/profile-dock.tsx`
- Create: `src/components/home/profile-dock.test.tsx`
- Create: `src/components/home/profile-info.tsx`
- Create: `src/components/home/profile-info.test.tsx`
- Modify: `src/components/shell/header.tsx`
- Test: `src/components/home/profile-hero.test.tsx`
- Test: `src/components/home/profile-dock.test.tsx`
- Test: `src/components/home/profile-info.test.tsx`

**Interfaces:**
- Consumes: required `SiteContent["profile"]` from Task 1.
- Produces: `ProfileHero({ profile }: { profile: SiteContent["profile"] })`.
- Produces: `ProfileDock({ profile }: { profile: SiteContent["profile"] })`.
- Produces: `ProfileInfo({ profile, about }: { profile: SiteContent["profile"]; about: string[] })`.
- Header destinations become `#info`, `#internships`, `#systems`, `#open-source`, `#honors`, `#writing`, and `#contact`.

- [ ] **Step 1: Write failing identity and information tests**

Assert an exact H1 of `cxzg007 Profile`, visible real name, role, recruiting status, two education rows, growth path, resume/GitHub/email destinations, and a structured information definition list.

```tsx
render(<ProfileHero profile={profile} />);
expect(screen.getByRole("heading", { level: 1, name: "cxzg007 Profile" })).toBeVisible();
expect(screen.getByText("江俊杰 / Jiang Junjie")).toBeVisible();
expect(screen.getByRole("link", { name: "查看实习" })).toHaveAttribute("href", "#internships");
expect(screen.getByRole("link", { name: "下载简历" })).toHaveAttribute("href", "/resume.pdf");
expect(screen.getByText("通信工程 → 后端系统 → Agent / 知识图谱 → 可靠 AI 工程")).toBeVisible();
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/profile-hero.test.tsx src/components/home/profile-dock.test.tsx src/components/home/profile-info.test.tsx`

Expected: FAIL because the three components do not exist.

- [ ] **Step 3: Implement server-rendered components**

`ProfileHero` must render this semantic skeleton:

```tsx
<section aria-labelledby="profile-title" className="profile-hero" id="profile">
  <div className="profile-hero-copy">
    <p className="profile-hero-kicker">RELIABLE AGENT · BACKEND SYSTEMS</p>
    <h1 id="profile-title">{profile.technicalId} Profile</h1>
    <p>{profile.positioning}</p>
    <div className="profile-hero-actions">
      <a className="profile-cta profile-cta-primary" href="#internships">查看实习</a>
      <a className="profile-cta profile-cta-secondary" href="/resume.pdf">下载简历</a>
    </div>
  </div>
  <ProfileDock profile={profile} />
</section>
```

`ProfileDock` renders real identity, role, status, exactly two education items, contacts, and the exact growth path. `ProfileInfo` renders `about` paragraphs and a `<dl>` for name, technical ID, school, degree, graduation year, target role, and technical direction.

- [ ] **Step 4: Update header content contract**

Set the visible brand to `cxzg007.` and desktop links to `信息`, `实习`, `系统`, `开源`, `荣誉`, `博客`, `联系`, plus distinct GitHub and resume links. Preserve the existing mobile menu focus restoration and breakpoint reset behavior.

- [ ] **Step 5: Run unit, accessibility-focused component, and type gates**

Run:

```bash
pnpm test -- src/components/home/profile-hero.test.tsx src/components/home/profile-dock.test.tsx src/components/home/profile-info.test.tsx src/components/home/hero.test.tsx
pnpm typecheck
```

Expected: all listed tests PASS. The old hero component remains independently valid until Task 8 replaces and deletes it.

- [ ] **Step 6: Commit only new components and the header**

```bash
git add src/components/home/profile-hero.tsx src/components/home/profile-hero.test.tsx src/components/home/profile-dock.tsx src/components/home/profile-dock.test.tsx src/components/home/profile-info.tsx src/components/home/profile-info.test.tsx src/components/shell/header.tsx
git commit -m "feat: add reference-style profile introduction"
```

---

### Task 3: Replace collapsible internships with a sticky story stack

**Files:**
- Create: `src/components/home/internship-story-card.tsx`
- Create: `src/components/home/internship-story-card.test.tsx`
- Create: `src/components/home/sticky-internship-stack.tsx`
- Create: `src/components/home/sticky-internship-stack.test.tsx`
- Reuse: `src/components/home/brand-mark.tsx`
- Reuse: `src/components/home/engineering-journey.tsx`

**Interfaces:**
- Consumes: `SiteContent["internships"]`.
- Produces: `InternshipStoryCard({ internship, index }: { internship: Internship; index: number })`.
- Produces: `StickyInternshipStack({ internships }: { internships: Internship[] })`.
- Produces DOM hooks: `.sticky-internship-card`, `data-brand`, `data-card-index`, `.capability-records`.

- [ ] **Step 1: Write failing visible-content tests**

Assert three article cards; every card exposes logo, company, team, role, period, value headline, three journey nodes, exactly three visible capability records, first result, and stack without disclosure interaction.

```tsx
render(<StickyInternshipStack internships={internships} />);
const cards = screen.getAllByRole("article");
expect(cards).toHaveLength(3);
expect(cards[0]).toHaveAttribute("data-card-index", "0");
expect(within(cards[0]).getByRole("img", { name: internships[0].logo.alt })).toBeVisible();
expect(within(cards[0]).getByRole("list", { name: "京东 能力建设记录" })).toBeVisible();
expect(within(cards[0]).queryByRole("button", { name: /技术细节/ })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/internship-story-card.test.tsx src/components/home/sticky-internship-stack.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the static semantic stack**

Render an ordered wrapper and one article per internship. Use `index % 2` to set `data-layout="copy-visual" | "visual-copy"`. The copy column contains visible headline, context, ownership, and stack. The visual column contains `BrandMark`, `EngineeringJourney`, status, and `internship.highlights.slice(0, 3)` as the capability record list.

Do not introduce state, buttons, or client-side code. Native sticky styling is added in Task 8.

- [ ] **Step 4: Verify server rendering and all internship content**

Run:

```bash
pnpm test -- src/components/home/internship-story-card.test.tsx src/components/home/sticky-internship-stack.test.tsx src/components/home/brand-primitives.test.tsx
pnpm typecheck
```

Expected: all focused tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/internship-story-card.tsx src/components/home/internship-story-card.test.tsx src/components/home/sticky-internship-stack.tsx src/components/home/sticky-internship-stack.test.tsx
git commit -m "feat: add sticky internship story stack"
```

---

### Task 4: Build accessible system project tabs

**Files:**
- Create: `src/components/home/architecture-stage.tsx`
- Create: `src/components/home/architecture-stage.test.tsx`
- Create: `src/components/home/system-project-tabs.tsx`
- Create: `src/components/home/system-project-tabs.test.tsx`

**Interfaces:**
- Consumes: the four `CaseStudy` entries from Task 1.
- Produces: `ArchitectureStage({ project }: { project: CaseStudy })`.
- Produces: `SystemProjectTabs({ projects }: { projects: CaseStudy[] })`.
- Produces tab IDs `system-tab-${id}` and panels `system-panel-${id}`.

- [ ] **Step 1: Write failing ARIA and keyboard tests**

Test exact four tabs, first panel selected by default, inactive panels hidden, ArrowRight/ArrowLeft/Home/End roving focus, Enter/Space activation, and complete project narrative in the active panel.

```tsx
const user = userEvent.setup();
render(<SystemProjectTabs projects={caseStudies} />);
const tabs = screen.getAllByRole("tab");
expect(tabs.map((tab) => tab.textContent)).toEqual([
  "Ontology Agent",
  "Streaming Backend",
  "Knowledge Memory",
  "Semantica",
]);
expect(tabs[0]).toHaveAttribute("aria-selected", "true");
await user.click(tabs[1]);
expect(tabs[1]).toHaveAttribute("aria-selected", "true");
expect(screen.getByRole("tabpanel", { name: "Streaming Backend" })).toBeVisible();
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/architecture-stage.test.tsx src/components/home/system-project-tabs.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement `ArchitectureStage`**

Render one named ordered list with three nodes:

1. `输入约束` from `project.constraints[0]`.
2. `工程决策` from `project.decisions[0]`.
3. `可验证结果` from `project.result`.

Set `data-visual-kind={project.visualKind}` and keep connectors `aria-hidden="true"`.

- [ ] **Step 4: Implement tab state and roving focus**

Make only `system-project-tabs.tsx` a client component. Store `activeIndex`, keep button refs, and implement:

```ts
function nextIndex(key: string, current: number, count: number) {
  if (key === "ArrowRight") return (current + 1) % count;
  if (key === "ArrowLeft") return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return current;
}
```

Arrow/Home/End move focus and activate the destination. Tab enters once on the active tab and then leaves the tablist. Render one active tabpanel; the selected project copy, stack, links, and `ArchitectureStage` appear inside it.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm test -- src/components/home/architecture-stage.test.tsx src/components/home/system-project-tabs.test.tsx
pnpm typecheck
```

Expected: all focused tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/architecture-stage.tsx src/components/home/architecture-stage.test.tsx src/components/home/system-project-tabs.tsx src/components/home/system-project-tabs.test.tsx
git commit -m "feat: add accessible system project stage"
```

---

### Task 5: Rebuild Semantica and honors from structured data

**Files:**
- Create: `src/components/home/open-source-showcase.tsx`
- Create: `src/components/home/open-source-showcase.test.tsx`
- Create: `src/components/home/honor-gallery.tsx`
- Create: `src/components/home/honor-gallery.test.tsx`
- Reuse: `src/components/home/brand-mark.tsx`

**Interfaces:**
- Consumes: `OpenSourceProject` with `contributions` from Task 1.
- Consumes: `SiteContent["academicHonors"]`.
- Produces: `OpenSourceShowcase({ project }: { project: OpenSourceProject })`.
- Produces: `HonorGallery({ openSourceHonors, academicHonors }: { openSourceHonors: OpenSourceProject["honors"]; academicHonors: AcademicHonor[] })`.

- [ ] **Step 1: Write failing factual-boundary tests**

Assert official logo, exact contributor identity, exact project background, seven PR links, two merged badges computed from statuses, dated boundary text, five graph nodes, two external destinations, two open-source honors, and three academic honors.

```tsx
render(<OpenSourceShowcase project={openSource} />);
expect(screen.getAllByRole("link", { name: /PR #/ })).toHaveLength(7);
expect(screen.getAllByText("MERGED")).toHaveLength(2);
expect(screen.getByText("截至 2026-08-21：2 个贡献已合并，其余处于开放或审阅状态。")).toBeVisible();
expect(screen.getByRole("list", { name: "Semantica 能力链路" })).toHaveTextContent("cxzg007");
```

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/open-source-showcase.test.tsx src/components/home/honor-gallery.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the showcase without parsing display text**

Compute:

```ts
const merged = project.contributions.filter(({ status }) => status === "merged");
```

Render each PR as an HTTPS link labeled `PR #${number}：${summary}` with a visible status badge. Do not call GitHub at runtime. Render graph nodes from `project.graphNodes`, project/review links, and the dated boundary.

- [ ] **Step 4: Implement the two-column honor gallery**

Render two named groups: `开源影响力` and `教育与竞赛`. The first consumes `openSourceHonors`; the second consumes `academicHonors`. Preserve the provided rank wording and include a visible note that rankings are public trend records, not official GitHub awards.

- [ ] **Step 5: Run focused tests and content validation**

Run:

```bash
pnpm test -- src/components/home/open-source-showcase.test.tsx src/components/home/honor-gallery.test.tsx
pnpm exec tsx scripts/validate-content.ts
pnpm typecheck
```

Expected: all commands PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/open-source-showcase.tsx src/components/home/open-source-showcase.test.tsx src/components/home/honor-gallery.tsx src/components/home/honor-gallery.test.tsx
git commit -m "feat: add structured open source and honors stages"
```

---

### Task 6: Add the writing stage and final recruiting contact

**Files:**
- Create: `src/components/home/writing-stage.tsx`
- Create: `src/components/home/writing-stage.test.tsx`
- Create: `src/components/home/writing-carousel.tsx`
- Create: `src/components/home/writing-carousel.test.tsx`
- Create: `src/components/home/contact-stage.tsx`
- Create: `src/components/home/contact-stage.test.tsx`

**Interfaces:**
- Consumes: public featured `PostMeta[]` from `getAllPosts()`.
- Consumes: `SiteContent["profile"]`.
- Produces: `WritingStage({ posts }: { posts: PostMeta[] })`.
- Produces: `WritingCarousel({ posts }: { posts: PostMeta[] })`, called only with at least two entries.
- Produces: `ContactStage({ profile }: { profile: SiteContent["profile"] })`.

- [ ] **Step 1: Write failing single- and multi-post tests**

Assert no empty section with zero posts, no previous/next controls with one post, and keyboard-operable navigation with two or more posts.

```tsx
render(<WritingStage posts={[post(1)]} />);
expect(screen.getByRole("heading", { name: "文章 1" })).toBeVisible();
expect(screen.queryByRole("button", { name: "上一篇文章" })).not.toBeInTheDocument();
expect(screen.queryByRole("button", { name: "下一篇文章" })).not.toBeInTheDocument();
```

For `ContactStage`, assert exact heading `Build reliable agent systems together.`, recruiting status, email, GitHub, and PDF links.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/writing-stage.test.tsx src/components/home/writing-carousel.test.tsx src/components/home/contact-stage.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement `WritingStage`**

Keep `writing-stage.tsx` server-compatible. Return `null` for no posts, render one static article stage for one post, and render `<WritingCarousel posts={posts} />` for at least two posts. Make only `writing-carousel.tsx` client-side; it stores `activeIndex` and provides previous/next buttons with wraparound. The left column renders title, description, tags, date, and article link. The right column renders a decorative architecture/code frame with `aria-hidden="true"`; it must not contain fabricated article facts.

- [ ] **Step 4: Implement `ContactStage`**

Render the exact English heading, one recruiting sentence, and three links:

- `mailto:${profile.email}`
- `profile.github`, external with `rel="noreferrer"`
- `/resume.pdf`, download

Do not render unrelated social networks.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm test -- src/components/home/writing-stage.test.tsx src/components/home/writing-carousel.test.tsx src/components/home/contact-stage.test.tsx src/content/posts.test.ts
pnpm typecheck
```

Expected: all focused tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/writing-stage.tsx src/components/home/writing-stage.test.tsx src/components/home/writing-carousel.tsx src/components/home/writing-carousel.test.tsx src/components/home/contact-stage.tsx src/components/home/contact-stage.test.tsx
git commit -m "feat: add writing and recruiting contact stages"
```

---

### Task 7: Replace scroll effects with one page motion controller

**Files:**
- Create: `src/components/home/page-motion-controller.tsx`
- Create: `src/components/home/page-motion-controller.test.tsx`
- Modify: `src/components/shell/header.tsx`

**Interfaces:**
- Produces: `PageMotionController()` with no props or visible output.
- Produces root attributes `data-profile-motion="enhanced|static"` and `data-active-section="<id>"`.
- Produces per-element `data-in-view="true"` and sticky cards `data-stack-progress="0|1|2"`.
- Produces hero CSS variables `--profile-pointer-x` and `--profile-pointer-y` as normalized `-1..1` values.
- Header links expose `data-nav-section` values matching section IDs.

- [ ] **Step 1: Write failing deterministic helper and teardown tests**

Export pure helpers:

```ts
export function getStackProgress(top: number, stickyTop: number): 0 | 1 | 2 {
  if (top > stickyTop + 120) return 0;
  if (top > stickyTop) return 1;
  return 2;
}

export function selectActiveSection(
  entries: Array<{ id: string; top: number }>,
  headerHeight: number,
): string {
  return entries.filter(({ top }) => top <= headerHeight + 160).at(-1)?.id ?? "profile";
}
```

Test one requestAnimationFrame per scroll or pointer event, no scroll/pointer listener under reduced motion or `max-width: 760px`, complete attribute/CSS-variable cleanup when preferences change, and `aria-current="location"` applied only to the active header link.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `pnpm test -- src/components/home/page-motion-controller.test.tsx`

Expected: FAIL because the controller does not exist.

- [ ] **Step 3: Implement one observer/RAF boundary**

Use one IntersectionObserver for `.profile-reveal` elements and one passive scroll/resize handler throttled through requestAnimationFrame for section selection and sticky progress. Add one pointer handler on the hero that writes normalized pointer coordinates to `--profile-pointer-x` and `--profile-pointer-y` in the same RAF discipline. The controller may update `data-*`, `aria-current`, and these two paint-only CSS variables, but must not set inline layout properties or alternate geometry reads and writes.

Static mode rules:

- If reduced motion or width `<=760px`, register neither IntersectionObserver nor scroll/pointer listener.
- Set `data-profile-motion="static"`.
- Clear `data-in-view`, `data-stack-progress`, active-navigation attributes, and pointer CSS variables on teardown.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test -- src/components/home/page-motion-controller.test.tsx`

Expected: all tests PASS with fake IntersectionObserver and requestAnimationFrame implementations.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/page-motion-controller.tsx src/components/home/page-motion-controller.test.tsx src/components/shell/header.tsx
git commit -m "feat: add unified profile motion controller"
```

---

### Task 8: Compose the new homepage and implement the visual system

**Files:**
- Create: `src/app/profile.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Delete: replaced home component and test files listed in File Structure
- Test: all new home unit suites

**Interfaces:**
- Consumes: all components from Tasks 2–7.
- Produces homepage sections with IDs `profile`, `info`, `internships`, `systems`, `open-source`, `honors`, `writing`, and `contact`.
- Produces `.profile-shell`, `.profile-stage`, `.sticky-internship-card`, `.system-project-stage`, `.open-source-showcase`, `.honor-gallery`, `.writing-stage`, `.contact-stage`.

- [ ] **Step 1: Write a failing homepage composition test**

Add a small server composition test or extend `tests/e2e/home.spec.ts` to assert exact section order:

```ts
await expect(page.locator("main > section")).toHaveCount(8);
expect(await page.locator("main > section").evaluateAll((sections) => sections.map(({ id }) => id))).toEqual([
  "profile", "info", "internships", "systems", "open-source", "honors", "writing", "contact",
]);
```

- [ ] **Step 2: Run the composition test to verify RED**

Run: `pnpm exec playwright test tests/e2e/home.spec.ts --project=chromium --grep "section order"`

Expected: FAIL because the old homepage section order remains.

- [ ] **Step 3: Compose the new homepage**

Keep JSON-LD and site URL logic. Replace the visible tree with:

```tsx
<Header />
<PageMotionController />
<main id="main-content" tabIndex={-1}>
  <ProfileHero profile={content.profile} />
  <section aria-labelledby="info-heading" className="profile-stage" id="info">
    <h2 id="info-heading">个人信息</h2>
    <ProfileInfo about={content.about} profile={content.profile} />
  </section>
  <section aria-labelledby="internships-heading" className="profile-stage" id="internships">
    <h2 id="internships-heading">实习内容落在真实系统里。</h2>
    <StickyInternshipStack internships={content.internships} />
  </section>
  <section aria-labelledby="systems-heading" className="profile-stage" id="systems">
    <h2 id="systems-heading">项目按工程问题组织。</h2>
    <SystemProjectTabs projects={content.caseStudies} />
  </section>
  <section aria-labelledby="open-source-heading" className="profile-stage" id="open-source">
    <h2 id="open-source-heading">开源贡献与公开影响力。</h2>
    <OpenSourceShowcase project={content.openSource} />
  </section>
  <section aria-labelledby="honors-heading" className="profile-stage" id="honors">
    <h2 id="honors-heading">荣誉与长期积累。</h2>
    <HonorGallery academicHonors={content.academicHonors} openSourceHonors={content.openSource.honors} />
  </section>
  <section aria-labelledby="writing-heading" className="profile-stage" id="writing">
    <h2 id="writing-heading">技术写作与工程复盘。</h2>
    <WritingStage posts={featuredPosts} />
  </section>
  <section aria-labelledby="contact-heading" className="profile-stage" id="contact">
    <h2 id="contact-heading">Build reliable agent systems together.</h2>
    <ContactStage profile={content.profile} />
  </section>
</main>
```

- [ ] **Step 4: Add the exact color and layout tokens to `profile.css`**

Start with:

```css
.profile-shell {
  --profile-bg: #060909;
  --profile-bg-deep: #0b0d0e;
  --profile-hero-top: #867174;
  --profile-hero-mid: #7a676a;
  --profile-hero-low: #10120f;
  --profile-ink: #fff3f0;
  --profile-muted: rgb(255 255 255 / 68%);
  --profile-panel: #17171b;
  --profile-panel-deep: #0e1016;
  --profile-line: rgb(235 239 255 / 16%);
  --profile-accent: #f7708e;
  --profile-width: 68.75rem;
  color: var(--profile-ink);
  background: linear-gradient(#060909, #0b0d0e 42%, #0b0d0e);
}

.profile-hero {
  position: relative;
  min-height: 71.25rem;
  overflow: clip;
  background:
    radial-gradient(circle at 50% 0%, rgb(161 129 133 / 58%), transparent 46%),
    linear-gradient(#867174, #7a676a 28%, #4c4b43 54%, #10120f 78%, #020302);
}

.profile-hero h1 {
  margin: 0;
  color: transparent;
  font-size: clamp(5.5rem, 9vw, 7.5rem);
  font-weight: 440;
  line-height: 1;
  background: linear-gradient(#fffdfa, #f4e8df 62%, #dccdc4);
  background-clip: text;
}
```

Implement 54px fixed navigation, 1100px content width, 20–22px cards, pill CTAs, alternating two-column internship cards, sticky offsets `86px`, `104px`, and `122px`, system tabs, Semantica graph, honor columns, writing stage, and contact finale.

- [ ] **Step 5: Add responsive and reduced-motion rules**

At `<=920px`, stack all two-column stages and disable sticky positioning. Add `@supports not (position: sticky)` with the same normal-flow card fallback. At `<=760px`, set all reveal content to visible/static, preserve the mobile header, and prevent horizontal overflow. Under reduced motion, remove transforms, transition durations, sticky scaling, pointer tilt, and sequential node opacity.

- [ ] **Step 6: Remove obsolete homepage components and styles**

Delete the replaced home files listed above. Remove obsolete selectors for `.hero`, `.impact-metrics`, `.internship-timeline`, `.case-study-list`, `.featured-writing-*`, `.contact-panel`, `.agent-network`, `.static-network`, and old brand narrative stage attributes from `globals.css`. Keep shared buttons, blog, article, header accessibility, focus, and shell rules that remain in use.

- [ ] **Step 7: Run component, integration, lint, and type gates**

Run:

```bash
pnpm test -- src/components/home
pnpm lint
pnpm typecheck
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build
```

Expected: all commands PASS; build prerenders `/`, `/blog`, and `/blog/first-agent-system`.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/globals.css src/app/profile.css src/components/home tests/e2e/home.spec.ts
git commit -m "feat: compose reference-style recruiting homepage"
```

---

### Task 9: Remove WebGL dependencies and prove bundle isolation

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tests/e2e/blog.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts`
- Create: `src/lib/dependency-boundary.test.ts`
- Delete: all `src/components/scene/*`
- Delete: `src/lib/webgl.ts`
- Delete: `src/lib/webgl.test.ts`
- Delete: `src/lib/scene-performance.ts`
- Delete: `src/lib/scene-performance.test.ts`
- Delete: `src/lib/motion.ts`

**Interfaces:**
- Produces: no runtime dependency on `three`, `@react-three/fiber`, or `motion`.
- Produces: zero `<canvas>` elements on the homepage in both normal and reduced-motion modes.

- [ ] **Step 1: Strengthen the bundle audit before removing dependencies**

Extend the existing script-body audit to visit `/`, `/blog`, and `/blog/first-agent-system` and reject these signatures:

```ts
const forbiddenHomepageSignatures = [
  /WebGLRenderer/,
  /@react-three[\\/]fiber/i,
  /THREE\.Clock/,
  /agent-network-scene/,
];
```

Also assert `page.locator("canvas")` has count zero on `/` in normal and reduced-motion tests. Add a package-boundary unit test:

```ts
import packageJson from "../../package.json";

it("keeps the homepage free of WebGL and animation runtimes", () => {
  expect(packageJson.dependencies).not.toHaveProperty("@react-three/fiber");
  expect(packageJson.dependencies).not.toHaveProperty("three");
  expect(packageJson.dependencies).not.toHaveProperty("motion");
});
```

- [ ] **Step 2: Run the bundle/canvas tests to verify RED**

Run:

```bash
pnpm test -- src/lib/dependency-boundary.test.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/blog.spec.ts tests/e2e/reduced-motion.spec.ts --project=chromium
```

Expected: the package-boundary test FAILS because all three dependencies are still declared. The E2E audit may already pass after Task 8 makes the code unreachable; record both results.

- [ ] **Step 3: Remove packages and obsolete code**

Run:

```bash
pnpm remove @react-three/fiber three motion
```

Delete the scene and scene-performance/WebGL files listed above. Use `rg -n '@react-three|from "three"|SceneLoader|agent-network|WebGLRenderer|from "motion' src package.json` and require zero matches outside tests that intentionally list forbidden signatures.

- [ ] **Step 4: Run focused and build verification**

Run:

```bash
pnpm install --frozen-lockfile --offline
pnpm lint
pnpm typecheck
pnpm test -- src/lib/dependency-boundary.test.ts
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm build
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/blog.spec.ts tests/e2e/reduced-motion.spec.ts --project=chromium
```

Expected: all commands PASS; no homepage canvas and no forbidden signature in loaded script bodies.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/dependency-boundary.test.ts tests/e2e/blog.spec.ts tests/e2e/reduced-motion.spec.ts
git add -u -- src/components/scene src/lib/webgl.ts src/lib/webgl.test.ts src/lib/scene-performance.ts src/lib/scene-performance.test.ts src/lib/motion.ts
git commit -m "perf: remove homepage webgl runtime"
```

---

### Task 10: Complete accessibility, responsive, visual, and production acceptance

**Files:**
- Modify: `tests/e2e/home.spec.ts`
- Create: `tests/e2e/server-rendering.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/responsive.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`
- Replace: homepage snapshot files under `tests/e2e/visual.spec.ts-snapshots/`
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete homepage from Tasks 1–9.
- Produces: executable acceptance evidence for all design requirements.

- [ ] **Step 1: Write or update E2E assertions before baseline changes**

Cover:

- Exact H1 `cxzg007 Profile`, real identity, role, education, CTAs, and section order.
- Three internship cards with sticky positioning at desktop, visible logos, alternating layout hooks, and no disclosure dependency.
- Four accessible system tabs and keyboard navigation.
- Seven Semantica PR links, two merged statuses, two project honors, and both public destinations.
- Three academic honors.
- Writing single-post behavior and contact links.
- One active navigation link after scrolling each section.
- No horizontal overflow at 390, 768, 1280, 1440, and 1920 widths.
- Static layout with reduced motion and at widths `<=760px`.
- Homepage and blog axe scans with zero WCAG 2.1 A/AA violations.
- With `test.use({ javaScriptEnabled: false })`, server HTML still exposes `cxzg007 Profile`, all three company names, the Semantica background, all honor titles, email, GitHub, and resume destinations.

Create `tests/e2e/server-rendering.spec.ts` with JavaScript disabled for the whole file:

```ts
import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("core recruiting content is server rendered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "cxzg007 Profile" })).toBeVisible();
  for (const company of ["京东", "智元机器人", "中国船舶集团 722 研究所"]) {
    await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/面向 AI Agent 的图原生上下文与可审计基础设施/)).toBeVisible();
  await expect(page.getByText("#1 Repository of the Day")).toBeVisible();
  await expect(page.getByRole("link", { name: /发送邮件/ })).toHaveAttribute("href", "mailto:jiangjunjie_tj@foxmail.com");
  await expect(page.getByRole("link", { name: /GitHub/ }).last()).toHaveAttribute("href", "https://github.com/cxzg007");
  await expect(page.getByRole("link", { name: /简历/ }).last()).toHaveAttribute("href", "/resume.pdf");
});
```

- [ ] **Step 2: Run functional E2E tests to capture RED**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/server-rendering.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/responsive.spec.ts tests/e2e/reduced-motion.spec.ts
```

Expected: any missing interaction, geometry, or accessibility requirement fails before visual baselines are updated.

- [ ] **Step 3: Fix only evidence-backed defects**

For each failure, add the smallest CSS, semantic markup, keyboard handler, or motion-controller correction. Do not weaken geometry or accessibility assertions to accept clipped, hidden, or unfocusable content.

- [ ] **Step 4: Replace homepage visual scenarios**

Use these screenshot cases:

- `profile-hero-1440.png`
- `profile-information-1440.png`
- `sticky-internships-1440.png`
- `system-tabs-1440.png`
- `open-source-honors-1440.png`
- `writing-contact-1440.png`
- `homepage-narrative-1920.png`
- `homepage-1280.png`
- Static tablet/mobile homepage snapshots only for overflow/content regression.
- Keep existing blog index and article detail snapshots, updating them only if shared header tokens intentionally change.

Generate with:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots
```

Expected: visual tests write new baselines without unrelated blog changes.

- [ ] **Step 5: Inspect every new baseline manually**

Reject and fix any baseline showing:

- clipped `cxzg007 Profile` text;
- real name or education outside the first hero/dock narrative;
- stretched logo;
- sticky card hidden under the 54px header;
- empty Semantica logo;
- inactive project panel visible;
- excessive blank bands caused by incorrect sticky section height;
- unreadable low-contrast copy;
- mobile horizontal clipping.

- [ ] **Step 6: Run the complete gate**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify
pnpm audit --prod
git diff --check
```

Expected: lint, typecheck, all Vitest suites, content validation, production build, all Playwright projects, audit, and diff check PASS.

- [ ] **Step 7: Run desktop browser acceptance against production build**

Start `pnpm start` from the successful build and inspect `1280×800`, `1440×900`, and `1920×1080`. Verify navigation activation, sticky cards, system tabs, Semantica links, writing stage, contact links, zero canvas, no console errors, and no layout shift after logos load. Also inspect 390px once for content completeness and overflow only.

- [ ] **Step 8: Update README**

Document:

- how to edit `technicalId`, structured contributions, academic honors, four system cases, and MDX posts;
- that the homepage intentionally has no WebGL/Three.js runtime;
- the exact verification command `NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify`;
- Vercel deployment remains separate from local completion and is not claimed until a READY production deployment is observed.

- [ ] **Step 9: Commit final acceptance artifacts**

```bash
git add tests/e2e README.md
git commit -m "test: lock reference profile acceptance"
```

- [ ] **Step 10: Request final code review**

Use `superpowers:requesting-code-review` against the complete diff from the design commit. Require no Critical or Important findings before pushing or deploying. If findings arrive, use `superpowers:receiving-code-review`, reproduce each issue, fix with a failing regression test, and rerun the complete gate.

---

## Final Production Handoff

After all ten tasks and final review are approved:

1. Confirm `git status --short` contains no tracked or accidental deployment artifacts.
2. Push the reviewed branch to GitHub.
3. Deploy the reviewed commit to Vercel production.
4. Confirm the production deployment is `READY` and its Git commit SHA matches the pushed commit.
5. Open the stable production alias and recheck the hero, one sticky internship transition, all four system tabs, Semantica logo/PR links/honors, one article link, resume response headers, and browser console.
6. Report the GitHub commit, production deployment URL, and any external residual checks separately; do not claim deployment before the READY state is observed.
