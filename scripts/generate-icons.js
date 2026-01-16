#!/usr/bin/env node

/**
 * Icon Generator Script
 * Generates all required PWA icons from a source image
 *
 * Usage:
 *   node scripts/generate-icons.js [source-image.png]
 *
 * Requirements:
 *   npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Additional sizes for completeness
const ADDITIONAL_SIZES = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'apple-touch-icon.png': 180,
  'badge-72x72.png': 72,
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public');

async function generateIcons(sourceImage) {
  console.log('🎨 PWA Icon Generator\n');

  // Check if source image exists
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Error: Source image not found: ${sourceImage}`);
    console.log('\nUsage: node scripts/generate-icons.js <source-image.png>');
    process.exit(1);
  }

  // Check if sharp is installed
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ Error: sharp package is not installed');
    console.log('\nPlease install it first:');
    console.log('  npm install sharp --save-dev\n');
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`📁 Source: ${sourceImage}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  let successCount = 0;
  let errorCount = 0;

  // Generate main icons
  console.log('Generating main icons...');
  for (const size of ICON_SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ Generated icon-${size}x${size}.png`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to generate ${size}x${size}: ${error.message}`);
      errorCount++;
    }
  }

  // Generate additional icons
  console.log('\nGenerating additional icons...');
  for (const [filename, size] of Object.entries(ADDITIONAL_SIZES)) {
    try {
      const outputPath = path.join(OUTPUT_DIR, filename);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ Generated ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to generate ${filename}: ${error.message}`);
      errorCount++;
    }
  }

  // Generate maskable icons (with padding for Android)
  console.log('\nGenerating maskable icons...');
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    try {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.png`);

      // Add 20% padding for safe zone
      const padding = Math.floor(size * 0.2);
      const innerSize = size - (padding * 2);

      await sharp(sourceImage)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      console.log(`  ✓ Generated icon-${size}x${size}-maskable.png`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to generate maskable ${size}x${size}: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Generation complete!`);
  console.log(`   Success: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log('='.repeat(50) + '\n');

  // Next steps
  console.log('📝 Next steps:');
  console.log('   1. Check the generated icons in the public/ directory');
  console.log('   2. Update manifest.json if needed');
  console.log('   3. Test your PWA with Lighthouse');
  console.log('   4. Deploy and enjoy! 🚀\n');
}

// Get source image from command line argument
const args = process.argv.slice(2);
const sourceImage = args[0] || 'source.png';

// Run the generator
generateIcons(sourceImage).catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
