/**
 * Style Dictionary Build Script
 *
 * Generates multi-platform design token exports from tokens.json:
 * CSS, SCSS, JavaScript, iOS JSON, Android XML.
 *
 * Usage:
 *   node src/design-tokens/build.js
 *
 * Output: dist/tokens/
 */

import StyleDictionary from 'style-dictionary';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import config from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// Resolve paths relative to project root
process.chdir(ROOT);

async function build() {
  try {
    const sd = new StyleDictionary(config);
    await sd.buildAllPlatforms();

    console.log('\n✅ Design tokens built successfully.');
    console.log('   Output: dist/tokens/');
    console.log('   Platforms: CSS, SCSS, JavaScript, iOS JSON, Android XML');
  } catch (err) {
    console.error('❌ Token build failed:', err.message);
    process.exit(1);
  }
}

build();
