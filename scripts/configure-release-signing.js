/**
 * Configures Android release signing from env vars.
 *
 * Reads:
 *   - KEYSTORE_BASE64  — base64-encoded .keystore file
 *   - KEYSTORE_PASSWORD
 *   - KEY_ALIAS        — default: peggasusd
 *   - KEY_PASSWORD
 *
 * Decodes the keystore into android/app/ and patches build.gradle
 * to wire up signingConfigs.release.
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_GRADLE = join(ROOT, 'android', 'app', 'build.gradle');

function fail(msg) {
  console.error(`[release-signing] ERROR: ${msg}`);
  process.exit(1);
}

// ── 1. Decode keystore ──────────────────────────────────────────
const keystoreB64 = process.env.KEYSTORE_BASE64;
if (!keystoreB64) {
  console.log('[release-signing] KEYSTORE_BASE64 not set — skipping release signing config');
  process.exit(0);
}

const keystorePassword = process.env.KEYSTORE_PASSWORD || fail('KEYSTORE_PASSWORD not set');
const keyAlias = process.env.KEY_ALIAS || 'peggasusd';
const keyPassword = process.env.KEY_PASSWORD || keystorePassword;

const keystorePath = join(ROOT, 'android', 'app', 'peggasusd-release.keystore');
writeFileSync(keystorePath, Buffer.from(keystoreB64, 'base64'));
console.log(`[release-signing] Keystore written to ${keystorePath}`);

// ── 2. Patch build.gradle ──────────────────────────────────────
if (!existsSync(BUILD_GRADLE)) fail(`build.gradle not found at ${BUILD_GRADLE}`);

let gradle = readFileSync(BUILD_GRADLE, 'utf-8');

const signingConfigBlock = `
    signingConfigs {
        release {
            storeFile file('peggasusd-release.keystore')
            storePassword '${keystorePassword}'
            keyAlias '${keyAlias}'
            keyPassword '${keyPassword}'
        }
    }
`;

// Insert signingConfigs after the namespace/defaultConfig block, before buildTypes
if (gradle.includes('signingConfigs {')) {
  console.log('[release-signing] signingConfigs already present, skipping');
} else {
  gradle = gradle.replace(
    /(^\s+buildTypes\s*\{)/m,
    `${signingConfigBlock}\n$1`,
  );
}

// Wire signingConfig to release buildType
const wired = 'signingConfig signingConfigs.release';
if (gradle.includes(wired)) {
  console.log('[release-signing] signingConfig already wired, skipping');
} else {
  // Only target the `release` block that belongs to `buildTypes`
  gradle = gradle.replace(
    /(buildTypes\s*\{[\s\S]*?)(release\s*\{)/,
    `$1$2\n            ${wired}`,
  );
}

writeFileSync(BUILD_GRADLE, gradle, 'utf-8');
console.log('[release-signing] build.gradle patched successfully');
