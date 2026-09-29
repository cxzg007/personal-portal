# Engineering Showcase Implementation Plan

> **For agentic workers:** Use subagent-driven-development for the independently scoped replay component and review; integrate the page in the current session. User approved the visual direction and desktop-only scope on 2026-09-29.

**Goal:** Deliver a desktop engineering portfolio with one meaningful, operable Agent replay exhibit.

**Architecture:** Preserve server-rendered profile and content sections. Isolate the replay state machine and SVG scene in a small client component. Scope new styling to the homepage so the recently completed blog retains its reading design.

**Tech Stack:** Installed Next.js / React / TypeScript, CSS Modules, SVG, Vitest, Playwright.

## Global Constraints

- Baseline `53cc651` is pushed to `design/ui-ux-homepage`; implementation branch `design/engineering-showcase` reuses the clean isolated worktree.
- Desktop acceptance: 1280, 1440, 1920px. User deferred mobile adaptation.
- Read installed Next guides before implementation (server/client, use-client, CSS, fonts).
- All replay data is explicitly illustrative; never perform external actions.
- Keep actual content and source evidence intact; no unverified metrics.
- No page-wide client conversion, animation dependency or WebGL runtime.
- Do not change blog reading CSS or introduce a runtime font request to Google.

### Task 1: Interactive replay exhibit

**Files:** create `src/components/home/agent-replay/{agent-replay.tsx,agent-replay.module.css,replay-model.ts,agent-replay.test.tsx}`.

**Interface:** `export function AgentReplay(): React.JSX.Element`; parent supplies a dark 650–760px-wide area. The component owns its heading and controls and imports no site content.

- [x] Add tests that render `<AgentReplay />`, select read-only permissions, advance the range to the end, and assert a blocked outcome with no successful submission.
- [x] Verify red: `pnpm exec vitest run src/components/home/agent-replay/agent-replay.test.tsx`.
- [x] Implement deterministic reducer/state projection. Stages are task/context/plan/policy/result. Range labels are human-readable. Scene selection resets progress; seeking pauses. Playback terminates; cleanup releases timers on unmount, hidden tab or offscreen state.
- [x] Render a bespoke SVG perspective scene with blue paths, raised platforms and plain-language current-event detail. Default is static and controls disabled until hydration. Include noscript explanation. Native range + buttons operate by keyboard.
- [x] Verify green with the same unit command, lint covering new files and TypeScript. Report commands and outcomes to parent, commit only owned files.

### Task 2: Homepage composition and project presentation

**Files:** modify `src/app/page.tsx`, `src/components/home/profile-hero.tsx`, `src/components/home/internship-story-card.tsx`; create `src/app/showcase.css`, `src/components/home/project-artwork.tsx` and associated CSS Module; update `src/components/home/profile-hero.test.tsx`.

**Interface:** homepage adds `engineering-showcase` scope. `ProfileHero` uses existing profile/internships props and renders `<AgentReplay />`. Static `ProjectArtwork({id}: {id:string})` illustrates each actual engineering theme with captions stating schematic intent.

- [x] Update hero test to assert a headline about reliable Agent systems, real identity and existing actions/index; verify it fails against the baseline.
- [x] Build asymmetric dark hero, educational dock and horizontal company strip. Use actual data and existing anchors.
- [x] Give sections typographic intros and visually differentiated project, open-source, writing and contact treatments. Keep disclosure content and source links.
- [x] Use schematics for ontology/rules, data replay and RAG in the actual internship panels; captions identify them as conceptual illustrations.
- [x] Scope new CSS and locally hosted display font; keep blog untouched.
- [x] Check unit tests, lint, TypeScript and production build.

### Task 3: Desktop integration, visual checks and review

**Files:** create `tests/e2e/engineering-showcase.spec.ts`; update `tests/e2e/{home,theme,visual}.spec.ts` to match approved visual contract; record `docs/superpowers/reports/2026-09-29-engineering-showcase.md`.

- [x] Test native range keyboard control, playback/reset, both permission outcomes, route cleanup, no-JS static content, no duplicate IDs and desktop overflow.
- [x] Assert deliberate dark hero / light reading sections; preserve keyboard focus and functional tests.
- [x] Run production preview at port 3103. Capture 1280/1440/1920 desktop views; inspect before updating changed desktop baselines.
- [x] Run full unit suite, lint, TypeScript, production build and Chromium E2E. Blog visual baselines must remain unchanged.
- [x] Review diff independently for design/spec compliance and correctness; resolve material findings and rerun only affected checks.
- [x] Save implementation commit and new remote branch; leave production on baseline. Supply preview and commit details to user.
