#!/usr/bin/env node
/**
 * Script de génération des icônes OUTSIDE.
 * Génère les icônes officielles jour/nuit en SVG puis les rasterise en PNG.
 *
 * Dépendance : sharp (déjà installé via Next.js)
 * Usage : node scripts/generate-icons.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const BRAND_DIR = path.join(ROOT, "public", "brand");
const OUT_DIR = path.join(ROOT, "public", "icons");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src", "app");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// --- SVG inline pour l'icône OUTSIDE ---
// Cercle avec flèche de sortie stylisée

function dayIconSvg(size = 512) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const arrowW = size * 0.14;
  const arrowLen = size * 0.28;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="dayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#FF006E"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#FAFAFA"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#dayGrad)"/>
  <g transform="translate(${cx},${cy}) rotate(-45)">
    <rect x="-${arrowW/2}" y="-${arrowLen/2}" width="${arrowW}" height="${arrowLen}" rx="${arrowW/2}" fill="white"/>
    <polygon points="0,-${arrowLen*0.75} ${arrowLen*0.35},-${arrowLen*0.35} -${arrowLen*0.35},-${arrowLen*0.35}" fill="white"/>
  </g>
  <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.55}" r="${size * 0.06}" fill="white" opacity="0.9"/>
</svg>`;
}

function nightIconSvg(size = 512) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const arrowW = size * 0.14;
  const arrowLen = size * 0.28;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="nightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9500"/>
      <stop offset="100%" stop-color="#FF2D7D"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0A0A0F"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#nightGrad)" filter="url(#glow)"/>
  <g transform="translate(${cx},${cy}) rotate(-45)">
    <rect x="-${arrowW/2}" y="-${arrowLen/2}" width="${arrowW}" height="${arrowLen}" rx="${arrowW/2}" fill="white"/>
    <polygon points="0,-${arrowLen*0.75} ${arrowLen*0.35},-${arrowLen*0.35} -${arrowLen*0.35},-${arrowLen*0.35}" fill="white"/>
  </g>
  <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.55}" r="${size * 0.06}" fill="white" opacity="0.9" filter="url(#glow)"/>
</svg>`;
}

async function svgToPng(svgString, outPath, size = 512, bg = null) {
  let img = sharp(Buffer.from(svgString)).resize(size, size, { fit: "fill" });
  if (bg) {
    img = img.flatten({ background: bg });
  }
  await img.png().toFile(outPath);
}

async function generate() {
  console.log("OUTSIDE Icon Generator");
  console.log("======================");

  ensureDir(BRAND_DIR);
  ensureDir(OUT_DIR);

  const day512 = dayIconSvg(512);
  const night512 = nightIconSvg(512);

  // --- Brand icons ---
  console.log("→ public/brand/outside-icon-day.png");
  await svgToPng(day512, path.join(BRAND_DIR, "outside-icon-day.png"), 512);

  console.log("→ public/brand/outside-icon-night.png");
  await svgToPng(night512, path.join(BRAND_DIR, "outside-icon-night.png"), 512);

  // --- Next.js metadata icons ---
  console.log("→ src/app/icon.png (512x512 light)");
  await svgToPng(day512, path.join(APP_DIR, "icon.png"), 512);

  console.log("→ src/app/apple-icon.png (180x180 light)");
  await svgToPng(day512, path.join(APP_DIR, "apple-icon.png"), 180);

  // --- Favicon ---
  console.log("→ public/favicon-32x32.png");
  await svgToPng(day512, path.join(PUBLIC_DIR, "favicon-32x32.png"), 32);

  console.log("→ public/favicon-16x16.png");
  await svgToPng(day512, path.join(PUBLIC_DIR, "favicon-16x16.png"), 16);

  console.log("→ public/favicon-dark.png (32x32 dark)");
  await svgToPng(night512, path.join(PUBLIC_DIR, "favicon-dark.png"), 32);

  // --- ICO favicon (fallback PNG car sharp ne supporte pas ICO ici) ---
  console.log("→ src/app/favicon.ico.png (fallback PNG)");
  await svgToPng(day512, path.join(APP_DIR, "favicon.png"), 48);

  // --- Manifest / PWA icons ---
  console.log("→ public/icons/icon-192.png");
  await svgToPng(day512, path.join(OUT_DIR, "icon-192.png"), 192);

  console.log("→ public/icons/icon-512.png");
  await svgToPng(day512, path.join(OUT_DIR, "icon-512.png"), 512);

  // --- Maskable (avec padding blanc) ---
  console.log("→ public/icons/maskable-192.png");
  const mask192 = await sharp(Buffer.from(day512))
    .resize(154, 154, { fit: "fill" })
    .extend({ top: 19, bottom: 19, left: 19, right: 19, background: { r: 250, g: 250, b: 250, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "maskable-192.png"), mask192);

  console.log("→ public/icons/maskable-512.png");
  const mask512 = await sharp(Buffer.from(day512))
    .resize(410, 410, { fit: "fill" })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 250, g: 250, b: 250, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "maskable-512.png"), mask512);

  // --- Monochrome ---
  console.log("→ public/icons/monochrome-192.png");
  await sharp(Buffer.from(day512))
    .resize(192, 192, { fit: "fill" })
    .greyscale()
    .png()
    .toFile(path.join(OUT_DIR, "monochrome-192.png"));

  console.log("→ public/icons/monochrome-512.png");
  await sharp(Buffer.from(day512))
    .resize(512, 512, { fit: "fill" })
    .greyscale()
    .png()
    .toFile(path.join(OUT_DIR, "monochrome-512.png"));

  // --- Shortcut icons ---
  console.log("→ public/icons/shortcut-create.png");
  await svgToPng(day512, path.join(OUT_DIR, "shortcut-create.png"), 96);

  console.log("→ public/icons/shortcut-explore.png");
  await svgToPng(day512, path.join(OUT_DIR, "shortcut-explore.png"), 96);

  console.log("\n✅ Toutes les icônes ont été générées.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
