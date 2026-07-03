import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const inputPath = join(rootDir, 'public/assets/PEGGASUSD_Logo.png');
const androidResDir = join(rootDir, 'android/app/src/main/res');
const bgColor = '#07090D';

// Legacy mipmap icons (for Android < 8)
const legacyMipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// Adaptive icon foreground sizes (108dp area)
const adaptiveMipmaps = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

async function generateAndroidIcons() {
  if (!existsSync(androidResDir)) {
    console.log('Android res directory not found. Run `npx cap add android` first.');
    process.exit(1);
  }

  console.log('Generating Android app icons...');

  // 1. Legacy icons (pre-API 26)
  for (const { dir, size } of legacyMipmaps) {
    const outDir = join(androidResDir, dir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 7, g: 9, b: 13, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'ic_launcher.png'));
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 7, g: 9, b: 13, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'));
    console.log(`  ${dir}/ic_launcher.png (${size}x${size})`);
  }

  // 2. Adaptive icon foreground (API 26+)
  for (const { dir, size } of adaptiveMipmaps) {
    const outDir = join(androidResDir, dir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(outDir, 'ic_launcher_foreground.png'));
    console.log(`  ${dir}/ic_launcher_foreground.png (${size}x${size})`);
  }

  // 3. Background color drawable
  const drawableDir = join(androidResDir, 'drawable');
  if (!existsSync(drawableDir)) mkdirSync(drawableDir, { recursive: true });
  writeFileSync(join(drawableDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">${bgColor}</color>\n</resources>\n`);
  console.log('  drawable/ic_launcher_background.xml');

  // 4. Adaptive icon XML (mipmap-anydpi-v26)
  const anydpiDir = join(androidResDir, 'mipmap-anydpi-v26');
  if (!existsSync(anydpiDir)) mkdirSync(anydpiDir, { recursive: true });

  const adaptiveXml = () => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

  writeFileSync(join(anydpiDir, 'ic_launcher.xml'), adaptiveXml(false));
  writeFileSync(join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml(true));
  console.log('  mipmap-anydpi-v26/ic_launcher.xml (+ round)');

  // 5. Splash screen image (for SplashScreen plugin)
  const splashSizes = [
    { dir: 'drawable-mdpi', size: 240 },
    { dir: 'drawable-hdpi', size: 360 },
    { dir: 'drawable-xhdpi', size: 480 },
    { dir: 'drawable-xxhdpi', size: 720 },
    { dir: 'drawable-xxxhdpi', size: 960 },
  ];
  for (const { dir, size } of splashSizes) {
    const outDir = join(androidResDir, dir);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 7, g: 9, b: 13, alpha: 1 } })
      .png()
      .toFile(join(outDir, 'splash.png'));
    console.log(`  ${dir}/splash.png (${size}x${size})`);
  }

  console.log('Android icons generated successfully!');
}

generateAndroidIcons().catch(err => {
  console.error('Error generating Android icons:', err);
  process.exit(1);
});
