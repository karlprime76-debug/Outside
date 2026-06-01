#!/usr/bin/env node
/**
 * Script de génération des icônes OUTSIDE à partir des sources officielles.
 *
 * Dépendance : sharp (déjà installé via Next.js)
 *
 * Usage :
 *   1. Copier les 2 images sources dans public/icons/raw/ :
 *      - outside-dark.png  (version dark, fond noir, glow néon)
 *      - outside-light.png (version light, fond blanc, flat)
 *   2. node scripts/generate-icons.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "public", "icons", "raw");
const OUT_DIR = path.join(ROOT, "public", "icons");
const PUBLIC_DIR = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src", "app");

const SOURCE_LIGHT = path.join(RAW_DIR, "outside-light.png");
const SOURCE_DARK = path.join(RAW_DIR, "outside-dark.png");

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function exists(file) {
  return fs.promises.access(file).then(() => true).catch(() => false);
}

async function generate() {
  console.log("OUTSIDE Icon Generator");
  console.log("======================");

  if (!(await exists(SOURCE_LIGHT))) {
    console.error(`
❌ Fichier manquant : ${SOURCE_LIGHT}

Copie les 2 images sources dans public/icons/raw/ :
  - outside-light.png (version claire, fond blanc)
  - outside-dark.png  (version sombre, fond noir)

Puis relance : node scripts/generate-icons.js
`);
    process.exit(1);
  }

  if (!(await exists(SOURCE_DARK))) {
    console.error(`
❌ Fichier manquant : ${SOURCE_DARK}

Copie les 2 images sources dans public/icons/raw/ :
  - outside-light.png (version claire, fond blanc)
  - outside-dark.png  (version sombre, fond noir)

Puis relance : node scripts/generate-icons.js
`);
    process.exit(1);
  }

  await ensureDir(OUT_DIR);

  const light = sharp(SOURCE_LIGHT);
  const dark = sharp(SOURCE_DARK);

  // Récupérer les métadonnées
  const lightMeta = await light.metadata();
  const darkMeta = await dark.metadata();
  console.log(`Source light : ${lightMeta.width}x${lightMeta.height}`);
  console.log(`Source dark  : ${darkMeta.width}x${darkMeta.height}`);

  // --- Favicon standard (multisize ICO) ---
  console.log("→ favicon.ico (multisize 16, 32, 48)");
  const faviconIco = path.join(APP_DIR, "favicon.ico");
  const faviconBuf = await light
    .clone()
    .resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFormat("ico", { sizes: [16, 32, 48] })
    .toBuffer();
  fs.writeFileSync(faviconIco, faviconBuf);

  // --- Favicon PNG ---
  console.log("→ favicon-16x16.png");
  await light
    .clone()
    .resize(16, 16, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, "favicon-16x16.png"));

  console.log("→ favicon-32x32.png");
  await light
    .clone()
    .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, "favicon-32x32.png"));

  console.log("→ favicon-dark.png (32x32 dark mode)");
  await dark
    .clone()
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC_DIR, "favicon-dark.png"));

  // --- Apple Touch Icon ---
  console.log("→ apple-icon.png (180x180)");
  await light
    .clone()
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(APP_DIR, "apple-icon.png"));

  // --- Next.js icon.png (metadata) ---
  console.log("→ icon.png (512x512)");
  await light
    .clone()
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(APP_DIR, "icon.png"));

  // --- Manifest icons ---
  console.log("→ icons/icon-192.png");
  await light
    .clone()
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, "icon-192.png"));

  console.log("→ icons/icon-512.png");
  await light
    .clone()
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, "icon-512.png"));

  // --- Maskable icons (safe area ~10% padding) ---
  console.log("→ icons/maskable-192.png");
  const mask192 = await light
    .clone()
    .resize(154, 154, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({ top: 19, bottom: 19, left: 19, right: 19, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "maskable-192.png"), mask192);

  console.log("→ icons/maskable-512.png");
  const mask512 = await light
    .clone()
    .resize(410, 410, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "maskable-512.png"), mask512);

  // --- Monochrome (pour Android themed icons) ---
  console.log("→ icons/monochrome-192.png");
  await light
    .clone()
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .greyscale()
    .png()
    .toFile(path.join(OUT_DIR, "monochrome-192.png"));

  console.log("→ icons/monochrome-512.png");
  await light
    .clone()
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .greyscale()
    .png()
    .toFile(path.join(OUT_DIR, "monochrome-512.png"));

  // --- Shortcut icons ---
  console.log("→ icons/shortcut-create.png");
  await light
    .clone()
    .resize(96, 96, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, "shortcut-create.png"));

  console.log("→ icons/shortcut-explore.png");
  await light
    .clone()
    .resize(96, 96, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(OUT_DIR, "shortcut-explore.png"));

  console.log("\n✅ Toutes les icônes ont été générées.");
  console.log("\nFichiers créés :");
  console.log("  src/app/favicon.ico");
  console.log("  src/app/apple-icon.png");
  console.log("  src/app/icon.png");
  console.log("  public/favicon-16x16.png");
  console.log("  public/favicon-32x32.png");
  console.log("  public/favicon-dark.png");
  console.log("  public/icons/icon-192.png");
  console.log("  public/icons/icon-512.png");
  console.log("  public/icons/maskable-192.png");
  console.log("  public/icons/maskable-512.png");
  console.log("  public/icons/monochrome-192.png");
  console.log("  public/icons/monochrome-512.png");
  console.log("  public/icons/shortcut-create.png");
  console.log("  public/icons/shortcut-explore.png");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
