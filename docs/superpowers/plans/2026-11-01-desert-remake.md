# Desert Remake Implementation Plan

**Goal:** Rebuild the gear battler to follow the reference's desert arena and portrait flow.
**Architecture:** Retain the existing simulation, separate rendering and styling, add pointer controls. Single static entry point with no build requirement.
**Tech stack:** HTML, CSS, browser JavaScript, Canvas, inline SVG; Node tests and Playwright for verification.

## Tasks
- [x] Capture regression scenarios for disconnected chains, purchase costs, merging, and combat; run `node --test tests/game.test.cjs` before changes.
- [x] Extract existing logic to `game.js`; add original unit art through `art.js`; replace `index.html` and `styles.css` with the desert portrait layout and desktop surround.
- [x] Add pointer dragging that shares tap validation; add helpful empty and battle states, deck cards, skill progression and summon presentation.
- [x] Harden saved-state loading and action validation. Verify malformed saves, maximum-level merges and wave rewards.
- [x] Run Node tests, browser interaction checks at 390x844 and 1440x1000, inspect screenshots and fix overflow or visual defects.
- [x] Update README and DESIGN with controls, current rules, testing commands and reference limitations.

## Acceptance
`node --test tests/game.test.cjs` passes; browser reports no console/page errors; connected crew spawns and wins first wave; drag purchases and merges work; reload retains progress; all tabs work; phone has no horizontal overflow.
