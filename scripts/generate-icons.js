// Generates app icons and splash screen using sharp
// Run: node scripts/generate-icons.js

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ANDROID_ICON_DIR = path.resolve("android/app/src/main/res");
const PUBLIC_DIR = path.resolve("public");

// Android mipmap densities and their sizes
const ICON_SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const FOREGROUND_SIZES = {
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

async function generateIcon(size, outputPath, isForeground = false) {
  const s = size;
  const pad = Math.round(s * 0.18);
  const inner = s - pad * 2;
  const r = Math.round(inner * 0.22);

  // Create a gradient icon: rounded rect with gradient background
  // and a centered stylized "O" letter
  const svg = `
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F97316"/>
          <stop offset="50%" stop-color="#F43F5E"/>
          <stop offset="100%" stop-color="#8B5CF6"/>
        </linearGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <!-- Background gradient circle -->
      <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" ry="${r}" fill="url(#bg)"/>
      <!-- Shine overlay -->
      <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" ry="${r}" fill="url(#shine)"/>
      <!-- Stylized "O" letter -->
      <text x="${s / 2}" y="${s / 2 + Math.round(s * 0.28)}" 
            text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-weight="800" 
            font-size="${Math.round(inner * 0.65)}" 
            fill="white"
            letter-spacing="-4">O</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function generateSplash(size, outputPath) {
  const s = size;
  const logoSize = Math.round(s * 0.2);
  const logoPad = Math.round(logoSize * 0.18);
  const logoInner = logoSize - logoPad * 2;
  const logoR = Math.round(logoInner * 0.22);
  const logoX = Math.round((s - logoSize) / 2);
  const logoY = Math.round((s - logoSize) / 2);

  const svg = `
    <svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${s}" height="${s}" fill="#08080C"/>
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F97316"/>
          <stop offset="50%" stop-color="#F43F5E"/>
          <stop offset="100%" stop-color="#8B5CF6"/>
        </linearGradient>
      </defs>
      <!-- Ambient glow -->
      <circle cx="${s / 2}" cy="${s / 2}" r="${Math.round(s * 0.35)}" fill="rgba(249,115,22,0.08)" filter="blur(40px)"/>
      <circle cx="${s / 2}" cy="${s / 2}" r="${Math.round(s * 0.25)}" fill="rgba(139,92,246,0.06)" filter="blur(30px)"/>
      <!-- Logo -->
      <rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${logoR}" ry="${logoR}" fill="url(#bg)"/>
      <text x="${s / 2}" y="${s / 2 + Math.round(logoSize * 0.42)}" 
            text-anchor="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-weight="800" 
            font-size="${Math.round(logoInner * 0.65)}" 
            fill="white"
            letter-spacing="-2">O</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(outputPath);
}

async function main() {
  console.log("Generating app icons...");

  // Generate adaptive icon backgrounds and foregrounds
  for (const [density, size] of Object.entries(ICON_SIZES)) {
    const bgPath = path.join(ANDROID_ICON_DIR, density, "ic_launcher_background.png");
    const fgPath = path.join(ANDROID_ICON_DIR, density, "ic_launcher_foreground.png");
    const roundPath = path.join(ANDROID_ICON_DIR, density, "ic_launcher_round.png");

    await generateIcon(size, fgPath, true);
    console.log(`  ✓ ${density}/ic_launcher_foreground.png (${size}x${size})`);

    // Round icon = same as regular
    await fs.promises.copyFile(fgPath, roundPath);
    console.log(`  ✓ ${density}/ic_launcher_round.png`);

    // Generate solid background
    const bgSize = FOREGROUND_SIZES[density] || size * 3;
    const bgSvg = `<svg width="${bgSize}" height="${bgSize}" viewBox="0 0 ${bgSize} ${bgSize}" xmlns="http://www.w3.org/2000/svg"><rect width="${bgSize}" height="${bgSize}" fill="#08080C"/></svg>`;
    await sharp(Buffer.from(bgSvg)).resize(size, size).png().toFile(bgPath);
    console.log(`  ✓ ${density}/ic_launcher_background.png (${size}x${size})`);
  }

  // Generate legacy launcher icons (for older Android)
  const legacySizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };

  for (const [density, size] of Object.entries(legacySizes)) {
    const iconPath = path.join(ANDROID_ICON_DIR, density, "ic_launcher.png");
    await generateIcon(size, iconPath);
    console.log(`  ✓ ${density}/ic_launcher.png (legacy)`);
  }

  // Generate splash screen (1080x1920 for typical phone)
  const splashSizes = [
    { dir: "drawable-land-hdpi", w: 800, h: 480 },
    { dir: "drawable-land-mdpi", w: 480, h: 320 },
    { dir: "drawable-land-xhdpi", w: 1280, h: 720 },
    { dir: "drawable-land-xxhdpi", w: 1600, h: 960 },
    { dir: "drawable-land-xxxhdpi", w: 1920, h: 1280 },
    { dir: "drawable-port-hdpi", w: 480, h: 800 },
    { dir: "drawable-port-mdpi", w: 320, h: 480 },
    { dir: "drawable-port-xhdpi", w: 720, h: 1280 },
    { dir: "drawable-port-xxhdpi", w: 960, h: 1600 },
    { dir: "drawable-port-xxxhdpi", w: 1280, h: 1920 },
  ];

  for (const { dir, w, h } of splashSizes) {
    const splashPath = path.join(ANDROID_ICON_DIR, dir, "splash.png");
    // Create splash at the larger dimension
    const size = Math.max(w, h);
    const square = Math.max(size, 720);
    await generateSplash(square, splashPath);
    console.log(`  ✓ ${dir}/splash.png (${w}x${h})`);
  }

  // Also generate the default splash in drawable
  const defaultSplash = path.join(ANDROID_ICON_DIR, "drawable", "splash.png");
  await generateSplash(720, defaultSplash);
  console.log(`  ✓ drawable/splash.png`);

  // Generate PWA icons in public/
  const pwaSizes = [192, 512];
  for (const size of pwaSizes) {
    const pwaPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
    await generateIcon(size, pwaPath);
    console.log(`  ✓ public/icon-${size}.png`);
  }

  console.log("\n✅ All icons generated!");
}

main().catch(console.error);
