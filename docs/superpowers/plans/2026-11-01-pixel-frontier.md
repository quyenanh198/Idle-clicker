# Pixel Frontier implementation plan

**Goal:** Apply the approved pixel-frontier theme with animated sprites and a connected equal-sized gear grid.
**Architecture:** Keep game state/simulation in game.js; raster sprite drawing and asset metadata in art.js; replace styles.css; bundle generated PNG assets under assets/pixel/.

- [x] Add failing graph and visual regression tests for equal-size gears and occupied-neighbor shafts.
- [x] Generate and inspect background, infantry, fort and gear atlases; copy final assets into the repository and record generation prompts.
- [x] Implement pixel asset loading, equal-cell atlas cropping, pixel UI icons, landscape and fort rendering.
- [x] Implement gearNetwork() edges/parity and display links, uniform gear dimensions and synchronized opposite rotation.
- [x] Add simulation-driven walk/attack/hit states, transient shots/debris and reduced-motion behavior.
- [x] Rebuild responsive layout as battle above underground engine/recruitment panels; restyle other screens.
- [x] Run unit and browser suites; inspect mobile/desktop build, battle, deck and skills captures; fix visual defects.
- [x] Update documentation, get code review and commit the verified result.
