# Personal Portal Recruiting Conversion Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing warm desktop portfolio faster to scan for AI Agent/backend campus recruiting while preserving verified content, accessibility, and the current Next.js/Vercel architecture.

**Architecture:** Keep the homepage as a Server Component composition fed by `site-content.json`. Reduce duplication at the page/component layer, derive compact internship and open-source presentations from existing validated data, and use CSS plus the existing motion controller for progressive visual treatment. No new runtime dependency or content backend is introduced.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Vitest + Testing Library, Playwright.

## Global Constraints

- Desktop-first refinement; preserve current tablet/mobile behavior but do not create a new mobile design.
- Do not invent performance numbers, responsibility scope, PR state, awards, or project facts.
- Do not display GitHub Trending/Trendshift honors until a traceable source is modeled in content.
- Do not add Three.js or another animation dependency.
- Every behavior change follows RED → GREEN TDD.
- Before production edits, read `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`, `11-css.md`, `12-images.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md` as required by `AGENTS.md`.
- Preserve the existing production URL contract and run final verification with `NEXT_PUBLIC_SITE_URL=https://portfolio.example.test`.

---

## File Map

- Modify `src/app/page.tsx`: remove duplicated profile-information stage and prevent duplicate section titles.
- Modify `src/app/profile.css`: compact hero, add CTA variants, condensed internship/details styles, dark open-source visual anchor, writing/contact refinements, and reduced-motion rules.
- Modify `src/components/home/profile-hero.tsx`: technical-ID-only heading and three conversion actions.
- Modify `src/components/home/profile-hero.test.tsx`: specify the new hero contract.
- Delete `src/components/home/profile-info.tsx` and `src/components/home/profile-info.test.tsx`: remove redundant homepage unit.
- Modify `src/components/home/internship-story-card.tsx`: concise visible outcomes plus native details disclosure.
- Modify `src/components/home/internship-story-card.test.tsx`: specify three visible outcomes and accessible full-detail disclosure.
- Modify `src/components/home/open-source-showcase.tsx`: featured PR derivation, statistics, capability labels, and remaining-PR disclosure.
- Modify `src/components/home/open-source-showcase.test.tsx`: specify merged-only selection and fallback behavior.
- Modify `src/components/home/writing-stage.tsx` and its test: one-article card with `h3`, not a duplicate chapter `h2`.
- Modify `src/components/home/contact-stage.tsx` and its test: content-only section body plus resume/email/GitHub actions.
- Modify `tests/e2e/home.spec.ts`: recruiter-path assertions and disclosure behavior.
- Modify `tests/e2e/accessibility.spec.ts`: unique IDs and heading hierarchy.
- Modify `tests/e2e/reduced-motion.spec.ts`: new reveal states are inert with reduced motion.
- Modify `tests/e2e/visual.spec.ts` and affected snapshots: remove the retired information-stage baseline and approve the new desktop states.

---

### Task 1: Recruiter-first hero and page structure

**Files:**
- Modify: `src/components/home/profile-hero.test.tsx`
- Modify: `src/components/home/profile-hero.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/profile.css`
- Delete: `src/components/home/profile-info.tsx`
- Delete: `src/components/home/profile-info.test.tsx`
- Test: `src/components/home/profile-hero.test.tsx`

**Interfaces:**
- Consumes: `SiteContent["profile"]`, including `technicalId`, `github`, `education`, and existing `ProfileDock` rendering.
- Produces: one `h1` named `cxzg007`; links to `#internships`, `/resume.pdf`, and the configured GitHub URL; homepage sequence with no `#info` section.

- [ ] **Step 1: Read the local Next.js 16 guidance**

Run:

```bash
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
sed -n '1,240p' node_modules/next/dist/docs/01-app/01-getting-started/12-images.md
sed -n '1,240p' node_modules/next/dist/docs/03-architecture/accessibility.md
```

- [ ] **Step 2: Write the failing hero contract test**

Replace the old `cxzg007 Profile` and missing-resume expectations with assertions equivalent to:

```tsx
expect(screen.getByRole("heading", { level: 1, name: "cxzg007" })).toBeVisible();
expect(screen.queryByText("cxzg007 Profile")).not.toBeInTheDocument();
expect(screen.getByRole("link", { name: "查看实习" })).toHaveAttribute("href", "#internships");
expect(screen.getByRole("link", { name: "下载简历 PDF" })).toHaveAttribute("href", "/resume.pdf");
expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", profile.github);
```

- [ ] **Step 3: Run RED**

Run: `pnpm test -- src/components/home/profile-hero.test.tsx`

Expected: FAIL because the heading still contains `Profile` and resume/GitHub actions are absent from the hero action group.

- [ ] **Step 4: Implement the compact hero and remove duplicated info composition**

Render `profile.technicalId` as the only `h1` text. Add `/resume.pdf` with `aria-label="下载简历 PDF"`, and add the external GitHub link with `target="_blank" rel="noreferrer"`. Remove the `ProfileInfo` import and the entire `#info` stage from `page.tsx`; remove `信息` from the header navigation if it still targets the deleted ID. Delete the now-unused component and its test.

In `profile.css`, reduce the desktop hero's unused vertical space and size the dock so its name, both education rows, recruiting status, and actions fit the intended 1280×720 first-view composition without overlap. Keep existing narrow-breakpoint safety rules.

- [ ] **Step 5: Run GREEN and static checks**

Run:

```bash
pnpm test -- src/components/home/profile-hero.test.tsx src/components/home/profile-dock.test.tsx
pnpm typecheck
```

Expected: all selected tests and typecheck pass; no import references `ProfileInfo`.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/profile.css src/components/home/profile-hero.tsx src/components/home/profile-hero.test.tsx src/components/home/profile-info.tsx src/components/home/profile-info.test.tsx src/components/shell/header.tsx
git commit -m "feat: focus homepage hero on recruiting"
```

---

### Task 2: Condense internship stories without losing evidence

**Files:**
- Modify: `src/components/home/internship-story-card.test.tsx`
- Modify: `src/components/home/internship-story-card.tsx`
- Modify: `src/app/profile.css`

**Interfaces:**
- Consumes: existing `Internship` fields only; no schema or JSON factual changes.
- Produces: `results.slice(0, 3)` as the visible outcome list and a `<details>` named `查看{company}工程细节` containing every `highlight`.

- [ ] **Step 1: Write failing disclosure tests**

Specify a named visible result list and a details disclosure:

```tsx
const outcomes = within(card).getByRole("list", { name: `${internship.company} 核心成果` });
expect(within(outcomes).getAllByRole("listitem")).toHaveLength(Math.min(3, internship.results.length));
const disclosure = within(card).getByText(`查看${internship.company}工程细节`);
expect(disclosure.closest("details")).not.toHaveAttribute("open");
expect(within(disclosure.closest("details")!).getAllByRole("listitem")).toHaveLength(
  internship.highlights.length,
);
```

Retain assertions for company, team, role, period, Logo, journey, context, ownership, and stack.

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/components/home/internship-story-card.test.tsx`

Expected: FAIL because results are paragraphs and capability records are always exposed outside a details disclosure.

- [ ] **Step 3: Implement semantic summary and disclosure**

Render results as `<ul aria-label="{company} 核心成果">`; wrap all highlights in native `<details className="internship-details">` with `<summary>查看{company}工程细节</summary>`. Keep `EngineeringJourney` always visible. Do not introduce state or a client boundary.

Update CSS so the company/role row is scannable, the result list has strong contrast, details are visually subordinate, and the three cards consume materially less vertical space. Keep Logo aspect ratios and existing alternating desktop layout.

- [ ] **Step 4: Run GREEN**

Run: `pnpm test -- src/components/home/internship-story-card.test.tsx src/components/home/sticky-internship-stack.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/internship-story-card.tsx src/components/home/internship-story-card.test.tsx src/app/profile.css
git commit -m "feat: condense internship engineering stories"
```

---

### Task 3: Turn open-source history into a credibility summary

**Files:**
- Modify: `src/components/home/open-source-showcase.test.tsx`
- Modify: `src/components/home/open-source-showcase.tsx`
- Modify: `src/app/profile.css`

**Interfaces:**
- Consumes: `OpenSourceProject.contributions` and filters strictly on `status === "merged"`.
- Produces: exported `selectFeaturedContributions(project): { featured; remaining }`, preferring PRs `1226`, `1081`, and `1094` in that order and filling from other merged PRs if needed.

- [ ] **Step 1: Write failing selection and rendering tests**

Add pure-function coverage:

```tsx
expect(selectFeaturedContributions(openSource).featured.map(({ number }) => number)).toEqual([
  1226, 1081, 1094,
]);
expect(selectFeaturedContributions(openSource).remaining).toHaveLength(merged.length - 3);
```

Render assertions must find `10` under an accessible `已合并 PR` statistic, a list named `Semantica 代表性贡献` with exactly three links, and a closed details element labelled `查看其余 7 个已合并 PR`. Assert open PR numbers and `Trending` are absent.

Add a fixture variant missing PR 1226 and verify another merged PR fills the third slot without selecting an open PR.

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/components/home/open-source-showcase.test.tsx`

Expected: FAIL because all ten links are currently rendered in one list and the selector is missing.

- [ ] **Step 3: Implement featured/remaining derivation and layout**

Implement the pure selector with a preferred-number array and a `Set` to avoid duplication. Render:

- Logo, contributor identity, project title, and background;
- merged count plus capability labels `图数据适配`, `规则推理`, `执行链路`;
- three featured external links;
- remaining merged links in native details;
- repository and article actions.

Style the containing `profile-stage--terracotta` open-source stage via an additional `profile-stage--open-source` class so it uses a deep coffee background, warm-orange accents, and WCAG-compliant light text. Do not globally darken the contact stage, which shares the existing terracotta modifier.

- [ ] **Step 4: Run GREEN and contrast-focused E2E**

Run:

```bash
pnpm test -- src/components/home/open-source-showcase.test.tsx
pnpm exec playwright test tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: unit suite passes; axe checks report no serious/critical violation in the changed section.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/open-source-showcase.tsx src/components/home/open-source-showcase.test.tsx src/app/page.tsx src/app/profile.css
git commit -m "feat: highlight open source impact"
```

---

### Task 4: Simplify writing/contact hierarchy and finish motion states

**Files:**
- Modify: `src/components/home/writing-stage.test.tsx`
- Modify: `src/components/home/writing-stage.tsx`
- Modify: `src/components/home/contact-stage.test.tsx`
- Modify: `src/components/home/contact-stage.tsx`
- Modify: `src/components/home/page-motion-controller.test.tsx`
- Modify: `src/components/home/page-motion-controller.tsx` only if the existing controller cannot expose the required section state
- Modify: `src/app/profile.css`

**Interfaces:**
- Consumes: outer section headings from `page.tsx`; `PostMeta`; `SiteContent["profile"]`.
- Produces: article title at `h3`; contact body without a second chapter heading; contact links for PDF, email, and GitHub; CSS-only staged transitions keyed from existing motion data attributes.

- [ ] **Step 1: Write failing heading/action tests**

For one article, require an `h3` named after the post and no internal `h2`. For contact, require no heading inside `ContactStage` and exactly three links:

```tsx
expect(screen.getByRole("heading", { level: 3, name: "文章 1" })).toBeVisible();
expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
expect(screen.getByRole("link", { name: "下载简历 PDF" })).toHaveAttribute("href", "/resume.pdf");
```

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm test -- src/components/home/writing-stage.test.tsx src/components/home/contact-stage.test.tsx
```

Expected: FAIL because both units currently create duplicate `h2` semantics and contact omits the PDF action.

- [ ] **Step 3: Implement semantic hierarchy and actions**

Change the single-post title to `h3`. Replace the nested contact `<section>` with a non-sectioning content container, remove its repeated title, and add `/resume.pdf` with an accessible PDF label. Keep mailto and external GitHub behavior unchanged.

Use CSS transitions on existing reveal/motion attributes for Logo, copy, outcomes, and architecture nodes. If the controller already sets section-level reveal state, do not modify its JavaScript. Only add a controller state when a failing test proves the CSS has no usable hook. Add `@media (prefers-reduced-motion: reduce)` overrides that remove transforms, transitions, and stagger delays.

- [ ] **Step 4: Run GREEN and reduced-motion tests**

Run:

```bash
pnpm test -- src/components/home/writing-stage.test.tsx src/components/home/contact-stage.test.tsx src/components/home/page-motion-controller.test.tsx
pnpm exec playwright test tests/e2e/reduced-motion.spec.ts --project=chromium
```

Expected: all selected tests pass and reduced-motion content is immediately visible.

- [ ] **Step 5: Apply the React best-practices review**

Review changed TSX for unnecessary client boundaries, inline component definitions, duplicate global listeners, and excess serialized props. Confirm all changed presentation components remain Server Components unless browser state is essential.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/writing-stage.tsx src/components/home/writing-stage.test.tsx src/components/home/contact-stage.tsx src/components/home/contact-stage.test.tsx src/components/home/page-motion-controller.tsx src/components/home/page-motion-controller.test.tsx src/app/profile.css
git commit -m "fix: clarify homepage content hierarchy"
```

---

### Task 5: End-to-end recruiter path and visual acceptance

**Files:**
- Modify: `tests/e2e/home.spec.ts`
- Modify: `tests/e2e/accessibility.spec.ts`
- Modify: `tests/e2e/reduced-motion.spec.ts`
- Modify: `tests/e2e/visual.spec.ts`
- Delete: `tests/e2e/visual.spec.ts-snapshots/chromium/profile-information-1440.png`
- Update: affected PNG snapshots under `tests/e2e/visual.spec.ts-snapshots/`

**Interfaces:**
- Consumes: final homepage public DOM and local `/resume.pdf`.
- Produces: regression coverage for the recruiter scan path and approved desktop visual baselines.

- [ ] **Step 1: Write failing recruiter-path E2E assertions**

At 1280×720, assert the initial viewport includes `cxzg007`, `江俊杰`, `2027`, `AI Agent / 后端开发`, and all three hero actions. Assert `#info` count is zero and all rendered IDs are unique:

```ts
const duplicateIds = await page.locator("[id]").evaluateAll((nodes) => {
  const ids = nodes.map((node) => node.id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
});
expect(duplicateIds).toEqual([]);
```

Verify three internship company names, open one engineering-details disclosure with keyboard input, switch a system Tab, find exactly three representative PRs, expand remaining PRs, and verify resume/email/GitHub endpoints.

- [ ] **Step 2: Run RED**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts --project=chromium
```

Expected: pre-change selectors/structure or screenshots fail until all tasks are integrated.

- [ ] **Step 3: Update visual cases and snapshots intentionally**

Remove the retired `profile-information-1440` case. Keep focused captures for hero, internships, systems, open source, and writing/contact. Run once without snapshot updates, inspect diffs, then update only the expected files:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/visual.spec.ts --project=chromium
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm exec playwright test tests/e2e/visual.spec.ts --project=chromium --update-snapshots
```

Manually inspect updated screenshots for clipping, Logo distortion, unreadable contrast, excess blank space, and accidental mobile redesign.

- [ ] **Step 4: Run the full verification gate**

Run:

```bash
NEXT_PUBLIC_SITE_URL=https://portfolio.example.test pnpm verify
git diff --check
git status --short
```

Expected: lint and typecheck exit 0; all Vitest tests pass; content validation and Next production build pass; all Playwright projects pass; diff check reports no whitespace errors. `git status` may list only the user's pre-existing untracked artifacts plus intentional task changes.

- [ ] **Step 5: Production browser acceptance**

Start the built server, inspect the homepage at the normal desktop viewport, and verify:

- hero content and three actions;
- each company Logo and compact card;
- details keyboard disclosure;
- project Tab transitions;
- dark open-source section and representative PR links;
- single writing/contact heading hierarchy;
- no horizontal overflow or console error.

- [ ] **Step 6: Commit final E2E and snapshots**

```bash
git add tests/e2e/home.spec.ts tests/e2e/accessibility.spec.ts tests/e2e/reduced-motion.spec.ts tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots
git commit -m "test: cover recruiting homepage journey"
```
