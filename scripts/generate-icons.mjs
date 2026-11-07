// Rendert Logo, Favicon und PWA-App-Icons aus dem Eulen-Stich in public/owl.svg
// ("Perched owl", Baltimore 1832, via font-revival.com, MIT, (c) 2026 Harold Lehmann).
// public/owl.svg bleibt unverändert die Quelle (einfarbig, currentColor) und dient
// zugleich als Maske für das Hero-Wasserzeichen (.owl-watermark in src/index.css).
// Aufruf: npm i --no-save sharp && node scripts/generate-icons.mjs [vorschau-ordner]
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const owl = readFileSync('public/owl.svg', 'utf8');
const d = owl.match(/ d="([^"]+)"/)[1];
const meta = owl.match(/<metadata>([\s\S]*?)<\/metadata>/)[1];

// Motiv-Grenzen im viewBox-Raum der Quelle: x 68..1861, y -1544..-248.
// Ausschnitt: Eule groß und mittig, der Ast läuft links aus dem Bild.
// cx/cy = Mittelpunkt des Ausschnitts, side = Kantenlänge (größer = kleinere Eule).
const crop = (side, cx = 1205, cy = -905) => {
  const k = 512 / side;
  return `translate(256 256) scale(${k.toFixed(5)}) translate(${-cx} ${-cy})`;
};

const tile = ({ side, rx = 0, cx, cy }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <title>ValCrypta</title>
  <metadata>Eule: ${meta}</metadata>
  <defs>
    <radialGradient id="ink" cx="50%" cy="34%" r="78%">
      <stop offset="0" stop-color="#222B40"/>
      <stop offset="0.6" stop-color="#141A29"/>
      <stop offset="1" stop-color="#0B0F19"/>
    </radialGradient>
    <linearGradient id="brass" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ECD7A6"/>
      <stop offset="0.5" stop-color="#D4B06C"/>
      <stop offset="1" stop-color="#B8924A"/>
    </linearGradient>
    <clipPath id="tile"><rect width="512" height="512" rx="${rx}"/></clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="512" height="512" fill="url(#ink)"/>
    <g transform="${crop(side, cx, cy)}">
      <path transform="scale(1,-1)" fill="url(#brass)" d="${d}"/>
    </g>
  </g>
</svg>
`;

// Messing-Verlauf läuft über das ganze Motiv: oben hell, unten satt. y1/y2 sind
// vertauscht, weil der Pfad der Quelle mit scale(1,-1) gespiegelt ist.
const full = tile({ side: 1780 });        // Kachel ohne Rundung (App-Icons; iOS/Android runden selbst)
// Favicon (auch Logo-Komponente in der App): rund, enger auf die Eule, damit Kopf
// und Augen bei 16 bis 32 px lesbar bleiben.
const favicon = tile({ side: 1700, rx: 256, cx: 1165, cy: -925 });
const maskable = tile({ side: 2050 });    // Eule bleibt in der 80-%-Safe-Zone

writeFileSync('public/favicon.svg', favicon);

const out = process.argv[2];
const targets = [
  { file: 'public/icon-192.png', size: 192, svg: full },
  { file: 'public/icon-512.png', size: 512, svg: full },
  { file: 'public/apple-touch-icon.png', size: 180, svg: full },
  { file: 'public/icon-maskable-192.png', size: 192, svg: maskable },
  { file: 'public/icon-maskable-512.png', size: 512, svg: maskable },
];
if (out) {
  mkdirSync(out, { recursive: true });
  for (const s of [16, 32, 48]) targets.push({ file: `${out}/favicon-${s}.png`, size: s, svg: favicon });
}

for (const { file, size, svg } of targets) {
  const png = await sharp(Buffer.from(svg), { density: 72 * Math.max(1, size / 512) * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(file, png);
  console.log(`${file} (${size}x${size}, ${png.length} bytes)`);
}
