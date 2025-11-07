import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import extensions from "./index.js";

const currentFileUrl = import.meta.url;
// When running from dist, go up to project root, then into src
const projectRoot = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../..");
const outputPath = path.join(projectRoot, "src", "extensions.json");

const jsonContent = JSON.stringify(extensions, null, 2);

fs.writeFileSync(outputPath, jsonContent + "\n", "utf-8");

console.log(`✓ Generated extensions.json at ${outputPath}`);
console.log(`  Total extensions: ${extensions.length}`);
