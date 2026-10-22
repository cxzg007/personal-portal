# Sources and attribution

Original design and implementation: **Henry Heffernan**.

- 3D room: `https://github.com/henryjeff/portfolio-website`, commit
  `c53c5a50183655eb83d70048403a5084f5d1214c`. MIT license is retained in
  `room/LICENSE.txt`.
- Desktop: `https://github.com/henryjeff/portfolio-inner-site`, commit
  `23cf84acd5c76d2c719e1d04c3d976dc4b0b49f8`. This revision contains no license
  file. The room's MIT license does not grant a license for the separate desktop,
  its fonts, game bundles or other third-party media.
- DOSBox runtime and game bundles: upstream desktop `public/js-dos`,
  `public/doom.jsdos`, `public/trail.jsdos`, `public/scrabble.jsdos`. They retain
  their original in-game credits. DOSBox/js-dos and bundled game assets have
  separate terms from the website code.
- UI fonts and icons: upstream desktop `src/assets/fonts` and `src/assets/icons`.
  The original Adobe Typekit fonts are not redistributed or remotely embedded.
- Room geometry, baked textures, monitor video layers and sounds: upstream room
  `static`. Original credits identify Henry Heffernan, Mickael Boitte, Sean Nicolas,
  Sound Cassette and Microsoft for their respective contributions.
- `room-preview.jpg` is captured from this local reproduction of the room.

Local adaptation: Jiang Junjie's personal portal. Original contributor credits
are retained in `vendor/henry/desktop/src/components/applications/Credits.tsx`;
the Credits app is not registered or displayed in the frontend. These materials are not presented as
an original design by the portal owner or as universally MIT-licensed.

Source and reproducible build instructions: `vendor/henry/README.md` in the portal
repository. Bundler-preserved third-party notices are next to the app bundles.
