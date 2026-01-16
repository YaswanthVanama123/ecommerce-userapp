#!/usr/bin/env node

/**
 * Placeholder Icon Generator
 * Creates simple placeholder icons for PWA development
 * No dependencies required - uses Canvas API
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// SVG template for placeholder icon
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white">
    E
  </text>
  <text x="50%" y="65%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="${size * 0.12}" fill="rgba(255,255,255,0.9)">
    commerce
  </text>
</svg>`;
}

async function generatePlaceholderIcons() {
  console.log('🎨 Placeholder Icon Generator\n');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`📁 Output: ${OUTPUT_DIR}\n`);
  console.log('Generating placeholder icons...\n');

  let successCount = 0;

  for (const size of ICON_SIZES) {
    try {
      const svg = generateSVG(size);
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      // Save as SVG (browsers support SVG icons)
      const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svg);

      console.log(`  ✓ Generated icon-${size}x${size}.svg (temporary)`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to generate ${size}x${size}: ${error.message}`);
    }
  }

  // Create a basic PNG fallback using data URI
  console.log('\n⚠️  Note: SVG icons generated as temporary placeholders');
  console.log('   For production, please generate proper PNG icons using:');
  console.log('   - scripts/generate-icons.js (requires sharp package)');
  console.log('   - Online tools like PWA Asset Generator');
  console.log('   - Design software (Figma, Sketch, etc.)\n');

  console.log('='.repeat(50));
  console.log(`✨ Generated ${successCount} placeholder icons`);
  console.log('='.repeat(50) + '\n');
}

// Run the generator
generatePlaceholderIcons().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
