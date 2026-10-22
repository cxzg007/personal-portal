# Room contributions and portfolio entry

**Goal:** Projects tells the Semantica contribution story; the learn-more link blends into the room toolbar and plays the existing portfolio entrance on explicit room-to-portfolio navigation.

**Design:** Keep charcoal #242424, surface #101010, text #f4f1e9, muted #b9b9b6 and hairline #55534f. Use existing mono identity type and sans-serif link text. The link is a restrained text label with a thin underline and small right arrow; no solid card. Arrow movement is a 180ms CSS transform on fine-pointer hover, disabled under reduced motion. Keep the 52px toolbar and existing room layout.

**Content:** Reuse the stored Semantica background, maintainer role, contribution themes, PR URLs and explicitly dated snapshot. Derive counts from the stored contributions. No repeated internship case studies or new claims about current PR state.

**Animation:** Use a document navigation for learn-more so the existing pre-paint inline bootstrap runs. Permit intentional navigation from the room or nested desktop despite prior visits, while reload/history/blog return/anchors/reduced motion retain current static behavior. Keep the original choreography and interruption handling.

- [x] Reproduce the room-origin entrance failure with regression tests.
- [x] Update Projects, toolbar and entrance eligibility; rebuild vendor assets.
- [x] Verify unit, build, desktop click paths, animation states, reduced motion and screenshots.
- [ ] Commit, deploy staged, verify, promote and check the public domain.

Validation: the 3 room-origin regression cases failed before the fix and passed afterwards; all 240 unit tests, lint, TypeScript, vendor build and production build passed. All 24 desktop entrance/playground tests passed, including repeated room arrivals, desktop iframe entry, reload/blog return, reduced motion, interruption and no-JS access. Inspected screenshots of the toolbar and Projects at the top and contribution detail.
