import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const publicRoot = path.join(root, "public");
const clientRoot = path.join(root, "dist", "client");
const assetPattern = /["'](\/assets\/[^"']+)["']/g;
const sourceExtensions = new Set([".ts", ".tsx", ".css"]);
const liveAssets = new Set();

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

for (const file of walk(sourceRoot)) {
  if (!sourceExtensions.has(path.extname(file))) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(assetPattern)) {
    liveAssets.add(match[1].slice(1).split("/").join(path.sep));
  }
}

let removedFiles = 0;
let removedBytes = 0;

for (const file of walk(clientRoot)) {
  const relative = path.relative(clientRoot, file);
  const publicFile = path.join(publicRoot, relative);
  if (!existsSync(publicFile) || liveAssets.has(relative)) continue;

  const resolved = path.resolve(file);
  if (!resolved.startsWith(`${path.resolve(clientRoot)}${path.sep}`)) {
    throw new Error(`Refusing to prune outside dist/client: ${resolved}`);
  }

  removedBytes += statSync(file).size;
  rmSync(file);
  removedFiles += 1;
}

const missing = [...liveAssets].filter(
  (relative) => !existsSync(path.join(clientRoot, relative)),
);
if (missing.length) {
  throw new Error(`Missing live Sites assets:\n${missing.join("\n")}`);
}

console.log(
  `Pruned ${removedFiles} unused public assets (${(
    removedBytes /
    1024 /
    1024
  ).toFixed(2)} MiB) from the Sites build.`,
);
