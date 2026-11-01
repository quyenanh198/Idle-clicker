// ================= data =================
// Stable sprite keys and fighter stats; artwork lives in art.js.
const UNITS = {
  bot: {
    name: "Frontier Infantry",
    em: "bot",
    start: true,
    kind: "Melee",
    hp: 30,
    dmg: 6,
    cd: 1.0,
    range: 30,
    speed: 70,
    rate: 0.5,
  },
  crab: {
    name: "Iron Guard",
    em: "crab",
    start: true,
    kind: "Tank",
    hp: 80,
    dmg: 4,
    cd: 1.2,
    range: 30,
    speed: 55,
    rate: 0.35,
  },
  owl: {
    name: "Longshot",
    em: "owl",
    kind: "Ranged",
    hp: 18,
    dmg: 7,
    cd: 1.2,
    range: 170,
    speed: 60,
    rate: 0.4,
  },
  jelly: {
    name: "Frost Engineer",
    em: "jelly",
    kind: "Ranged, slows",
    hp: 22,
    dmg: 3,
    cd: 1.0,
    range: 140,
    speed: 55,
    rate: 0.4,
    slow: true,
  },
  fox: {
    name: "Saber Scout",
    em: "fox",
    kind: "Melee, fast",
    hp: 34,
    dmg: 11,
    cd: 0.7,
    range: 30,
    speed: 100,
    rate: 0.4,
  },
  drake: {
    name: "Mortar Crew",
    em: "drake",
    kind: "Ranged",
    hp: 55,
    dmg: 16,
    cd: 1.5,
    range: 200,
    speed: 50,
    rate: 0.25,
  },
};
const COG = { name: "Lucky Cog" }; // the "+1" gear: +level gold per monster defeated
const MONSTERS = ["enemy"];
const BOSS = "boss";
const SKILLS = {
  dmg: { name: "Damage", em: "⚔", desc: (l) => `+${l * 10}% crew damage` },
  hp: { name: "Crew HP", em: "♥", desc: (l) => `+${l * 10}% crew HP` },
  base: { name: "Tower HP", em: "♜", desc: (l) => `+${l * 20}% base HP` },
  inc: { name: "Income", em: "◈", desc: (l) => `+${l} Gold per wave` },
  tap: { name: "Tap Power", em: "✦", desc: (l) => `+${l * 100}% tap damage` },
  start: {
    name: "Start Gold",
    em: "✹",
    desc: (l) => `+${l * 10} Gold each stage`,
  },
};
const COLS = 6,
  ROWS = 4,
  CELLS = COLS * ROWS,
  MAXLV = 6,
  MOTORS = [7, 9],
  SAVE = "tidegear-save-v2";
const W = 1000,
  H = 400,
  BASE_L = 65,
  BASE_R = 935,
  GROUND = 275;

// ================= state =================
let S = load() || fresh();
let tab = "play",
  sel = -1,
  pick = -1,
  battle = null,
  toastT = 0,
  speed = 1,
  summonResult = null,
  boardPulse = -1,
  boardPulseUntil = 0;

function fresh() {
  const cards = {};
  for (const k in UNITS) if (UNITS[k].start) cards[k] = { lvl: 1, copies: 0 };
  const s = {
    gold: 0,
    bolts: 0,
    pearls: 60,
    stage: 1,
    wave: 1,
    bought: 0,
    board: [],
    offers: [],
    cards,
    skills: { dmg: 0, hp: 0, base: 0, inc: 0, tap: 0, start: 0 },
    lastSeen: Date.now(),
  };
  newStage(s);
  return s;
}
function newStage(s) {
  s.wave = 1;
  s.bought = 0;
  s.gold = 40 + s.skills.start * 10;
  s.board = Array(CELLS).fill(null);
  MOTORS.forEach((i) => (s.board[i] = { k: "motor" }));
  s.offers = ["bot", "crab", "cog"];
}
function rollOffers(s) {
  const pool = [...Object.keys(s.cards), "cog"];
  s.offers = [0, 1, 2].map(() => pool[Math.floor(Math.random() * pool.length)]);
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE));
    if (
      !s ||
      !Array.isArray(s.board) ||
      s.board.length !== CELLS ||
      !Array.isArray(s.offers) ||
      s.offers.length !== 3
    )
      return null;
    for (const k of [
      "gold",
      "bolts",
      "pearls",
      "stage",
      "wave",
      "bought",
      "lastSeen",
    ])
      if (!Number.isFinite(s[k]) || s[k] < 0) return null;
    if (
      s.stage < 1 ||
      s.wave < 1 ||
      s.wave > 10 ||
      !Number.isInteger(s.stage) ||
      !Number.isInteger(s.wave)
    )
      return null;
    if (
      !s.skills ||
      Object.keys(SKILLS).some(
        (k) => !Number.isInteger(s.skills[k]) || s.skills[k] < 0,
      )
    )
      return null;
    if (
      !s.cards ||
      !s.cards.bot ||
      !s.cards.crab ||
      Object.entries(s.cards).some(
        ([k, c]) =>
          !UNITS[k] ||
          !c ||
          !Number.isInteger(c.lvl) ||
          c.lvl < 1 ||
          !Number.isInteger(c.copies) ||
          c.copies < 0,
      )
    )
      return null;
    if (s.offers.some((k) => k !== null && k !== "cog" && !s.cards[k]))
      return null;
    if (
      s.board.some((c, i) =>
        MOTORS.includes(i)
          ? !c || c.k !== "motor"
          : c &&
            ((c.k !== "cog" && !s.cards[c.k]) ||
              !Number.isInteger(c.l) ||
              c.l < 1 ||
              c.l > MAXLV),
      )
    )
      return null;
    return s;
  } catch (e) {
    return null;
  }
}
function save() {
  S.lastSeen = Date.now();
  try {
    localStorage.setItem(SAVE, JSON.stringify(S));
  } catch (e) {}
}

// ================= board =================
const nbrs = (i) => {
  const r = Math.floor(i / COLS),
    c = i % COLS,
    out = [];
  if (r > 0) out.push(i - COLS);
  if (r < ROWS - 1) out.push(i + COLS);
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  return out;
};
function powered() {
  // flood fill from drive gears through any placed gear
  const on = new Set(MOTORS),
    q = [...MOTORS];
  while (q.length) {
    const i = q.shift();
    for (const n of nbrs(i))
      if (S.board[n] && !on.has(n)) {
        on.add(n);
        q.push(n);
      }
  }
  return on;
}
function gearNetwork() {
  const on = powered(),
    edges = [],
    direction = S.board.map((_, i) =>
      (Math.floor(i / COLS) + (i % COLS)) % 2 ? -1 : 1,
    );
  S.board.forEach((c, i) => {
    if (!c) return;
    for (const n of nbrs(i))
      if (n > i && S.board[n])
        edges.push({ a: i, b: n, powered: on.has(i) && on.has(n) });
  });
  return { on, edges, direction };
}
function gearLinksHTML(net) {
  return `<svg class="gear-links" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true">${net.edges
    .map((e) => {
      const x = (i) => (i % COLS) * 100 + 50,
        y = (i) => Math.floor(i / COLS) * 100 + 50,
        d = `M${x(e.a)} ${y(e.a)}L${x(e.b)} ${y(e.b)}`;
      return `<g class="shaft ${e.powered ? "live" : ""}" data-link="${e.a}-${e.b}" data-powered="${e.powered}"><path class="shaft-shadow" d="${d}"/><path class="shaft-metal" d="${d}"/><path class="shaft-edge" d="${d}"/>${e.powered ? `<path class="shaft-energy" d="${d}"/>` : ""}</g>`;
    })
    .join("")}</svg>`;
}
function canPlace(i) {
  const on = powered();
  return !S.board[i] && nbrs(i).some((n) => on.has(n));
}

// ================= formulas (see DESIGN.md) =================
const fmt = (n) =>
  n >= 1e9
    ? (n / 1e9).toFixed(1) + "B"
    : n >= 1e6
      ? (n / 1e6).toFixed(1) + "M"
      : n >= 1e4
        ? (n / 1e3).toFixed(1) + "K"
        : Math.floor(n).toString();
const gw = () => 2 * (S.stage - 1) + S.wave;
const isHard = (w) => w === 5 || w === 10;
const price = () => 10 + S.bought;
const cardMul = (k) => 1 + 0.15 * (S.cards[k].lvl - 1);
function unitStats(k, l) {
  const u = UNITS[k],
    m = Math.pow(1.8, l - 1) * cardMul(k);
  return {
    hp: u.hp * m * (1 + 0.1 * S.skills.hp),
    dmg: u.dmg * m * (1 + 0.1 * S.skills.dmg),
    cd: u.cd,
    range: u.range,
    speed: u.speed,
    em: u.em,
    slow: !!u.slow,
  };
}
const spawnRate = (k, l) => UNITS[k].rate * (1 + 0.05 * (l - 1));
const cogBonus = () => {
  const on = powered();
  return S.board.reduce(
    (a, c, i) => a + (c && c.k === "cog" && on.has(i) ? c.l : 0),
    0,
  );
};
const killGold = () => 1 + Math.floor(gw() / 4) + cogBonus();
const waveBonus = () => 10 + 2 * S.wave + S.skills.inc;
const tapDmg = () => 5 * Math.pow(1.28, gw()) * (1 + S.skills.tap);
const skillCost = (k) => 5 * (S.skills[k] + 1);
function waveSpec() {
  const g = gw(),
    hard = isHard(S.wave) ? 1.5 : 1;
  return {
    count: S.wave === 10 ? 1 : 4 + S.wave,
    hp: 24 * Math.pow(1.3, g) * hard,
    dmg: 4 * Math.pow(1.28, g) * hard,
    fort: 150 * Math.pow(1.3, g) * hard,
    base: 200 * Math.pow(1.22, g) * (1 + 0.2 * S.skills.base),
    every: Math.max(0.8, 2.2 - S.wave * 0.1),
  };
}

// ================= actions =================
function pickOffer(i) {
  if (
    battle ||
    !Number.isInteger(i) ||
    i < 0 ||
    i > 2 ||
    !S.offers[i] ||
    S.gold < price()
  )
    return;
  pick = pick === i ? -1 : i;
  sel = -1;
  if (pick >= 0 && !S.board.some((_, j) => canPlace(j))) {
    pick = -1;
    toast("No free slot next to the chain. Merge gears first!");
  }
  render();
}
function tapSlot(i) {
  if (battle || !Number.isInteger(i) || i < 0 || i >= CELLS) return;
  const c = S.board[i];
  if (pick >= 0) {
    // placing a bought gear
    if (S.gold < price() || !S.offers[pick]) {
      pick = -1;
      return;
    }
    if (!canPlace(i)) return toast("Place it next to a powered gear.");
    const k = S.offers[pick];
    S.gold -= price();
    S.bought++;
    S.board[i] = { k, l: 1 };
    boardPulse = i;
    boardPulseUntil = performance.now() + 350;
    S.offers[pick] = null;
    pick = -1;
    if (S.offers.every((o) => !o)) rollOffers(S);
    save();
    render();
    return;
  }
  if (sel < 0) {
    if (c && c.k !== "motor") sel = i;
    render();
    return;
  }
  if (sel === i) {
    sel = -1;
    render();
    return;
  }
  const a = S.board[sel];
  if (!c) {
    S.board[i] = a;
    S.board[sel] = null;
    sel = -1;
  } else if (c.k === a.k && c.l === a.l && c.l < MAXLV) {
    S.board[i] = { k: c.k, l: c.l + 1 };
    boardPulse = i;
    boardPulseUntil = performance.now() + 350;
    S.board[sel] = null;
    sel = -1;
  } else sel = c.k === "motor" ? -1 : i;
  save();
  render();
}
function reroll() {
  if (battle || S.gold < 5) return;
  S.gold -= 5;
  pick = -1;
  rollOffers(S);
  save();
  render();
}

// ================= battle =================
function fight() {
  if (battle) return;
  const on = powered();
  const spawners = S.board
    .map((c, i) =>
      c && UNITS[c.k] && on.has(i) ? { k: c.k, l: c.l, t: 0 } : null,
    )
    .filter(Boolean);
  if (!spawners.length) return toast("Connect a crew gear to the chain first!");
  const w = waveSpec();
  battle = {
    w,
    spawners,
    left: w.count,
    et: 0,
    units: [],
    fx: [],
    base: w.base,
    baseMax: w.base,
    fort: w.fort,
    fortMax: w.fort,
    gold: 0,
    kg: killGold(),
    elapsed: 0,
    shots: [],
    particles: [],
  };
  sel = -1;
  pick = -1;
  render();
}
function mkEnemy(w) {
  const boss = S.wave === 10,
    y = GROUND + (Math.random() * 16 - 8);
  const m = boss ? 6 : 1;
  return {
    side: 1,
    x: BASE_R - 30,
    y,
    hp: w.hp * m,
    max: w.hp * m,
    dmg: w.dmg * (boss ? 2 : 1),
    cd: 1.1,
    t: 0,
    range: 30,
    speed: 45,
    em: boss ? BOSS : MONSTERS[Math.floor(Math.random() * MONSTERS.length)],
    size: boss ? 64 : 34,
    slowT: 0,
  };
}
function tick(dt) {
  const b = battle;
  if (!b) return;
  b.elapsed += dt;
  for (const s of b.spawners) {
    s.t += dt;
    const per = 1 / spawnRate(s.k, s.l);
    while (s.t >= per) {
      s.t -= per;
      const st = unitStats(s.k, s.l);
      b.units.push({
        side: 0,
        x: BASE_L + 30,
        y: GROUND + (Math.random() * 16 - 8),
        max: st.hp,
        t: 0,
        size: 30,
        slowT: 0,
        ...st,
      });
    }
  }
  b.et += dt;
  if (b.left > 0 && b.et >= b.w.every) {
    b.et = 0;
    b.left--;
    b.units.push(mkEnemy(b.w));
  }
  for (const u of b.units) {
    if (u.hp <= 0) continue;
    u.attackT = Math.max(0, (u.attackT || 0) - dt);
    u.hitT = Math.max(0, (u.hitT || 0) - dt);
    u.walking = false;
    u.t -= dt * (u.slowT > 0 ? 0.5 : 1);
    u.slowT -= dt;
    const dir = u.side ? -1 : 1;
    let tgt = null,
      best = 1e9;
    for (const o of b.units) {
      if (o.side === u.side || o.hp <= 0) continue;
      const d = (o.x - u.x) * dir;
      if (d >= -10 && d < best) {
        best = d;
        tgt = o;
      }
    }
    const baseX = u.side ? BASE_L : BASE_R,
      baseD = (baseX - u.x) * dir;
    if (tgt && best <= u.range) {
      if (u.t <= 0) {
        u.t = u.cd;
        visualAttack(u, tgt.x, tgt.y);
        hit(tgt, u.dmg, u);
      }
    } else if (baseD <= u.range + 20) {
      if (u.t <= 0) {
        u.t = u.cd;
        visualAttack(u, baseX, u.y - 30);
        if (u.side) {
          b.base -= u.dmg;
        } else {
          b.fort -= u.dmg;
        }
        fx(baseX, u.y - 30, "-" + fmt(u.dmg), u.side ? "#ff8a8a" : "#fff");
      }
    } else {
      u.walking = true;
      u.x += dir * u.speed * dt * (u.slowT > 0 ? 0.5 : 1);
    }
  }
  b.units = b.units.filter((u) => u.hp > 0);
  b.fx = b.fx.filter((f) => (f.t -= dt) > 0);
  b.shots = b.shots.filter((p) => (p.life -= dt) > 0);
  b.particles = b.particles.filter((p) => (p.life -= dt) > 0);
  if (b.fort <= 0) return endWave(true);
  if (b.base <= 0) return endWave(false);
}
function visualAttack(u, tx, ty) {
  u.attackT = 0.3;
  const b = battle;
  if (!b) return;
  if (!["crab", "fox", "enemy"].includes(u.em))
    b.shots.push({
      x: u.x,
      y: u.y - 5,
      tx,
      ty: ty - 5,
      life: 0.18,
      max: 0.18,
      slow: u.slow,
    });
  for (let i = 0; i < 4; i++)
    b.particles.push({
      x: tx,
      y: ty - 9,
      vx: (i - 1.5) * 10,
      vy: -12 - i * 4,
      size: (i % 2) + 2,
      col: u.slow ? "#b5d8dd" : i % 2 ? "#e7bf75" : "#ae6438",
      life: 0.3,
      max: 0.3,
    });
}
function hit(t, d, src) {
  if (t.hp <= 0) return;
  t.hp -= d;
  t.hitT = 0.16;
  if (src && src.slow) t.slowT = 1.5;
  if (t.hp <= 0 && t.side === 1) {
    for (let i = 0; i < 6; i++)
      battle.particles.push({
        x: t.x,
        y: t.y,
        vx: (i - 2.5) * 9,
        vy: -18 - i * 3,
        size: 2 + (i % 2),
        col: i % 2 ? "#6c5745" : "#b99462",
        life: 0.6,
        max: 0.6,
      });
    const g = battle.kg;
    battle.gold += g;
    S.gold += g;
    fx(t.x, t.y - 30, "+" + g, "#ffc83d");
  }
}
function fx(x, y, txt, col) {
  battle.fx.push({ x, y, txt, col, t: 0.7 });
}
function tapLane(ev) {
  if (!battle) return;
  const r = ev.currentTarget.getBoundingClientRect(),
    x = ((ev.clientX - r.left) / r.width) * W,
    y =
      ((ev.clientY - r.top) / r.height) * ev.currentTarget.height -
      (ev.currentTarget.height - H);
  let tgt = null,
    best = 80;
  for (const u of battle.units)
    if (u.side === 1) {
      const d = Math.hypot(u.x - x, u.y - y);
      if (d < best) {
        best = d;
        tgt = u;
      }
    }
  const d = tapDmg();
  if (tgt) {
    fx(tgt.x, tgt.y - 40, "-" + fmt(d), "#ffe27a");
    hit(tgt, d);
  } else if (x > BASE_R - 80) {
    battle.fort -= d;
    fx(BASE_R, GROUND - 90, "-" + fmt(d), "#ffe27a");
  }
}
function endWave(won) {
  const earned = battle.gold;
  battle = null;
  if (!won) {
    toast(
      `Your tower fell! You kept ${earned} gold from kills. Strengthen your chain and retry.`,
    );
    save();
    render();
    return;
  }
  const g = waveBonus();
  S.gold += g;
  if (S.wave === 10) {
    const bo = 5 * S.stage;
    S.bolts += bo;
    S.pearls += 10;
    toast(`Stage ${S.stage} cleared! +${bo} bolts +10 gems`);
    S.stage++;
    newStage(S);
  } else {
    S.wave++;
    rollOffers(S);
    toast(`Wave won! +${g} gold bonus`);
  }
  save();
  render();
}

// ================= meta =================
function buySkill(k) {
  if (!SKILLS[k]) return;
  const c = skillCost(k);
  if (S.bolts < c) return;
  S.bolts -= c;
  S.skills[k]++;
  save();
  render();
}
function summon() {
  if (S.pearls < 30) return;
  S.pearls -= 30;
  const keys = Object.keys(UNITS),
    k = keys[Math.floor(Math.random() * keys.length)];
  summonResult = k;
  if (!S.cards[k]) {
    S.cards[k] = { lvl: 1, copies: 0 };
    toast(`New fighter: ${UNITS[k].name}!`);
  } else {
    S.cards[k].copies++;
    toast(`${UNITS[k].name} copy +1`);
  }
  save();
  render();
}
function upCard(k) {
  const c = S.cards[k];
  if (!c || c.copies < c.lvl * 2) return;
  c.copies -= c.lvl * 2;
  c.lvl++;
  save();
  render();
}

// ================= rendering =================
function drawSprite(ctx, k, x, y, size, flip, pose = {}) {
  drawPixelUnit(ctx, k, x, y, size, flip, pose);
}
function bar(ctx, x, y, w, f, col) {
  ctx.fillStyle = "#3c4c40";
  ctx.fillRect(x - w / 2, y, w, 5);
  ctx.fillStyle = col;
  ctx.fillRect(x - w / 2 + 1, y + 1, (w - 2) * Math.max(0, Math.min(1, f)), 3);
}
function drawLane() {
  const cv = document.getElementById("lane");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const bounds = cv.getBoundingClientRect();
  const viewHeight = Math.max(
    240,
    Math.round((W * bounds.height) / Math.max(1, bounds.width)),
  );
  if (cv.height !== viewHeight) cv.height = viewHeight;
  ctx.imageSmoothingEnabled = false;
  drawDesert(ctx, W, viewHeight);
  const offset = viewHeight - H;
  ctx.save();
  ctx.translate(0, offset);
  const b = battle;
  drawTower(ctx, BASE_L, GROUND - 3, false, b ? b.base / b.baseMax : 1);
  drawTower(ctx, BASE_R, GROUND - 3, true, b ? b.fort / b.fortMax : 1);
  if (!b) {
    const crew = S.board.filter((c) => c && UNITS[c.k]).slice(0, 4);
    (crew.length ? crew : [{ k: "bot" }, { k: "crab" }]).forEach((c, i) =>
      drawSprite(ctx, c.k, 175 + i * 83, GROUND - 7 + (i % 2) * 6, 74, false),
    );
    drawSprite(ctx, "enemy", 790, GROUND + 30, 70, true);
    ctx.restore();
    return;
  }
  [...b.units]
    .sort((a, c) => a.y - c.y)
    .forEach((u) => {
      const visualY = u.y - Math.max(0, u.size - 30) * 0.76;
      drawSprite(ctx, u.em, u.x, visualY, u.size * 1.9, u.side === 1, {
        ...u,
        clock: b.elapsed,
        seed: u.y * 0.01,
      });
      bar(
        ctx,
        u.x,
        visualY - u.size,
        u.size * 1.3,
        u.hp / u.max,
        u.side ? "#a65f44" : "#b5a56d",
      );
      if (u.slowT > 0) {
        ctx.fillStyle = "#d8f4f1";
        ctx.font = "18px monospace";
        ctx.fillText("✧", u.x + 15, visualY - u.size);
      }
    });
  drawCombatEffects(ctx, b);
  ctx.textAlign = "center";
  ctx.font = "20px monospace";
  b.fx.forEach((f) => {
    ctx.globalAlpha = Math.min(1, f.t / 0.4);
    ctx.fillStyle = f.col;
    ctx.strokeStyle = "#745734";
    ctx.lineWidth = 3;
    ctx.strokeText(f.txt, f.x, f.y - (0.7 - f.t) * 60);
    ctx.fillText(f.txt, f.x, f.y - (0.7 - f.t) * 60);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}
const $ = (id) => document.getElementById(id);
function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  t.setAttribute("role", "status");
  document.body.appendChild(t);
  clearTimeout(toastT);
  toastT = setTimeout(() => t.remove(), 3200);
}
function go(k) {
  tab = k;
  sel = -1;
  pick = -1;
  render();
}
function renderNav() {
  const tabs = [
    ["up", "Skills"],
    ["play", "Play"],
    ["crew", "Deck"],
    ["summon", "Summon"],
  ];
  $("nav").innerHTML = tabs
    .map(
      ([k, l]) =>
        `<button class="${tab === k ? "on" : ""}" aria-current="${tab === k ? "page" : "false"}" onclick="go('${k}')">${navIcon(k)}<span>${l}</span></button>`,
    )
    .join("");
}
function renderHdr() {
  $("hdr").innerHTML =
    `<div class="player"><div class="player-badge">${portrait("bot")}</div><div><b>DUNEGEAR</b><small>OUTPOST LV. ${S.stage}</small></div></div><span class="engine-status" id="chain-count"></span><div class="resources"><span class="cur" title="Gold — buy gears" aria-label="${fmt(S.gold)} gold"><i class="coin"></i>${fmt(S.gold)}</span><span class="cur" title="Bolts — permanent skills" aria-label="${fmt(S.bolts)} bolts"><i class="bolt"></i>${fmt(S.bolts)}</span><span class="cur" title="Gems — summon fighters" aria-label="${fmt(S.pearls)} gems"><i class="gem"></i>${fmt(S.pearls)}</span></div>`;
  const count = [...powered()].filter(
    (i) => S.board[i] && UNITS[S.board[i].k],
  ).length;
  $("chain-count").textContent = count
    ? `${count} fighter ${count === 1 ? "gear" : "gears"} connected`
    : "Waiting for your first gear";
}
const pieceName = (k) => (k === "cog" ? "Lucky Cog" : UNITS[k].name);
function gearHTML(c, on, index = -1) {
  const motor = c.k === "motor",
    cog = c.k === "cog",
    reverse =
      index >= 0 && (Math.floor(index / COLS) + (index % COLS)) % 2 === 1;
  const material =
    motor || cog
      ? "gold"
      : ["owl", "fox", "drake"].includes(c.k)
        ? "copper"
        : on
          ? "steel"
          : "iron";
  const phase = -((performance.now() / 1000) % 12);
  return `<div class="gear ${motor ? "motor" : cog ? "cog" : ""} ${on ? "on" : ""} ${reverse ? "reverse" : ""}" style="--gear-phase:${phase}s;--spin-direction:${reverse ? "reverse" : "normal"}"><span class="gear-rotor">${cogSVG(material)}</span>${motor || cog ? gearFace(cog) : pixelIcon(c.k, "face")}<span class="lv">Lv.${c.l || 1}</span>${!motor && !cog && on ? `<span class="rate">${spawnRate(c.k, c.l).toFixed(2)}/s</span>` : ""}</div>`;
}
function renderPlay() {
  const net = gearNetwork(),
    on = net.on,
    a = sel >= 0 ? S.board[sel] : null;
  const slots = S.board
    .map((c, i) => {
      const can =
          a && c && i !== sel && c.k === a.k && c.l === a.l && c.l < MAXLV,
        ok = pick >= 0 && canPlace(i);
      const label = c
        ? c.k === "motor"
          ? "Golden drive"
          : `${pieceName(c.k)}, level ${c.l}, ${on.has(i) ? "powered" : "disconnected"}`
        : `Empty slot ${i + 1}`;
      return `<button class="slot ${i === sel ? "sel" : ""} ${can ? "can" : ""} ${ok ? "ok" : ""} ${i === boardPulse && performance.now() < boardPulseUntil ? "placed" : ""}" data-slot="${i}" data-powered="${c && on.has(i) ? "true" : "false"}" data-direction="${net.direction[i]}" aria-label="${label}" aria-pressed="${i === sel}" onclick="tapSlot(${i})" ${battle ? "disabled" : ""}>${c ? gearHTML(c, on.has(i), i) : ""}</button>`;
    })
    .join("");
  const offers = S.offers
    .map((k, i) =>
      k
        ? `<button class="offer ${pick === i ? "picked" : ""}" data-offer="${i}" aria-label="Buy ${pieceName(k)} for ${price()} gold" aria-pressed="${pick === i}" onclick="pickOffer(${i})" ${battle || S.gold < price() ? "disabled" : ""}><small>${pieceName(k)}</small><div class="offer-art">${k === "cog" ? cogSVG("gold") : portrait(k)}</div><span class="offer-level">Lv.1</span><span class="price"><i class="coin"></i> ${price()}</span></button>`
        : `<div class="offer sold">RECRUITED<span>Awaiting refresh</span></div>`,
    )
    .join("");
  const hint =
    pick >= 0
      ? "PLACE NEXT TO A POWERED GEAR"
      : sel >= 0
        ? "MOVE TO A SLOT / MATCH TO MERGE"
        : "DRAG TO PLACE · MATCH GEARS TO MERGE";
  const count = [...on].filter((i) => S.board[i] && UNITS[S.board[i].k]).length;
  return `<section class="play ${battle ? "fighting" : ""}"><div class="mission"><div><small>PIXEL FRONTIER / EXPEDITION ${String(S.stage).padStart(2, "0")}</small><h2>${["THE AMBER DUNES", "SUNSTONE PASS", "THE HOLLOW MESA"][(S.stage - 1) % 3]}</h2></div><button class="help-button" aria-label="How to play" onclick="showHelp()">?</button></div><div class="wavebar"><span class="wave-count">WAVE ${S.wave} / 10</span><div class="prog"><i style="width:${(S.wave - 1) * 10 + 3}%"></i></div><span class="tag">${S.wave === 10 ? "BOSS" : isHard(S.wave) ? "HARD" : battle ? "BATTLE" : "BUILD"}</span></div><div class="battlefield"><canvas id="lane" width="${W}" height="${H}" aria-label="Battlefield. Tap enemies or the enemy tower to deal extra damage." onpointerdown="tapLane(event)"></canvas><div class="battle-label"><span>${battle ? "OUTPOST UNDER SIEGE" : "OUTPOST READY"}<b>LV. ${S.stage}</b></span></div></div><div class="gear-field"><div class="field-decoration">GEAR GRID <span>6 × 4</span><strong>${count} POWERED</strong></div><div class="board" role="group" aria-label="Gear construction board">${gearLinksHTML(net)}${slots}</div><div class="board-caption"><span class="power-lamp"></span>${battle ? "ENGINE RUNNING · CONNECTED GEARS DEPLOY CREW" : hint}</div></div>${battle ? `<div class="combat-dock"><div class="dock-top"><span>COMBAT TELEMETRY</span><span class="live-status">LIVE</span></div><div class="combat-portrait">${portrait("bot")}</div><strong>HOLD THE LINE</strong><div class="combat-telemetry"><span>CREW DEPLOYED <b id="crew-count">${battle.units.filter((u) => !u.side).length}</b></span><span>INCOMING <b id="enemy-count">${battle.left}</b></span><span>GOLD SALVAGED <b>+<span id="battle-gold">${battle.gold}</span></b></span></div><div class="combat-actions"><small>Tap hostiles for extra damage</small><button class="speed-btn" onclick="toggleSpeed()" aria-label="Toggle battle speed">${speed}×</button></div></div>` : `<div class="build-dock"><div class="dock-top"><span>ITEM SHOP</span><strong><i class="coin"></i> ${fmt(S.gold)}</strong></div><div class="shop">${offers}</div><div class="row"><button class="btn blue reroll-btn" onclick="reroll()" ${S.gold < 5 ? "disabled" : ""}><span>↻</span> <i class="coin"></i>5</button><button class="btn green fight-btn" onclick="fight()">${pixelIcon("motor")} FIGHT <span>›</span></button></div><p class="hint">${hint}</p></div>`}</section>`;
}
function renderUp() {
  return `<section class="screen"><div class="screen-heading"><h2>FIELD UPGRADES</h2><span>SKILLS / ${Object.values(S.skills).reduce((a, b) => a + b, 0)}</span></div><p class="screen-sub">Big adventures start with little improvements.<br>Spend bolts on permanent upgrades for your whole tribe.</p><div class="skill-summary">${Object.entries(
    SKILLS,
  )
    .map(
      ([k, s]) =>
        `<div>${s.name}<b>+${S.skills[k] * (k === "dmg" || k === "hp" ? 10 : k === "base" ? 20 : k === "tap" ? 100 : k === "start" ? 10 : 1)}${["inc", "start"].includes(k) ? "" : "%"}</b></div>`,
    )
    .join("")}</div><div class="skill-tree">${Object.entries(SKILLS)
    .map(
      ([k, s]) =>
        `<article class="skill-node"><span class="node-level">LV ${S.skills[k]}</span><span class="skill-symbol">${pixelIcon({ dmg: "bot", hp: "cog", base: "motor", inc: "drake", tap: "fox", start: "summon" }[k])}</span><b>${s.name}</b><small>${s.desc(S.skills[k] + 1)}</small><button onclick="buySkill('${k}')" ${S.bolts < skillCost(k) ? "disabled" : ""}>UPGRADE · ${skillCost(k)} bolts</button></article>`,
    )
    .join(
      "",
    )}</div><p class="hint" style="margin-top:25px">Earn bolts by clearing stages and while you’re away.</p></section>`;
}
function renderCrew() {
  return `<section class="screen"><div class="screen-heading"><h2>CREW ROSTER</h2><span>${Object.keys(S.cards).length} / ${Object.keys(UNITS).length} FOUND</span></div><p class="screen-sub">Small but mighty. Collect copies to level up your fighters.<br>Every unlocked fighter can appear in the gear shop.</p><div class="list">${Object.entries(
    UNITS,
  )
    .map(([k, u]) => {
      const c = S.cards[k],
        m = c ? cardMul(k) : 1;
      return `<article class="card ${u.range > 50 ? "ranged" : ""} ${c ? "" : "locked"}"><span class="card-level">${c ? "LV " + c.lvl : "LOCKED"}</span><div class="card-art">${portrait(k)}</div><b>${u.name}</b><span class="role">${u.kind}</span><small>HP ${Math.round(u.hp * m)} · ATK ${(u.dmg * m).toFixed(1)}<br>${u.rate.toFixed(2)} fighters / sec</small>${c ? `<button onclick="upCard('${k}')" ${c.copies < c.lvl * 2 ? "disabled" : ""}>LEVEL UP · ${c.copies}/${c.lvl * 2} copies</button>` : `<button onclick="go('summon')">Find in Summon ↗</button>`}</article>`;
    })
    .join("")}</div></section>`;
}
function renderSummon() {
  return `<section class="screen summon"><div class="screen-heading"><h2>REINFORCEMENTS</h2><span>SUMMON</span></div><p class="screen-sub">Recruit specialists for the frontier.</p><div class="summon-art ${summonResult ? "summon-result" : ""}"><div class="summon-ring"></div>${portrait(summonResult || "drake")}</div><span class="eyebrow">${summonResult ? "YOUR LATEST RECRUIT" : "WHO WILL ANSWER THE CALL?"}</span><h3>${summonResult ? UNITS[summonResult].name : "BUILD YOUR CREW"}</h3><p>${summonResult ? "A new fighter or a copy for your collection.<br>Visit the deck to see their progress." : "Find a new fighter, or collect a familiar face.<br>Every copy brings your tribe more firepower."}</p><button class="btn green" onclick="summon()" ${S.pearls < 30 ? "disabled" : ""}>SUMMON A FIGHTER <i class="gem"></i> 30</button><p class="odds">Equal chance for all 6 fighters · Copies upgrade your deck<br>Earn 10 gems whenever you clear a stage.</p></section>`;
}
function render() {
  renderNav();
  renderHdr();
  $("main").innerHTML =
    tab === "play"
      ? renderPlay()
      : tab === "up"
        ? renderUp()
        : tab === "crew"
          ? renderCrew()
          : renderSummon();
  drawLane();
}
function toggleSpeed() {
  speed = speed === 1 ? 2 : 1;
  render();
}
function showHelp() {
  const overlay = document.createElement("div");
  overlay.className = "help-dialog";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "How to play");
  overlay.innerHTML = `<div class="help-content"><h2>Build. Merge. Battle.</h2><p><b>1. Recruit</b><br>Drag a shop gear onto a slot next to a golden drive. Or tap a gear, then a slot.</p><p><b>2. Connect & merge</b><br>Gold-lit shafts carry power between connected gears. Move two matching gears together to merge. Gold cogs connect your chain and earn bonus gold.</p><p><b>3. Fight</b><br>Your powered gears spawn fighters automatically. Tap enemies or their tower for extra damage. Win 10 waves to earn bolts and gems.</p><button class="btn green" onclick="closeHelp()">LET’S GO</button></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("button").focus();
}
function closeHelp() {
  document.querySelector(".help-dialog")?.remove();
  document.querySelector(".help-button")?.focus();
}
// Pointer gestures and tap controls use the same economy / merge validation.
function dropGear(source, target) {
  if (
    battle ||
    !source ||
    !Number.isInteger(target) ||
    target < 0 ||
    target >= CELLS
  )
    return;
  if (source.type === "offer") {
    pick = -1;
    sel = -1;
    pickOffer(source.index);
    if (pick >= 0) tapSlot(target);
  } else if (
    source.type === "slot" &&
    source.index !== target &&
    S.board[source.index] &&
    S.board[source.index].k !== "motor"
  ) {
    pick = -1;
    sel = source.index;
    tapSlot(target);
  }
}
let gesture = null,
  suppressClickUntil = 0;
document.addEventListener("pointerdown", (ev) => {
  if (battle || gesture || ev.button !== 0) return;
  const el = ev.target.closest("[data-slot],[data-offer]");
  if (!el || el.disabled) return;
  const type = el.hasAttribute("data-offer") ? "offer" : "slot",
    index = Number(el.dataset[type]);
  if (type === "slot" && (!S.board[index] || S.board[index].k === "motor"))
    return;
  gesture = {
    type,
    index,
    x: ev.clientX,
    y: ev.clientY,
    id: ev.pointerId,
    moved: false,
    ghost: null,
  };
});
document.addEventListener(
  "pointermove",
  (ev) => {
    if (!gesture || gesture.id !== ev.pointerId) return;
    const g = gesture;
    if (!g.moved && Math.hypot(ev.clientX - g.x, ev.clientY - g.y) < 7) return;
    ev.preventDefault();
    if (!g.moved) {
      g.moved = true;
      g.ghost = document.createElement("div");
      g.ghost.className = "drag-ghost";
      const c =
        g.type === "offer" ? { k: S.offers[g.index], l: 1 } : S.board[g.index];
      g.ghost.innerHTML = gearHTML(c, true);
      document.body.appendChild(g.ghost);
      document.body.classList.add("dragging");
    }
    g.ghost.style.left = ev.clientX + "px";
    g.ghost.style.top = ev.clientY + "px";
    document
      .querySelectorAll(".drop-target")
      .forEach((e) => e.classList.remove("drop-target"));
    const target = document
      .elementFromPoint(ev.clientX, ev.clientY)
      ?.closest("[data-slot]");
    if (target) target.classList.add("drop-target");
  },
  { passive: false },
);
function endGesture(ev, cancel = false) {
  if (!gesture || gesture.id !== ev.pointerId) return;
  const g = gesture;
  gesture = null;
  g.ghost?.remove();
  document.body.classList.remove("dragging");
  document
    .querySelectorAll(".drop-target")
    .forEach((e) => e.classList.remove("drop-target"));
  if (g.moved) {
    suppressClickUntil = performance.now() + 300;
    ev.preventDefault();
    if (!cancel) {
      const target = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest("[data-slot]");
      if (target) dropGear(g, Number(target.dataset.slot));
    }
  }
}
document.addEventListener("pointerup", (ev) => endGesture(ev));
document.addEventListener("pointercancel", (ev) => endGesture(ev, true));
document.addEventListener(
  "click",
  (ev) => {
    if (performance.now() < suppressClickUntil) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
  },
  true,
);
document.addEventListener("keydown", (ev) => {
  const dialog = document.querySelector(".help-dialog");
  if (dialog) {
    if (ev.key === "Escape") closeHelp();
    if (ev.key === "Tab") {
      ev.preventDefault();
      dialog.querySelector("button").focus();
    }
    return;
  }
  if (ev.key === "Escape") {
    sel = -1;
    pick = -1;
    render();
  }
});
// ================= idle reward + loop =================
const away = Math.min(480, (Date.now() - S.lastSeen) / 60000),
  awayBolts = Math.floor(away / 10) * S.stage;
if (awayBolts > 0) {
  S.bolts += awayBolts;
  setTimeout(
    () =>
      toast(
        `Welcome back! Your tribe earned ${awayBolts} bolts while you were away.`,
      ),
    300,
  );
}
save();
let last = performance.now(),
  hdrT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000) * speed;
  last = now;
  if (battle) {
    tick(dt);
    drawLane();
    if ((hdrT += dt) > 0.25) {
      hdrT = 0;
      renderHdr();
      const earned = $("battle-gold");
      if (earned && battle) earned.textContent = battle.gold;
      const crew = $("crew-count"),
        enemy = $("enemy-count");
      if (crew && battle)
        crew.textContent = battle.units.filter((u) => !u.side).length;
      if (enemy && battle) enemy.textContent = battle.left;
    }
  } else if (tab === "play") {
    drawLane();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setInterval(save, 15000);
window.addEventListener("pagehide", save);
render();
