// Renders scripts/og-default.svg → public/img/og-default.png at 1200x630.
// Uses sharp (already a transitive dep) with high density so text is
// supersampled for crisp edges. Re-run any time the SVG changes:
//   node scripts/render-og.mjs

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('scripts/og-default.svg');

const png = await sharp(svg, { density: 600 })
  .resize(1200, 630, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync('public/img/og-default.png', png);
console.log(
  `Wrote public/img/og-default.png — ${(png.length / 1024).toFixed(0)} KB`,
);
