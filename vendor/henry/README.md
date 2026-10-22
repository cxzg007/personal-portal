# Henry Heffernan retro room

This is the local source for **复古电脑房间** within the homepage's **交互实验**
section and `/playground`. The existing `/lab/latent` experiment remains alongside it.
The room uses the original geometry, baked textures, cameras, CRT layers and
audio. The desktop retains the original windows, shortcuts, taskbar and games.
Original credits remain in source only. Personal showcase pages read
`content/site-content.json` at build time.

## Upstream

| Source | Pinned revision | License supplied by upstream |
| --- | --- | --- |
| `https://github.com/henryjeff/portfolio-website` | `c53c5a50183655eb83d70048403a5084f5d1214c` | MIT, retained in `room/LICENSE.md` |
| `https://github.com/henryjeff/portfolio-inner-site` | `23cf84acd5c76d2c719e1d04c3d976dc4b0b49f8` | No license file in this revision; the room's MIT license does not cover this separate repository |

Author: Henry Heffernan. Original site: `https://henryheffernan.com/`.
Original model and audio contributor credits are retained in
`desktop/src/components/applications/Credits.tsx`, outside the runtime app registry. This local
adaptation is not presented as an original design by Jiang Junjie.

The desktop and its bundled games/fonts/media have their own provenance; they
are not relicensed under the room's MIT license. See the public `SOURCES.md`.

## Build

From the portal root:

```sh
pnpm build:playground
```

This installs the isolated, locked React 17 / Three.js toolchain and regenerates
the two static apps. Re-run after modifying the vendor source or portal content.
Generated assets in `public/experiments/henry` are committed with the source, so
the ordinary `pnpm dev` and `pnpm build` need no legacy dependencies or remote
services. The homepage itself loads only the preview image. The precompressed local JPEG
is served directly to avoid a runtime dependency on image format conversion.

Keep the model, texture, sound, video and DOS files under the public directory;
esbuild emits the app bundles and imported icons/fonts beside them. These are
local files, not downloads performed at runtime. `*-build.json` is ignored build
metadata. The regular Next compiler and ESLint exclude `vendor`.

## Adaptations

- Attribution badges and the Credits desktop app are not displayed. Original
  Credits source, source provenance, license files and copyright comments remain
  in the repository. The boot screen uses neutral personal-computer labels, and
  the Henordle copyright notice is retained as a bundler-preserved comment.
- Two local iframe documents isolate React 17 and the original global CSS from
  Next's React 19 runtime. Returning home or switching views removes the old
  document and its render/audio contexts.
- Frame readiness uses an origin- and source-checked message handshake with a
  replay request, preventing fast cached documents from missing initialization.
  Both the room and its nested desktop must be ready. Asset/WebGL failures,
  failed desktop scripts and a desktop handshake timeout display retry and 2D
  fallback actions.
- The computer screen points to the local desktop. `MemoryRouter` keeps its
  internal pages within the static document, including on reload.
- The BIOS start control supports keyboard activation. Reduced-motion
  preferences default to 2D; visitors can opt into the room. This reproduction
  targets desktop browsers, as requested; no mobile desktop or game adaptation
  is included. The selected mode persists when the viewport changes.
- The desktop uses the upstream bundled Millennium and MSSerif fonts. The
  proprietary Adobe-hosted display font is not redistributed; Georgia is the
  local fallback. This is a deliberate typography difference from the original.
- The desktop's personal biography, experience, projects and contacts come from
  this portal. No requests are made to the original analytics or email endpoint.
- DOSBox and game bundles load only when a game is opened. The original taskbar
  timer is cleaned up on unmount. The retained Credits source records Henry's attribution.

## Verify

```sh
pnpm build:playground
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e tests/e2e/playground.spec.ts --project=chromium
```

The browser tests cover deferred 3D loading, local mode switching, a cached-frame
readiness handshake, reduced-motion defaults and model/desktop failure recovery.
Manual browser checks also cover the original camera transition, window drag,
minimize/restore, and local DOSBox games.
