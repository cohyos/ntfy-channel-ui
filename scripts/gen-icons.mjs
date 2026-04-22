#!/usr/bin/env node
import sharp from 'sharp';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1e3a8a"/>
  <rect x="128" y="160" width="256" height="32" rx="6" fill="#dbeafe"/>
  <rect x="128" y="224" width="256" height="32" rx="6" fill="#dbeafe"/>
  <rect x="128" y="288" width="192" height="32" rx="6" fill="#dbeafe"/>
  <circle cx="384" cy="128" r="56" fill="#ef4444"/>
</svg>`;

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  await mkdir(resolve(root, 'public/icons'), { recursive: true });
  for (const { name, size } of sizes) {
    const out = resolve(root, 'public/icons', name);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
    console.log('wrote', out);
  }
  await writeFile(resolve(root, 'public/icons/icon.svg'), svg);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
