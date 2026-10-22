# Room entrance implementation plan

**Goal:** Make the retro room the public entrance, keep the complete portfolio at `/about`, and remove the latent space.

**Architecture:** Reuse the isolated iframe experience at `/`; move the portfolio server page to `/about`. Keep a server-rendered learn-more link available throughout loading and recovery. Redirect `/playground` to `/`.

**Constraints:** Desktop scope. Preserve source licenses, provenance and original Credits without adding frontend credit UI. Preserve deployed personal content and monitor loading fixes. Deploy from this production worktree.

- [x] Move page and metadata; update header, blog and desktop links.
- [x] Remove latent routes, components, poster and unused root Three dependencies; update sitemap.
- [x] Adapt portfolio tests and exercise entrance, no-JS navigation, redirects, absent latent routes, 3D/2D recovery and blog return links.
- [x] Run lint, typecheck, unit tests, vendor build, production build and desktop browser checks.
- [ ] Commit, stage a production deployment, verify, promote and check the public domain.

Validation: lint, TypeScript and production build passed; 234 unit tests passed. Desktop entrance, routing, metadata, portfolio and blog checks passed (38 cases across the initial run and targeted reruns), plus /about Axe audit. Browser screenshots verified the room toolbar and retained portfolio layout. Source review confirmed original content and attribution files unchanged.
