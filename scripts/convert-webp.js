const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "public", "backgrounds");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg"));

async function convert() {
  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(".jpg", ".webp"));
    await sharp(input).webp({ quality: 80 }).toFile(output);
    const before = (fs.statSync(input).size / 1024 / 1024).toFixed(2);
    const after = (fs.statSync(output).size / 1024 / 1024).toFixed(2);
    console.log(`${file}: ${before}MB → ${after}MB`);
  }
}

convert().catch(console.error);
