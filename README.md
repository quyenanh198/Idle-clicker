# Dunegear

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
npm start
```

`game.js` owns simulation, state, controls and screen rendering. `art.js` loads the raster atlases, calibrates sprite crops and draws pixel scenery/animations. `styles.css` owns responsive presentation. Browser tests save captures to `.screenshots/` (gitignored).

See [DESIGN.md](DESIGN.md) for rules and scope. No purchased assets, reference video frames, or original game's art are distributed here.

## Art and animation

Game assets and the ImageGen prompt specifications are in [assets/pixel](assets/pixel/README.md). Raster art is cropped at runtime with nearest-neighbor rendering. Infantry has walk and attack poses; hits, projectiles, sparks, debris, smoke and furnace light respond to gameplay. The reduced-motion preference disables rotation, power-flow and ambient loops.

To record a real game demo, start the local server and run `node scripts/capture-demo.cjs`. The resulting `.screenshots/pixel-frontier.webm` and `.screenshots/live-battle.png` are local preview artifacts.
