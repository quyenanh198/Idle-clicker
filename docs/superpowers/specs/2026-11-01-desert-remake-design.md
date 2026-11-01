# Desert gear battler

Approved direction: rebuild the existing browser game around the supplied 89-second reference recording. Preserve the tested economy and combat concepts while replacing the sea theme with original desert characters and vector art.

Portrait stage: resource header, mission label, gear construction field, battlefield, shop, fight action, bottom navigation. Desktop frames the portrait game with contextual instructions and live chain stats. Gears connect orthogonally to fixed drives. Buy, move, and merge with tapping or pointer dragging; disconnected gears do not spawn units. Combat spawns units automatically, supports tap damage, ten waves per stage, losses and retry. Skills, deck, and summon screens share currencies and browser persistence. Respect reduced motion and keyboard input. No external runtime dependencies or paid assets.

Keep combat rules in game.js, vector character/environment rendering in art.js, styles in styles.css. Validate connected components, purchases, merge limits, combat outcomes, persistent saves, corrupted saves, and mobile overflow. Reference art is visual guidance; produce original art rather than lifting assets.
