// Rendert die PWA-App-Icons aus dem ValCrypta-Siegel (gleiche drei Formen wie
// in src/components/ValCryptaLogo.tsx und public/favicon.svg).
// Aufruf: npm i --no-save sharp && node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const INK = '#131826';
const PORCELAIN = '#F7F8FA';
const BRASS = '#C8A25D';

// V-Siegel im 24er-Raster, zentriert bei (12,12); k skaliert es auf 512.
const seal = (k) => `
  <g transform="translate(256 256) scale(${k}) translate(-12 -12)">
    <path d="M6.2 6.5h3l2.8 7.6 2.8-7.6h3L13.4 17.5h-2.8z" fill="${PORCELAIN}"/>
    <circle cx="12" cy="9.4" r="1.5" fill="${BRASS}"/>
  </g>`;

const appIcon = (k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#1C2334"/>
      <stop offset="100%" stop-color="${INK}"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${seal(k)}
</svg>`;

mkdirSync('public', { recursive: true });

const targets = [
  // Normale Icons: V füllt das Quadrat sichtbar (k=30 → ~64 % Kantenlänge).
  { file: 'public/icon-192.png', size: 192, svg: appIcon(30) },
  { file: 'public/icon-512.png', size: 512, svg: appIcon(30) },
  { file: 'public/apple-touch-icon.png', size: 180, svg: appIcon(30) },
  // Maskable: Motiv bleibt in der 80-%-Safe-Zone (k=25).
  { file: 'public/icon-maskable-192.png', size: 192, svg: appIcon(25) },
  { file: 'public/icon-maskable-512.png', size: 512, svg: appIcon(25) },
];

for (const { file, size, svg } of targets) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(file, png);
  console.log(`${file} (${size}x${size}, ${png.length} bytes)`);
}
