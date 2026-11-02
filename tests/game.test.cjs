const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
function game(saved) {
  const html = fs.readFileSync("index.html", "utf8");
  const source = fs.existsSync("game.js")
    ? fs.readFileSync("game.js", "utf8")
    : html.match(/<script>([\s\S]*)<\/script>/)[1];
  const storage = {};
  if (saved) storage["tidegear-save-v2"] = JSON.stringify(saved);
  const el = {
    innerHTML: "",
    classList: { toggle() {} },
    getContext: () => null,
  };
  const c = vm.createContext({
    console,
    Math,
    Date,
    performance: { now: () => 0 },
    localStorage: {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => (storage[k] = v),
    },
    document: {
      getElementById: () => el,
      querySelectorAll: () => [],
      addEventListener() {},
    },
    window: { addEventListener() {} },
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval() {},
    requestAnimationFrame() {},
    navigator: {},
  });
  vm.runInContext(source.replace(/render\(\);\s*$/, ""), c);
  vm.runInContext("render=()=>{}; toast=()=>{};", c);
  return { run: (code) => vm.runInContext(code, c), storage };
}
test("disconnected crew does not power; a bridge powers the whole component", () => {
  const g = game();
  assert.equal(g.run("S.board[0]={k:'bot',l:1}; powered().has(0)"), false);
  assert.equal(g.run("S.board[1]={k:'cog',l:1}; powered().has(0)"), true);
});
test("buying deducts gold once and rejects an unpowered slot", () => {
  const g = game();
  g.run("S.offers=['bot','bot','cog']; pickOffer(0); tapSlot(23)");
  assert.equal(g.run("S.gold"), 40);
  g.run("tapSlot(1)");
  assert.equal(g.run("S.gold"), 30);
  assert.equal(g.run("S.board[1].k"), "bot");
});
test("matching gears merge and max-level gears cannot merge", () => {
  const g = game();
  g.run(
    "S.board[1]={k:'bot',l:1};S.board[2]={k:'bot',l:1};tapSlot(1);tapSlot(2)",
  );
  assert.equal(g.run("S.board[2].l"), 2);
  assert.equal(g.run("S.board[1]"), null);
  g.run(
    "S.board[1]={k:'bot',l:6};S.board[2]={k:'bot',l:6};tapSlot(1);tapSlot(2)",
  );
  assert.equal(g.run("S.board[1].l"), 6);
  assert.equal(g.run("S.board[2].l"), 6);
});
test("first wave can be won by connected starter crew without tapping", () => {
  const g = game();
  g.run(
    "S.board[1]={k:'bot',l:1};S.board[3]={k:'crab',l:1};fight();for(let i=0;i<2400&&battle;i++)tick(.1)",
  );
  assert.equal(g.run("S.wave"), 2);
  assert.equal(g.run("battle"), null);
});
test("drag destination shares purchase and merge rules", () => {
  const g = game();
  assert.equal(g.run("typeof dropGear"), "function");
  g.run(
    "S.offers=['bot','bot','cog'];dropGear({type:'offer',index:0},1);dropGear({type:'offer',index:1},2);dropGear({type:'slot',index:1},2)",
  );
  assert.equal(g.run("S.board[2].l"), 2);
  assert.equal(g.run("S.gold"), 19);
});
test("malformed saved state falls back to a playable board", () => {
  const g = game({ board: [], gold: -1 });
  assert.equal(g.run("S.board.length"), 24);
  assert.equal(g.run("S.gold"), 40);
});
test("loss preserves kill gold and permits retrying the same wave", () => {
  const g = game();
  g.run(
    "S.board[1]={k:'bot',l:1};fight();battle.gold=3;S.gold+=3;battle.base=0;tick(.01)",
  );
  assert.equal(g.run("S.wave"), 1);
  assert.equal(g.run("S.gold"), 43);
  assert.equal(g.run("battle"), null);
  g.run("fight()");
  assert.equal(g.run("battle!==null"), true);
});
test("boss victory grants permanent currencies and resets the next stage", () => {
  const g = game();
  g.run("S.wave=10;S.board[1]={k:'bot',l:1};fight();battle.fort=0;tick(.01)");
  assert.equal(g.run("S.stage"), 2);
  assert.equal(g.run("S.wave"), 1);
  assert.equal(g.run("S.bolts"), 5);
  assert.equal(g.run("S.pearls"), 70);
  assert.equal(g.run("S.gold"), 40);
  assert.equal(g.run('S.board.filter(c=>c&&c.k!=="motor").length'), 0);
});
test("saving and reloading preserves purchased gears and currencies", () => {
  const g = game();
  g.run("dropGear({type:'offer',index:0},1);save()");
  const loaded = game(JSON.parse(g.storage["tidegear-save-v2"]));
  assert.equal(loaded.run("S.board[1].k"), "bot");
  assert.equal(loaded.run("S.gold"), 30);
});
test("gear graph connects occupied orthogonal neighbors once and counter-rotates", () => {
  const g = game();
  assert.equal(g.run("typeof gearNetwork"), "function");
  g.run(
    "S.board[1]={k:'bot',l:1};S.board[2]={k:'cog',l:1};S.board[23]={k:'crab',l:1}",
  );
  assert.equal(
    g.run("gearNetwork().edges.map(e=>e.a+'-'+e.b).sort().join(',')"),
    "1-2,1-7",
  );
  assert.equal(g.run("gearNetwork().on.has(23)"), false);
  assert.equal(
    g.run("gearNetwork().direction[1] === -gearNetwork().direction[2]"),
    true,
  );
  assert.equal(
    g.run("gearNetwork().direction[1] === -gearNetwork().direction[7]"),
    true,
  );
});
test("breaking a bridge removes power from its downstream gears", () => {
  const g = game();
  g.run("S.board[1]={k:'cog',l:1};S.board[0]={k:'bot',l:1}");
  assert.equal(g.run("gearNetwork().on.has(0)"), true);
  g.run("S.board[1]=null");
  assert.equal(g.run("gearNetwork().on.has(0)"), false);
  assert.equal(g.run("gearNetwork().edges.length"), 0);
});
test("attack animation and projectile effects expire without changing damage timing", () => {
  const g = game();
  g.run(
    "S.board[1]={k:'bot',l:1};fight();const shooter={em:'bot',x:100,y:275};visualAttack(shooter,200,275)",
  );
  assert.equal(g.run("shooter.attackT"), 0.3);
  assert.equal(g.run("battle.shots.length"), 1);
  assert.equal(g.run("battle.particles.length"), 4);
  g.run("tick(.4)");
  assert.equal(g.run("battle.shots.length"), 0);
  assert.equal(g.run("battle.particles.length"), 0);
  g.run("const target=mkEnemy(battle.w);const before=target.hp;hit(target,2)");
  assert.equal(g.run("before-target.hp"), 2);
  assert.equal(g.run("target.hitT"), 0.16);
});
