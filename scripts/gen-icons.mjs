import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

const svg = readFileSync('public/icons/icon.svg');

// Standard icons — circle on transparent background
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png');

// Maskable icon — full-bleed coral background (safe zone: 10% inset on each side)
const maskableSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#e34432"/>
  <text
    x="256" y="310"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="180"
    font-weight="700"
    fill="white"
    text-anchor="middle"
    dominant-baseline="auto">SF</text>
</svg>
`);
await sharp(maskableSvg).resize(512, 512).png().toFile('public/icons/icon-512-maskable.png');

console.log('Icons generated: icon-192.png, icon-512.png, icon-512-maskable.png');
