const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dunegear-build-"));
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
  });
  for (const f of [
    "index.html",
    "styles.css",
    "game.js",
    "art.js",
    "assets/pixel/frontier.png",
    "assets/pixel/soldiers.png",
    "assets/pixel/forts.png",
    "assets/pixel/gears.png",
  ]) {
    const dest = path.join(root, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(
      dest,
      f.endsWith(".js") ? "const valid = true;" : Buffer.from([0, 1, 2, 3]),
    );
  }
  return root;
}
test("build fails before replacing a previous artifact if an asset is missing", (t) => {
  assert.ok(
    fs.existsSync("scripts/build.cjs"),
    "static build command must exist",
  );
  const { build } = require("../scripts/build.cjs"),
    root = fixture(t);
  fs.mkdirSync(path.join(root, "dist"));
  fs.writeFileSync(path.join(root, "dist", "previous.txt"), "keep");
  fs.unlinkSync(path.join(root, "assets/pixel/gears.png"));
  assert.throws(() => build(root), /Missing runtime file/);
  assert.equal(
    fs.readFileSync(path.join(root, "dist", "previous.txt"), "utf8"),
    "keep",
  );
});
test("build creates a clean runtime-only distribution including binary sprites", (t) => {
  assert.ok(
    fs.existsSync("scripts/build.cjs"),
    "static build command must exist",
  );
  const { build } = require("../scripts/build.cjs"),
    root = fixture(t);
  fs.mkdirSync(path.join(root, "dist"));
  fs.writeFileSync(path.join(root, "dist", "stale.txt"), "old");
  fs.mkdirSync(path.join(root, ".git"));
  fs.writeFileSync(path.join(root, ".git", "private"), "exclude");
  build(root);
  assert.equal(fs.existsSync(path.join(root, "dist", ".git")), false);
  assert.equal(fs.existsSync(path.join(root, "dist", "stale.txt")), false);
  assert.deepEqual(
    fs.readFileSync(path.join(root, "dist", "assets/pixel/gears.png")),
    fs.readFileSync(path.join(root, "assets/pixel/gears.png")),
  );
  assert.ok(fs.existsSync(path.join(root, "dist", "index.html")));
});
