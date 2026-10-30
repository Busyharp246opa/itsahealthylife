import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("public/exercise-flow");
const catalog = JSON.parse(await readFile("public/data/exercises.json", "utf8"));
const ids = JSON.parse(await readFile("lib/flow-exercise-ids.json", "utf8"));
const manifest = JSON.parse(await readFile(resolve(root, "dataset.json"), "utf8"));
const checksums = JSON.parse(await readFile(resolve(root, "checksums.json"), "utf8"));
const knownIds = new Set(catalog.map((exercise) => exercise.id));

if (ids.length !== manifest.animatedExerciseCount || ids.length + manifest.instructionsOnlyCount !== catalog.length) throw new Error("Flow animation counts do not match the catalog");
if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) throw new Error("Flow animation IDs are not unique catalog records");
if (Object.keys(checksums).length !== ids.length * 3) throw new Error("Flow frame checksum count differs from the animation index");
for (const id of ids) {
  for (let frame = 0; frame < 3; frame++) {
    const name = `assets/${id}/frame-0${frame}.svg`;
    const contents = await readFile(resolve(root, name));
    const actual = createHash("sha256").update(contents).digest("hex");
    if (actual !== checksums[name]) throw new Error(`Invalid Flow frame: ${name}`);
    const svg = contents.toString("utf8");
    if (/<script\b|<foreignObject\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|\/\/)/i.test(svg)) throw new Error(`Unsafe SVG content: ${name}`);
  }
}
const directories = await readdir(resolve(root, "assets"));
if (directories.length !== ids.length) throw new Error("Unindexed Flow animation directory");
for (const required of ["ARTWORK-LICENSE", "LICENSE", "NOTICE.md", "IMPORT.json"]) await readFile(resolve(root, required));
console.log(`Verified ${ids.length} illustrative animations, ${ids.length * 3} SVG frames, and ${manifest.instructionsOnlyCount} written-only records.`);
