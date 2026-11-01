/* Pixel Frontier: locally bundled raster atlases, cropped only at runtime. */
const PIXEL_ROWS = {
  bot: 0,
  crab: 1,
  owl: 2,
  jelly: 3,
  fox: 4,
  drake: 5,
  enemy: 6,
  boss: 7,
};
// Calibrated vertical slices: generated poses have intentionally varied heights.
// Each slice includes padding but excludes pixels from the following character.
const PIXEL_ROW_BOXES = [
  [1, 208],
  [199, 220],
  [413, 219],
  [623, 220],
  [830, 227],
  [1040, 231],
  [1257, 246],
  [1487, 287],
];
const PIXEL_URLS = {
  scene: "assets/pixel/frontier.png",
  soldiers: "assets/pixel/soldiers.png",
  forts: "assets/pixel/forts.png",
  gears: "assets/pixel/gears.png",
};
let pixelArtId = 0;
const pixelAssets = {};
const artReady = Promise.all(
  Object.entries(PIXEL_URLS).map(
    ([key, url]) =>
      new Promise((resolve, reject) => {
        const im = new Image();
        pixelAssets[key] = im;
        im.onload = resolve;
        im.onerror = () => reject(new Error("Cannot load " + url));
        im.src = url;
      }),
  ),
);
const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const motionReduced = () => reducedMotionQuery.matches;
function portrait(k, cls = "") {
  const row = PIXEL_ROWS[k] ?? 0;
  const [y, h] = PIXEL_ROW_BOXES[row],
    w = 887 / 4,
    id = "portrait-clip-" + row + "-" + pixelArtId++;
  return `<svg class="portrait ${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${id}"><rect width="${w}" height="${h}"/></clipPath></defs><g clip-path="url(#${id})"><image href="${PIXEL_URLS.soldiers}" width="887" height="1774" x="0" y="${-y}" image-rendering="pixelated"/></g></svg>`;
}
function pixelIcon(k, cls = "") {
  const paths = {
    bot: "M2 7h11v3H8v3H5v-3H2zM11 5h4v2h-4z",
    crab: "M3 2h10v9l-5 4-5-4zM6 4v6h2V4z",
    owl: "M1 6h14v3H9v5H6V9H1zM4 4h6v2H4z",
    jelly:
      "M7 1h2v4l3-3 1 2-3 3h5v2h-5l3 3-1 2-3-3v4H7v-4l-3 3-1-2 3-3H1V7h5L3 4l1-2 3 3z",
    fox: "M12 1h3v3L6 13H3v-3zM1 10l5 5 2-2-5-5z",
    drake: "M3 2h7l4 5-3 5H8l-2 3H3l2-6-3-4zM6 4v3h4V4z",
    motor: "M5 1h6v3h3v8h-3v3H5v-3H2V4h3zM6 5v6h4V5z",
    cog: "M6 2h4v4h4v4h-4v4H6v-4H2V6h4z",
    up: "M8 1l4 5-1 3 3 2-2 4H4L2 11l4-4-1-3 2 2z",
    play: "M1 1h3l9 10-2 2L1 4zM12 1h3v3L5 15l-3-3zM1 10l5 5 2-2-5-5zM9 10l5 5 2-2-5-5z",
    crew: "M1 3h10v12H1zM4 1h11v12h-2V3H4zM4 6v2h4V6zM3 10v2h6v-2z",
    summon: "M5 1h6l4 5-7 9L1 6zM4 5h8L8 2zM4 7l4 5 4-5z",
  };
  return `<svg class="pixel-icon ${cls}" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true"><path d="${paths[k] || paths.motor}" fill="currentColor" fill-rule="evenodd"/></svg>`;
}
const navIcon = (k) => pixelIcon(k);
function cogSVG(material = "steel") {
  const index = { gold: 0, steel: 1, copper: 2, iron: 3 }[material] ?? 1;
  const clipId = "gear-clip-" + pixelArtId++;
  return `<svg class="cog-outline" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><clipPath id="${clipId}"><rect width="128" height="128"/></clipPath></defs><g clip-path="url(#${clipId})"><image href="${PIXEL_URLS.gears}" width="256" height="256" x="${-(index % 2) * 128}" y="${-Math.floor(index / 2) * 128}" image-rendering="pixelated"/></g></svg>`;
}
function gearFace(cog = false) {
  return pixelIcon(cog ? "cog" : "motor", "face");
}
function drawPixelUnit(ctx, k, x, y, size, flip, pose = {}) {
  const im = pixelAssets.soldiers;
  if (!im.complete || !im.naturalWidth) return;
  const row = PIXEL_ROWS[k] ?? 0;
  const attacking = (pose.attackT || 0) > 0;
  const walkFrame = motionReduced()
    ? 0
    : Math.floor((pose.clock || 0) * 7 + (pose.seed || 0)) % 2;
  const frame = attacking
    ? pose.attackT > 0.13
      ? 2
      : 3
    : pose.walking
      ? walkFrame
      : 0;
  const cw = im.naturalWidth / 4,
    [sy, ch] = PIXEL_ROW_BOXES[row];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  if (pose.hitT > 0)
    ctx.globalAlpha = 0.55 + Math.min(1, pose.hitT / 0.15) * 0.4;
  const bob = !motionReduced() && pose.walking ? walkFrame : 0;
  ctx.drawImage(
    im,
    frame * cw,
    sy,
    cw,
    ch,
    -Math.round((size * cw) / ch / 2),
    -Math.round(size / 2) - bob,
    Math.round((size * cw) / ch),
    Math.round(size),
  );
  ctx.restore();
}
function drawDesert(ctx, w, h) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#a79b64";
  ctx.fillRect(0, 0, w, h);
  const im = pixelAssets.scene;
  if (im.complete && im.naturalWidth) {
    const rail = h - 103,
      dh = Math.max(
        (w / im.naturalWidth) * im.naturalHeight,
        rail / 0.655,
        103 / 0.345,
      ),
      dw = (dh / im.naturalHeight) * im.naturalWidth;
    // The bridge's rail surface is at 65.5% in the source image.
    const top = Math.round(rail - dh * 0.655);
    ctx.drawImage(
      im,
      0,
      0,
      im.naturalWidth,
      im.naturalHeight,
      Math.round((w - dw) / 2),
      top,
      Math.round(dw),
      Math.round(dh),
    );
  }
  if (!motionReduced()) {
    const clock = performance.now() / 1000;
    ctx.fillStyle = "#e7cb8a";
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 13; i++) {
      const x = Math.floor((i * 83 + clock * (4 + (i % 3))) % w),
        y = Math.floor(h - 150 - ((i * 37) % 110));
      ctx.fillRect(x, y, 2, 1);
    }
    ctx.globalAlpha = 1;
  }
}
function drawTower(ctx, x, y, enemy, health) {
  const im = pixelAssets.forts;
  if (im.complete && im.naturalWidth) {
    const cw = im.naturalWidth / 2;
    ctx.drawImage(
      im,
      enemy ? cw : 0,
      0,
      cw,
      im.naturalHeight,
      Math.round(Math.max(0, Math.min(820, x - 90))),
      Math.round(y - 151),
      180,
      180,
    );
  }
  ctx.fillStyle = "#17151e";
  ctx.fillRect(x - 43, y - 157, 86, 8);
  ctx.fillStyle = "#6e5b43";
  ctx.fillRect(x - 42, y - 156, 84, 6);
  ctx.fillStyle = enemy ? "#ad5844" : "#b7aa69";
  ctx.fillRect(
    x - 40,
    y - 154,
    Math.round(80 * Math.max(0, Math.min(1, health))),
    3,
  );
  const tick = motionReduced() ? 0 : Math.floor(performance.now() / 180) % 3;
  // Small low-frequency pixel furnace light and smoke, independent of combat.
  const tx = x + (enemy ? 28 : -33),
    ty = y + (enemy ? -67 : -45);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#a54e25";
  ctx.fillRect(tx - 2, ty - 3, 5, 8);
  ctx.fillStyle = "#e8a449";
  ctx.fillRect(tx, ty - 3 - tick, 2, 5 + tick);
  ctx.fillStyle = "#ffe5a0";
  ctx.fillRect(tx, ty + 1, 1, 3);
  ctx.globalAlpha = 1;
  if (!motionReduced()) {
    const t = performance.now() / 1000;
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.22 + i / 3) % 1;
      ctx.globalAlpha = (1 - p) * 0.22;
      ctx.fillStyle = "#393337";
      ctx.fillRect(
        Math.floor(x + (enemy ? 36 : -40) + Math.sin(p * 6 + i) * 8),
        Math.floor(y - 115 - p * 60),
        4 + i * 2,
        3 + i * 2,
      );
    }
    ctx.globalAlpha = 1;
  }
}
function drawCombatEffects(ctx, b) {
  if (motionReduced()) return;
  for (const s of b.shots || []) {
    const f = 1 - s.life / s.max,
      px = Math.round(s.x + (s.tx - s.x) * f),
      py = Math.round(s.y + (s.ty - s.y) * f);
    ctx.fillStyle = s.slow ? "#b8dcdb" : "#f7dc98";
    ctx.fillRect(px - 3, py - 1, 7, 2);
    ctx.fillStyle = s.slow ? "#6b9ea9" : "#b67437";
    ctx.fillRect(px - 8, py, 5, 1);
  }
  for (const p of b.particles || []) {
    const f = 1 - p.life / p.max;
    ctx.globalAlpha = 1 - f;
    ctx.fillStyle = p.col;
    ctx.fillRect(
      Math.round(p.x + p.vx * f),
      Math.round(p.y + p.vy * f + 18 * f * f),
      p.size,
      p.size,
    );
  }
  ctx.globalAlpha = 1;
}
