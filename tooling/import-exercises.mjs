import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePath = path.join(root, "vendor", "exercises-dataset", "data", "exercises.json");
const outputPath = path.join(root, "public", "data", "exercises.json");
const manifestPath = path.join(root, "vendor", "exercises-dataset", "source-manifest.json");
const languages = ["en", "es", "it", "tr", "ru", "zh", "hi", "pl", "ko", "fr"];
const bodyParts = new Set([
  "back", "cardio", "chest", "lower arms", "lower legs", "neck",
  "shoulders", "upper arms", "upper legs", "waist",
]);
const mediaAttribution = "© Gym visual — https://gymvisual.com/";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const ids = new Set();
const failures = [];

for (const exercise of source) {
  if (!/^\d{4}$/.test(exercise.id) || ids.has(exercise.id)) failures.push(`${exercise.id}: invalid or duplicate id`);
  ids.add(exercise.id);
  if (!bodyParts.has(exercise.body_part)) failures.push(`${exercise.id}: invalid body part ${exercise.body_part}`);
  if (exercise.category !== exercise.body_part) failures.push(`${exercise.id}: category must match body part`);
  if (!/^images\/.+\.(jpg|jpeg|png)$/i.test(exercise.image)) failures.push(`${exercise.id}: invalid image path`);
  if (!/^videos\/.+\.gif$/i.test(exercise.gif_url)) failures.push(`${exercise.id}: invalid GIF path`);
  if (exercise.attribution !== mediaAttribution) failures.push(`${exercise.id}: missing media attribution`);
  if (!exercise.media_id?.trim()) failures.push(`${exercise.id}: missing media id`);
  if (!exercise.created_at || Number.isNaN(Date.parse(exercise.created_at))) failures.push(`${exercise.id}: invalid source timestamp`);
  for (const language of languages) {
    if (!exercise.instructions?.[language]?.trim()) failures.push(`${exercise.id}: missing ${language} instructions`);
    if (!Array.isArray(exercise.instruction_steps?.[language]) || exercise.instruction_steps[language].length === 0) {
      failures.push(`${exercise.id}: missing ${language} steps`);
    }
  }
}

if (source.length !== manifest.expectedRecordCount) failures.push(`expected ${manifest.expectedRecordCount} records, found ${source.length}`);
if (failures.length) {
  console.error(failures.slice(0, 25).join("\n"));
  process.exit(1);
}

const catalog = source.map((exercise) => ({
  id: exercise.id,
  name: exercise.name,
  category: exercise.category,
  bodyPart: exercise.body_part,
  equipment: exercise.equipment,
  target: exercise.target,
  muscleGroup: exercise.muscle_group,
  secondaryMuscles: exercise.secondary_muscles,
  instructions: exercise.instructions,
  steps: exercise.instruction_steps,
  mediaId: exercise.media_id,
  imagePath: exercise.image,
  gifPath: exercise.gif_url,
  mediaAttribution: exercise.attribution,
  sourceCreatedAt: exercise.created_at,
  contentHash: createHash("sha256").update(JSON.stringify(exercise)).digest("hex").slice(0, 16),
}));

if ((process.argv[2] ?? "validate") === "build") {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(catalog));
  console.log(`Published ${catalog.length} exercises with media metadata and ${languages.length} instruction languages to ${outputPath}`);
} else {
  console.log(`Validated ${source.length} exercises from ${manifest.commit}`);
}
