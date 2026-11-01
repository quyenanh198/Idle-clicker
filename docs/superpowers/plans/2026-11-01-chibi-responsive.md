# Responsive Chibi Revision

User-authorized revision to the current game. Keep simulation and save compatibility.

- [x] Add failing desktop regression test for removed intro panels, frame width and side-by-side engine/battlefield layout.
- [x] Remove the two introduction panels and relocate chain status to the resource header.
- [x] Make the game frame follow viewport dimensions, use a landscape desktop grid and a vertical mobile layout.
- [x] Redraw gear bodies, drive faces, fighter portraits and both towers in rounded pastel chibi style. Create a matching soft desert backdrop.
- [x] Adapt canvas height and pointer coordinate mapping without stretching characters.
- [x] Test touch dragging, viewport overflow, persistence, battle outcomes and tapping an enemy after desktop resize.
- [x] Inspect screenshots at desktop/mobile sizes; correct cog face positioning and update documentation.

Validation: `npm test`, `npm run test:browser`, `git diff --check`. Browser screenshots in `.screenshots/` are regenerated from actual gameplay.
