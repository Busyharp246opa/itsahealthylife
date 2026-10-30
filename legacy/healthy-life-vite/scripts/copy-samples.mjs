import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('Sample UI');
const destination = resolve('dist', 'Sample UI');

if (!existsSync(source)) throw new Error('Sample UI source directory is missing');
mkdirSync(resolve('dist'), { recursive: true });
cpSync(source, destination, { recursive: true, force: true });
console.log('Copied standalone Sample UI pages into dist.');
