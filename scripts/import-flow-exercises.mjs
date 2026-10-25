import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const source = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: node scripts/import-flow-exercises.mjs /path/to/flow-exercise-dataset');
const project = path.resolve(import.meta.dirname, '..');
const sourceExercises = JSON.parse(await readFile(path.join(source, 'data/exercises.json'), 'utf8'));
const targetPath = path.join(project, 'public/data/exercises.json');
const targetExercises = JSON.parse(await readFile(targetPath, 'utf8'));
const sourceById = new Map(sourceExercises.map(exercise => [exercise.id, exercise]));
if (sourceById.size !== 1324 || targetExercises.length !== 1324) throw new Error('Unexpected catalog size');
let animated = 0;
for (const exercise of targetExercises) {
  const item = sourceById.get(exercise.id);
  if (!item || item.name !== exercise.name) throw new Error(`Exercise mapping mismatch: ${exercise.id}`);
  if (item.animation) {
    const { frames, sequence, frameDurationMs } = item.animation;
    if (frames.length !== 3 || frames.some((frame, index) => frame !== `assets/${exercise.id}/frame-0${index}.svg`) || sequence.join(',') !== '0,1,2,1' || frameDurationMs !== 180) throw new Error(`Unexpected animation metadata: ${exercise.id}`);
    exercise.animation = { frames, sequence, frameDurationMs };
    animated++;
  } else {
    delete exercise.animation;
  }
}
if (animated !== 1257) throw new Error(`Expected 1,257 animations; got ${animated}`);
const output = `${JSON.stringify(targetExercises)}\n`;
const destination = path.join(project, 'public/data/flow');
await mkdir(destination, { recursive: true });
await cp(path.join(source, 'assets'), path.join(destination, 'assets'), { recursive: true });
await cp(path.join(source, 'provenance'), path.join(destination, 'provenance'), { recursive: true });
await cp(path.join(source, 'prompts'), path.join(destination, 'prompts'), { recursive: true });
for (const file of ['ARTWORK-LICENSE', 'LICENSE', 'NOTICE.md']) await cp(path.join(source, file), path.join(destination, file));
for (const file of ['dataset.json', 'checksums.json']) await cp(path.join(source, 'data', file), path.join(destination, file));
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
await writeFile(path.join(destination, 'IMPORT.json'), `${JSON.stringify({ repository: 'https://github.com/ozansozuozgit/flow-exercise-dataset', commit, exercises: targetExercises.length, animations: animated, instructionsOnly: targetExercises.length - animated }, null, 2)}\n`);
await writeFile(targetPath, output);
await writeFile(path.join(project, 'Sample UI/shared/exercises.json'), output);
console.log(`Imported ${animated} animations and ${targetExercises.length - animated} instruction-only records from ${commit}`);
