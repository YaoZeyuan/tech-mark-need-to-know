import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(rootDir, "readme.html");
const targetDir = resolve(rootDir, "dist");
const target = resolve(targetDir, "readme.html");
const builtIndex = resolve(targetDir, "index.html");

if (!existsSync(source)) {
  throw new Error("readme.html not found in project root.");
}

mkdirSync(targetDir, { recursive: true });

if (!existsSync(target)) {
  copyFileSync(existsSync(builtIndex) ? builtIndex : source, target);
}

console.log("Ensured dist/readme.html");
