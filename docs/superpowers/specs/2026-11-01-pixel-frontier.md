# Pixel Frontier implementation design

User selected the supplied Pixel Frontier concept and requested new sprites and animations, equal-sized gears, and visible connections between gears.

The desktop layout follows the selected image: side-view desert frontier battle above an underground mechanical workshop. The workshop has a 6×4 grid on the left and recruitment/Fight controls on the right. Mobile stacks battle, engine, then shop inside the responsive frame. All other screens use the same pixel typography, worn charcoal/bronze panels, warm lantern light and rust-red/cream accents.

Original raster assets: background, eight-row four-frame infantry atlas, two-base atlas and four-material gear atlas. All are generated specifically for this project and bundled locally. Soldier states: walk, attack and hit feedback. Combat adds transient projectiles, muzzle flashes, debris and ambient smoke/lantern animation. Reduced motion freezes ambient/rotation loops. Runtime crops four pose columns with calibrated per-character row bounds and nearest-neighbor rendering; gear materials use equal 2×2 cells.

All gear sprites share the same outer display footprint regardless of material, unit level or motor status. Draw one shaft per orthogonally adjacent occupied pair, never diagonal or duplicated. Powered links glow amber and show power flow. Connected gears rotate at the same speed, opposite directions according to grid checkerboard parity; disconnected gears stop. Unit icons and level labels stay upright while gear bodies rotate. Moving/merging recomputes links from the actual saved board.

Keep existing economy, logical combat positions, save compatibility and tap/drag controls. Test graph edges, disconnected components, equal gear dimensions, counter-rotation, resizing, touch placement, hit coordinates, animation event lifetime, persistence and battle progression. Inspect actual game screenshots, not just generated concepts.
