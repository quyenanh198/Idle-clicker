# Dunegear — game design

## Reference and presentation

Mechanics originated from the user-supplied gameplay recording. The current visual direction is the user-approved **Pixel Frontier** concept: crisp pixel art, an olive/ochre ruined railway battlefield, charcoal and bronze workshop panels, rust-red navigation and cream Fight controls. All raster art is generated specifically for this project and bundled in assets/pixel; see its README for source specifications.

## Loop and engine presentation

Desktop places a full-width battlefield above the workshop, with a 6×4 engine grid on the left and recruitment controls on the right. Mobile stacks these sections. Every rotor has the same diameter, including drive, fighter and income gears at every level. Slots can be rectangular on wide screens; shafts span the actual distance between their centers. One shaft connects each adjacent occupied pair; no diagonals and no duplicate edges. Powered shafts show amber flow. Checkerboard parity gives neighboring rotors equal-speed opposite rotation, while icons and labels stay upright. Disconnected components stop. Short windows scroll content inside the frame.

Build on a 6×4 grid with fixed drives at cells 7 and 9 (zero-based). Gears connect through four orthogonal neighbors. A component must touch a drive to work. Tap or drag offers onto powered adjacent slots. Move gears anywhere; disconnected fighter gears stop spawning. Matching type and level merges, maximum level 6.

Three offers; reroll costs 5 gold. Starting offers guarantee both starter fighters and a cog. When all offers sell, roll another three. Summoned fighters join the shop pool. Launch battle with at least one powered fighter. Construction locks during combat. Units march toward and attack enemies in range, then the tower. Tap enemies or the enemy tower for bonus damage. A win advances a wave; a loss keeps kill gold and retries the same wave. Wave 5 is hard; wave 10 is a boss. Clearing wave 10 grants rewards and resets board and gold for the next stage.

## Fighters

| Fighter | Role | HP | Damage | Attack cooldown | Range | Speed | Spawn/sec |
|---|---|---:|---:|---:|---:|---:|---:|
| Frontier Infantry | Starter melee | 30 | 6 | 1.0 | 30 | 70 | .50 |
| Iron Guard | Starter tank | 80 | 4 | 1.2 | 30 | 55 | .35 |
| Longshot | Ranged | 18 | 7 | 1.2 | 170 | 60 | .40 |
| Frost Engineer | Ranged, slows | 22 | 3 | 1.0 | 140 | 55 | .40 |
| Saber Scout | Fast melee | 34 | 11 | .7 | 30 | 100 | .40 |
| Mortar Crew | Ranged | 55 | 16 | 1.5 | 200 | 50 | .25 |

Frost Engineer slows movement and attack by 50% for 1.5 seconds. Gear HP/damage multiply by `1.8^(level−1)`, card bonus `1 + .15 × (cardLevel−1)` and skill bonuses. Spawn rate increases 5% per gear level above 1. Powered Lucky Cogs add combined levels to gold per kill.

## Economy

- `g = 2 × (stage−1) + wave`. Start with 40 gold plus Start Gold skill. Gear price `10 + gearsBoughtThisStage`.
- Enemies `4 + wave`; boss wave has one with 6× HP and 2× damage. HP `24 × 1.3^g`, damage `4 × 1.28^g`; hard waves multiply both by 1.5. Spawn interval `max(.8, 2.2 − .1 × wave)`.
- Enemy tower HP `150 × 1.3^g` (hard waves ×1.5). Player tower HP `200 × 1.22^g` plus Tower HP skill.
- Kill gold `1 + floor(g/4) + poweredCogLevels`. Wave bonus `10 + 2 × wave + IncomeSkill`.
- Tap damage `5 × 1.28^g × (1 + TapPowerLevel)`.
- Stage clear grants `5 × stage` bolts and 10 gems. Start with 60 gems.
- Summon costs 30 gems, uniformly among six fighters. Duplicate gives one copy. Level up costs `2 × currentCardLevel` copies.
- Skills cost `5 × (level+1)` bolts. Per level: damage +10%, fighter HP +10%, tower HP +20%, wave income +1, tap damage +100%, starting gold +10.
- Offline: one bolt per ten minutes multiplied by stage, capped at eight hours. Reload awards once.

## Persistence

Key `tidegear-save-v2` keeps prototype compatibility. Save after economy actions, every 15 seconds and on page exit. Validate grid, fixed drives, types, levels, currencies, skills and stage/wave ranges; invalid saves start fresh. Local simulation without accounts, server, purchases or analytics. Reloaded fights restart their wave.

## Validation

Node tests cover connectivity, purchases, merges, drag actions, first-wave balance, loss retry, boss rewards, save round trips and malformed saves. Playwright covers screens, mouse/touch drags, multiple pointers, keyboard placement, combat, summons, persistence and responsive overflow. Tests advance the real simulation instead of waiting for real-time battles.

## Animation and sprites

The infantry atlas contains eight character rows and four poses per character. Columns select walk A/B and attack windup/impact. Per-row crop metadata accounts for the generated atlas's varied row heights. Opposing units mirror the right-facing artwork; boss artwork scales up. Source images remain unchanged. Pixel crops use nearest-neighbor sampling and unique SVG clip IDs prevent cross-instance clipping during rotation.

Attack pose lasts .30 seconds; hit feedback .16 seconds. Projectiles last .18 seconds, impact particles .30 seconds, death debris .60 seconds. These visual effects do not delay the existing damage calculation. They expire in simulation ticks. Lanterns/smoke/dust use low-frequency ambient animation. Reduced motion freezes decorative loops and walking frame changes. Rendering is separate from state persistence.
