# Responsive chibi revision

User direction: remove desktop introduction columns, use a game frame responsive to the desktop viewport, redraw towers and gears in a fresh chibi style independent of previous graphics.

Use the available desktop width and height with a landscape game layout: mission and wave at top, large battlefield on the left, gear construction and recruitment on the right. The four game tabs remain at the bottom. At tablet/mobile width, stack the gear field above the battlefield and recruitment controls. Other screens use the same frame and readable content widths.

Redraw art as round, pastel chibi characters and squishy toy gears. Golden drive gears have smiling faces. Towers are friendly rounded miniature castles with oversized roofs, eyes and blush; opposing teams have mint and strawberry colors. Preserve battle coordinates, economy, saved state and pointer behavior. Canvas adapts height without stretching character proportions, and tapping maps back to simulation coordinates.

Verify existing tests plus desktop width usage at 1024, 1440 and 1920px; test mobile overflow, real touch dragging, and tower tap damage after desktop canvas resizing. Inspect screenshots before delivery.
