#!/usr/bin/env node
/**
 * Script de génération des icônes OUTSIDE depuis le logo uploadé.
 * Usage : node scripts/generate-logo-icons.js
 *
 * Prérequis : placer l'image source à public/brand/outside-logo.png
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "brand", "outside-logo.png");
const OUT_DIR = path.join(ROOT, "public", "icons");
const APP_DIR = path.join(ROOT, "src", "app");
const PUBLIC_DIR = path.join(ROOT, "public");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generate() {
  if (!fs.existsSync(SOURCE)) {
    console.error("❌ Image source introuvable : public/brand/outside-logo.png");
    console.error("   Place ton logo à cet emplacement et relance le script.");
    process.exit(1);
  }

  console.log("OUTSIDE Logo Icon Generator");
  console.log("============================");
  ensureDir(OUT_DIR);

  const buffer = fs.readFileSync(SOURCE);

  // --- Next.js metadata icons ---
  console.log("→ src/app/icon.png (512x512)");
  await sharp(buffer).resize(512, 512, { fit: "cover" }).png().toFile(path.join(APP_DIR, "icon.png"));

  console.log("→ src/app/apple-icon.png (180x180)");
  await sharp(buffer).resize(180, 180, { fit: "cover" }).png().toFile(path.join(APP_DIR, "apple-icon.png"));

  console.log("→ src/app/favicon.png (48x48)");
  await sharp(buffer).resize(48, 48, { fit: "cover" }).png().toFile(path.join(APP_DIR, "favicon.png"));

  // --- Favicons ---
  console.log("→ public/favicon-32x32.png");
  await sharp(buffer).resize(32, 32, { fit: "cover" }).png().toFile(path.join(PUBLIC_DIR, "favicon-32x32.png"));

  console.log("→ public/favicon-16x16.png");
  await sharp(buffer).resize(16, 16, { fit: "cover" }).png().toFile(path.join(PUBLIC_DIR, "favicon-16x16.png"));

  // --- Manifest / PWA icons ---
  console.log("→ public/icons/icon-192.png");
  await sharp(buffer).resize(192, 192, { fit: "cover" }).png().toFile(path.join(OUT_DIR, "icon-192.png"));

  console.log("→ public/icons/icon-512.png");
  await sharp(buffer).resize(512, 512, { fit: "cover" }).png().toFile(path.join(OUT_DIR, "icon-512.png"));

  // --- Maskable (avec padding transparent) ---
  console.log("→ public/icons/maskable-192.png");
  await sharp(buffer)
    .resize(154, 154, { fit: "cover" })
    .extend({ top: 19, bottom: 19, left: 19, right: 19, background: { r: 10, g: 10, b: 15, alpha: 1 } })
    .png()
    .toFile(path.join(OUT_DIR, "maskable-192.png"));

  console.log("→ public/icons/maskable-512.png");
  await sharp(buffer)
    .resize(410, 410, { fit: "cover" })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 10, g: 10, b: 15, alpha: 1 } })
    .png()
    .toFile(path.join(OUT_DIR, "maskable-512.png"));

  // --- Monochrome ---
  console.log("→ public/icons/monochrome-192.png");
  await sharp(buffer).resize(192, 192, { fit: "cover" }).greyscale().png().toFile(path.join(OUT_DIR, "monochrome-192.png"));

  console.log("→ public/icons/monochrome-512.png");
  await sharp(buffer).resize(512, 512, { fit: "cover" }).greyscale().png().toFile(path.join(OUT_DIR, "monochrome-512.png"));

  // --- Shortcuts ---
  console.log("→ public/icons/shortcut-create.png");
  await sharp(buffer).resize(96, 96, { fit: "cover" }).png().toFile(path.join(OUT_DIR, "shortcut-create.png"));

  console.log("→ public/icons/shortcut-explore.png");
  await sharp(buffer).resize(96, 96, { fit: "cover" }).png().toFile(path.join(OUT_DIR, "shortcut-explore.png"));

  console.log("\n✅ Toutes les icônes ont été générées depuis ton logo.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
