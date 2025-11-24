#!/usr/bin/env node

/**
 * Simple placeholder icon generator using SVG
 * Creates Agnes-21 PWA icons in all required sizes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg-gradient)" rx="${size * 0.15}"/>

  <!-- Text -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${size * 0.35}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
    filter="url(#shadow)">
    A21
  </text>

  <!-- Small subtitle -->
  <text
    x="50%"
    y="${size * 0.75}"
    font-family="Arial, sans-serif"
    font-size="${size * 0.12}"
    font-weight="normal"
    fill="rgba(255,255,255,0.8)"
    text-anchor="middle"
    dominant-baseline="central">
    TRAINING
  </text>
</svg>`;

  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);
  const svgFilename = path.join(iconsDir, `icon-${size}x${size}.svg`);

  // Save SVG
  fs.writeFileSync(svgFilename, svg);
  console.log(`Created ${svgFilename}`);
});

console.log('\nSVG icons created successfully!');
console.log('To convert to PNG, you can:');
console.log('1. Use an online converter like https://cloudconvert.com/svg-to-png');
console.log('2. Or install a library like "sharp" or "canvas" for Node.js conversion');
console.log('3. Or use ImageMagick: for f in public/icons/*.svg; do convert "$f" "${f%.svg}.png"; done');
console.log('\nFor now, the SVGs will work as placeholders in most browsers.');
