import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceDirectory = resolve('Sample UI', '04-landing');
const publicOrigin = 'https://itsahealthylife.vercel.app';
const assetBase = '/Sample%20UI/04-landing/';

for (const page of ['index', 'about', '404']) {
  const source = readFileSync(resolve(sourceDirectory, `${page}.html`), 'utf8');
  let html = source
    .replace(/<meta name="robots" content="noindex, nofollow">/g, '')
    .replaceAll('href="./index.html', 'href="/')
    .replaceAll('href="./about.html', 'href="/about')
    .replaceAll('href="./404.html', 'href="/404')
    .replaceAll('href="./assets/', `href="${assetBase}assets/`)
    .replaceAll('src="./assets/', `src="${assetBase}assets/`)
    .replaceAll('srcset="./assets/', `srcset="${assetBase}assets/`)
    .replaceAll('href="./style.css', `href="${assetBase}style.css`)
    .replaceAll('src="./app.js', `src="${assetBase}app.js`)
    .replaceAll('src="./assets/gsap.min.js', `src="${assetBase}assets/gsap.min.js`)
    .replaceAll(' · LANDING PAGE CONCEPT', '')
    .replace(/<a href="https:\/\/www\.itsahealthylife\.co\.uk\/" target="_blank" rel="noopener noreferrer">Original website ↗<\/a>/g, '');

  const path = page === 'index' ? '/' : page === 'about' ? '/about' : '/404';
  html = html
    .replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="${publicOrigin}${path}">`)
    .replace(/<meta property="og:image" content="([^"]+)">/, `<meta property="og:image" content="${publicOrigin}$1">\n  <meta property="og:url" content="${publicOrigin}${path}">`)
    .replace(/^[ \t]+$/gm, '');

  if (page === '404') html = html.replace('<head>', '<head><meta name="robots" content="noindex">');
  writeFileSync(resolve(`${page}.html`), html);
}

console.log('Prepared public landing, story, and 404 pages from the approved design.');
