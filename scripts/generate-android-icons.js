import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const inputPath = join(rootDir, 'public/assets/PEGGASUSD_Logo.png');
const androidResDir = join(rootDir, 'android/app/src/main/res');

const mipmapDirs = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function generateAndroidIcons() {
  if (!existsSync(androidResDir)) {
    console.log('Android res directory not found. Run `npx cap add android` first.');
    process.exit(1);
  }

  console.log('Generating Android app icons...');

  for (const { dir, size } of mipmapDirs) {
    const outDir = join(androidResDir, dir);
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 7, g: 9, b: 13, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'ic_launcher.png'));

    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 7, g: 9, b: 13, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'));

    console.log(`  Created ${dir}/ic_launcher.png (${size}x${size})`);
  }

  console.log('Android icons generated successfully!');
}

generateAndroidIcons().catch(err => {
  console.error('Error generating Android icons:', err);
  process.exit(1);
});
