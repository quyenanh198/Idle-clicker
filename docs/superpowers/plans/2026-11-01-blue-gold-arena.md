# Blue and gold arena implementation

Approved direction: UI and composition inspired by the supplied video, replacing the rejected pastel design.

- [x] Change the desktop layout test to require a full-width arena with centered gears; verify it fails on the old layout.
- [x] Replace styles.css completely with navy/royal-blue panels, gold navigation, outlined display text, bright green Fight action and a single-arena layout.
- [x] Restyle Skills, Deck, Summon, help, currencies and feedback in the same visual language.
- [x] Draw original saturated cartoon fighters, beveled metal gears, mobile battle forts and canyon scenery in art.js.
- [x] Adapt the canvas to wide frames without retaining the old 400px logical-height floor; preserve pointer mapping and simulation coordinates.
- [x] Verify mobile mouse/touch drags, short desktop layout, saves, keyboard controls, combat and enemy taps after resize.
- [x] Capture actual build/battle screens on desktop/mobile and inspect the result.
- [x] Update current design documentation while preserving earlier specs as revision history.

Validation: npm test; npm run test:browser; git diff --check. Screenshots live in .screenshots/ and are intentionally excluded from source control.
