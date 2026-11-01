# Tidegear — design doc (v0.2)

Original gear-chain idle battler. Genre, loop and screen layout follow Ken's reference video (gear board + lane battle + deck, skills, summon). Name, theme, units, art and numbers are our own; placeholder emoji art is drawn through one `drawSprite()` function so real sprites can be swapped in.

## Theme
A clockwork lighthouse on a stormy beach. Gear-bots and sea critters defend it from sea monsters marching out of an enemy fort.

## Core loop
1. **Build (between waves):** the board is a 6×4 grid of gear slots with two fixed **drive gears**. Buy a gear from the shop (3 offers + reroll), then tap a slot next to the powered chain to place it.
2. **Power chain:** a gear works only while it touches the chain that starts at a drive gear (glows green and spins). Breaking the chain switches gears off.
3. **Merge:** tap a gear, then a matching gear (same type, same level) to merge into level +1 (max 6). Tap an empty slot to move a gear.
4. **Fight:** each powered crew gear spawns soldiers at its rate (e.g. 0.50/s). Soldiers march right from the lighthouse, monsters march left from the fort, they fight in the middle. Player taps monsters (or the fort) for bonus damage.
5. **Gold:** every monster defeated drops Gold. **Lucky Cog** gears (the "+1" gear) add +level Gold per monster while powered.
6. **Wave end:** fort destroyed = win (+ wave bonus). Lighthouse destroyed = lose, keep the kill Gold, retry the same wave.
7. **Stage:** 10 waves, waves 5 and 10 are hard, wave 10 is a boss. Clearing a stage gives Bolts + Pearls, then the board and Gold reset.
8. **Meta:** Bolts buy permanent Upgrades, Pearls buy Summons (unlock and level crew cards). Idle: Bolts accrue while away.

## Screens (bottom nav on mobile, left rail on desktop)
| Tab | Purpose |
|---|---|
| Upgrades | Permanent skills bought with Bolts |
| Play | Wave bar, battle lane, gear board, shop, Reroll + Fight |
| Crew | Unit cards, level up with copies |
| Summon | Spend Pearls for random cards |

Mobile: lane above board, everything in one column. Desktop (≥ 900px): lane left, board + shop right.

## Gears
| Gear | Role | HP | DMG | Attack every | Range | Spawn/s |
|---|---|---|---|---|---|---|
| Rivet Bot 🤖 | Melee, starter | 30 | 6 | 1.0 s | short | 0.50 |
| Clamp Crab 🦀 | Tank, starter | 80 | 4 | 1.2 s | short | 0.35 |
| Lamp Owl 🦉 | Ranged, summon | 18 | 7 | 1.2 s | 170 | 0.40 |
| Chill Jelly 🪼 | Ranged, slows 50% for 1.5 s | 22 | 3 | 1.0 s | 140 | 0.40 |
| Flare Fox 🦊 | Melee, fast | 34 | 11 | 0.7 s | short | 0.40 |
| Storm Drake 🐉 | Ranged | 55 | 16 | 1.5 s | 200 | 0.25 |
| Lucky Cog ⚙️ | Connector, +level Gold per kill | – | – | – | – | – |

- Unit HP and DMG × 1.8^(level−1) × card bonus (+15% per card level above 1) × skill bonuses. Spawn rate +5% per gear level.

## Economy (first pass, tune later)
- g = 2×(stage−1) + wave.
- Start each stage with 40 Gold (+ Start Gold skill). Gear price = 10 + gears bought this stage. Reroll = 5.
- Monsters per wave = 4 + wave (boss wave: 1 boss with ×6 HP, ×2 damage). Monster HP = 24 × 1.3^g, damage = 4 × 1.28^g. Hard waves ×1.5.
- Fort HP = 150 × 1.3^g. Lighthouse HP = 200 × 1.22^g × Lighthouse skill.
- Gold per kill = 1 + floor(g/4) + powered Lucky Cog levels. Wave bonus = 10 + 2 × wave + Income skill.
- Tap damage = 5 × 1.28^g × Tap skill.
- Stage clear: Bolts = 5 × stage, Pearls = 10.
- Skills cost 5 × (level+1) Bolts: Damage +10%, Crew HP +10%, Lighthouse +20%, Income +1, Tap +100%, Start Gold +10.
- Summon: 30 Pearls → random card; level up needs level × 2 copies. Start with 60 Pearls.
- Idle: 1 Bolt per 10 minutes away × stage (cap 8 h).
- Sim check (greedy bot, no taps, no upgrades): clears stages 1–2 without losses; stage 3 starts needing retries.

## Save format
localStorage key `tidegear-save-v2`: `{gold, bolts, pearls, stage, wave, bought, board[24], offers[3], cards{type:{lvl,copies}}, skills{dmg,hp,base,inc,tap,start}, lastSeen}`.

## Next
Swap in Ken's sprites, battle animations, sound, balance pass after playtesting.
