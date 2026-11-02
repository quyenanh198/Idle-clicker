# Dunegear

[![Build and Test](https://github.com/quyenanh198/Idle-clicker/actions/workflows/ci.yml/badge.svg)](https://github.com/quyenanh198/Idle-clicker/actions/workflows/ci.yml)

A pixel-art gear-building idle battler. Build a mechanical crew engine in an underground workshop and defend a frontier outpost on a ruined desert railway. Works on phones and desktops.

The selected **Pixel Frontier** theme uses locally bundled raster scenery, eight animated troop types, two forts and four equal-sized metal gear materials. Desktop places the battle above the gear workshop and item shop. Mobile stacks battle, engine and recruitment; short windows scroll within the game frame while navigation remains visible.

## Play

Open `index.html` directly, or run `npm start` and visit **http://127.0.0.1:4173**. No build step or runtime package dependencies. Google Fonts are optional; local fallbacks work offline.

- Drag a shop gear next to a golden drive to buy it. Alternatively, tap the offer and a highlighted slot.
- Move gears by dragging or tapping a gear and its destination. Match two of the same type and level to merge, up to level 6.
- Gold-lit shafts show powered connections. Every gear has the same diameter. Orthogonal neighbors connect with visible mechanical shafts; powered gears rotate at equal speed in alternating directions, and disconnected gears stop. Only connected fighter gears spawn units. Lucky Cogs add gold per enemy defeated.
- Press **Fight**. Your tribe battles automatically; tap enemies or their tower for extra damage. Switch between 1× and 2× battle speed.
- Clear ten waves to earn bolts and gems. Skills are permanent upgrades, Deck shows fighters and copies, and Summon unlocks or adds copies.
- Keyboard: Tab to controls, Enter/Space to activate, Escape to cancel selection or close help.

Progress saves locally in your browser, with compatibility for the prototype's `tidegear-save-v2` saves. Reloading restarts the current battle at the same wave. Offline bolts accrue for up to eight hours. Clearing browser data removes your save.

## Development

```sh
npm install
npx playwright install chromium
npm test
npm run test:browser
npm run build
npm run preview
npm start
```

`game.js` owns simulation, state, controls and screen rendering. `art.js` loads the raster atlases, calibrates sprite crops and draws pixel scenery/animations. `styles.css` owns responsive presentation. Browser tests save captures to `.screenshots/` (gitignored).

See [DESIGN.md](DESIGN.md) for rules and scope. No purchased assets, reference video frames, or original game's art are distributed here.

## Build and CI

`npm run build` checks runtime JavaScript syntax and creates a clean `dist/` containing only the HTML, CSS, JavaScript and four sprite/background PNGs. Missing runtime files fail the build before the previous output is replaced. `npm run preview` serves that artifact at **http://127.0.0.1:4174**.

GitHub Actions runs **Build and Test** on pushes, pull requests and manual dispatch, using Ubuntu and Node 24. It installs locked dependencies, builds, runs unit/build tests, installs Chromium and tests the built artifact with Playwright. The workflow has read-only repository permissions.

Successful runs upload `dunegear-dist`; browser reports, failure traces and game screenshots are retained as separate artifacts for 14 days. Open the [Actions page](https://github.com/quyenanh198/Idle-clicker/actions/workflows/ci.yml) to see results and download artifacts.

To reproduce the built-app browser checks locally, run `npm run build`, then set `PLAYWRIGHT_TEST_BUILD=1` when running `npm run test:browser`. Development browser tests continue to use port 4173. In CI, existing servers are never reused and the HTML reporter/failure traces are enabled.

## Art and animation

Game assets and the ImageGen prompt specifications are in [assets/pixel](assets/pixel/README.md). Raster art is cropped at runtime with nearest-neighbor rendering. Infantry has walk and attack poses; hits, projectiles, sparks, debris, smoke and furnace light respond to gameplay. The reduced-motion preference disables rotation, power-flow and ambient loops.

To record a real game demo, start the local server and run `node scripts/capture-demo.cjs`. The resulting `.screenshots/pixel-frontier.webm` and `.screenshots/live-battle.png` are local preview artifacts.
