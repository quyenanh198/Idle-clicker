const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const runtimeFiles = [
  "index.html",
  "styles.css",
  "game.js",
  "art.js",
  "assets/pixel/frontier.png",
  "assets/pixel/soldiers.png",
  "assets/pixel/forts.png",
  "assets/pixel/gears.png",
];
function build(projectRoot = path.resolve(__dirname, "..")) {
  const root = path.resolve(projectRoot),
    output = path.resolve(root, "dist");
  if (path.dirname(output) !== root || path.basename(output) !== "dist")
    throw new Error("Output must be the project dist directory");
  for (const file of runtimeFiles) {
    const source = path.join(root, file);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile())
      throw new Error("Missing runtime file: " + file);
  }
  for (const file of ["game.js", "art.js"])
    execFileSync(process.execPath, ["--check", path.join(root, file)], {
      stdio: "pipe",
    });
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())
    throw new Error("Refusing to replace a symlinked dist directory");
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const file of runtimeFiles) {
    const dest = path.join(output, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, file), dest);
  }
  return {
    directory: output,
    files: runtimeFiles.length,
    bytes: runtimeFiles.reduce(
      (sum, file) => sum + fs.statSync(path.join(output, file)).size,
      0,
    ),
  };
}
if (require.main === module) {
  const result = build();
  console.log(
    `Built ${result.files} files (${result.bytes} bytes) into ${result.directory}`,
  );
}
module.exports = { build };
